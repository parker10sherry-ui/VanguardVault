"use client";

import { useState } from "react";
import type { Card, PlayerInfo } from "@/lib/types";
import type { EbayComp } from "@/lib/cardTypes";

export function useEbayComps(players: Record<string, PlayerInfo>) {
  const [ebayComps, setEbayComps] = useState<EbayComp[]>([]);
  const [ebayCompsLoading, setEbayCompsLoading] = useState(false);
  const [ebayCompsError, setEbayCompsError] = useState<string | null>(null);
  const [ebayCompsAvg, setEbayCompsAvg] = useState<number | null>(null);
  const [ebayCompsLow, setEbayCompsLow] = useState<number | null>(null);
  const [ebayCompsHigh, setEbayCompsHigh] = useState<number | null>(null);
  const [ebayCompsTotal, setEbayCompsTotal] = useState(0);
  const [ebayCompsOpen, setEbayCompsOpen] = useState(false);

  const reset = () => {
    setEbayComps([]);
    setEbayCompsLoading(false);
    setEbayCompsError(null);
    setEbayCompsAvg(null);
    setEbayCompsLow(null);
    setEbayCompsHigh(null);
    setEbayCompsTotal(0);
    setEbayCompsOpen(false);
  };

  const fetchEbayComps = async (card: Card) => {
    setEbayCompsLoading(true);
    setEbayCompsError(null);
    setEbayComps([]);
    setEbayCompsAvg(null);
    setEbayCompsLow(null);
    setEbayCompsHigh(null);
    setEbayCompsTotal(0);

    try {
      const info = players[card.player];
      const playerName = info?.full || card.player;
      const query = `${playerName} ${card.year} ${card.product}`.trim();
      const gradeParam = `&grade=${card.psa}`;

      const res = await fetch(`/api/ebay-prices?q=${encodeURIComponent(query)}&limit=20${gradeParam}`);
      if (!res.ok) throw new Error("Failed to fetch eBay comps");
      const data = await res.json();

      const results = data.results || [];
      setEbayComps(results);
      setEbayCompsTotal(data.total || 0);

      if (results.length > 0) {
        const prices = results.map((r: { price: number }) => r.price).filter((p: number) => p > 0);
        if (prices.length > 0) {
          setEbayCompsAvg(Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length));
          setEbayCompsLow(Math.min(...prices));
          setEbayCompsHigh(Math.max(...prices));
        }
      }
    } catch (err) {
      setEbayCompsError(err instanceof Error ? err.message : "Failed to load eBay comps");
    } finally {
      setEbayCompsLoading(false);
    }
  };

  return {
    ebayComps, ebayCompsLoading, ebayCompsError,
    ebayCompsAvg, ebayCompsLow, ebayCompsHigh, ebayCompsTotal,
    ebayCompsOpen, setEbayCompsOpen, reset, fetchEbayComps,
  };
}
