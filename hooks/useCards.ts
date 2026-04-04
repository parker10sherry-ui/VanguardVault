"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Card, PlayerInfo, DataStatus, DataProvider } from "@/lib/types";
import { LocalProvider, MockProvider, AltProvider, PSAProvider, SupabaseProvider } from "@/lib/providers";

const PROVIDERS: Record<string, DataProvider> = {
  supabase: SupabaseProvider,
  local: LocalProvider,
  mock: MockProvider,
  psa: PSAProvider,
  alt: AltProvider,
};

export { PROVIDERS };

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerInfo>>({});
  const [status, setStatus] = useState<DataStatus>({
    source: "Supabase",
    lastUpdated: null,
    loading: true,
    error: null,
  });
  const [activeProvider, setActiveProvider] = useState("supabase");

  const loadData = useCallback(async (providerKey: string) => {
    const provider = PROVIDERS[providerKey];
    setStatus((s) => ({ ...s, loading: true, error: null }));

    try {
      const [fetchedCards, fetchedPlayers] = await Promise.all([
        provider.fetchCards(),
        provider.fetchPlayers(),
      ]);

      let mergedCards = fetchedCards;
      let mergedPlayers = fetchedPlayers;

      if (providerKey !== "local") {
        try {
          const saved = localStorage.getItem("vanguardVault_userCards");
          if (saved) mergedCards = [...mergedCards, ...JSON.parse(saved)];
          const savedP = localStorage.getItem("vanguardVault_userPlayers");
          if (savedP) mergedPlayers = { ...mergedPlayers, ...JSON.parse(savedP) };
        } catch {
          /* ignore */
        }
      }

      setCards(mergedCards);
      setPlayers(mergedPlayers);
      setStatus({
        source: provider.name,
        lastUpdated: new Date(),
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";

      try {
        const [fallbackCards, fallbackPlayers] = await Promise.all([
          LocalProvider.fetchCards(),
          LocalProvider.fetchPlayers(),
        ]);
        setCards(fallbackCards);
        setPlayers(fallbackPlayers);
        setStatus({
          source: "Local (fallback)",
          lastUpdated: new Date(),
          loading: false,
          error: `${provider.name}: ${message}`,
        });
      } catch {
        setCards([]);
        setPlayers({});
        setStatus({
          source: "Error",
          lastUpdated: null,
          loading: false,
          error: message,
        });
      }
    }
  }, []);

  useEffect(() => {
    loadData(activeProvider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Batch-fetch PSA images for cards that have cert numbers but no image
  useEffect(() => {
    const cardsNeedingImages = cards
      .map((c, i) => ({ cert: c.certNumber, index: i, hasImage: !!(c.frontImageUrl || c._psaImageUrl) }))
      .filter((c) => c.cert && !c.hasImage);

    if (cardsNeedingImages.length === 0) return;

    const certs = cardsNeedingImages.map((c) => c.cert).join(",");
    fetch(`/api/psa-cards?certs=${certs}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.cards || data.cards.length === 0) return;
        const imageMap = new Map<string, string>();
        for (const psaCard of data.cards) {
          if (psaCard.imageUrl) {
            imageMap.set(psaCard.certNumber, psaCard.imageUrl);
          }
        }
        if (imageMap.size === 0) return;
        setCards((prev) => {
          const updated = [...prev];
          for (const item of cardsNeedingImages) {
            const url = imageMap.get(item.cert!);
            if (url && updated[item.index]) {
              updated[item.index] = { ...updated[item.index], _psaImageUrl: url };
            }
          }
          return updated;
        });
      })
      .catch(() => { /* non-fatal */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  const handleProviderChange = async (key: string) => {
    setActiveProvider(key);
    await loadData(key);
  };

  const handleRefresh = () => loadData(activeProvider);

  const filterPlayers = useMemo(() => {
    const seen = new Set<string>();
    const keys = cards
      .filter((c) => {
        if (seen.has(c.player)) return false;
        seen.add(c.player);
        return true;
      })
      .map((c) => c.player);
    return keys.sort((a, b) => {
      const nameA = (players[a]?.full || a).toLowerCase();
      const nameB = (players[b]?.full || b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [cards, players]);

  const playerNames = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(players)
      .filter((p) => {
        if (seen.has(p.full)) return false;
        seen.add(p.full);
        return true;
      })
      .map((p) => p.full);
  }, [players]);

  return {
    cards, setCards, players, setPlayers, status, activeProvider,
    loadData, handleProviderChange, handleRefresh,
    filterPlayers, playerNames,
  };
}
