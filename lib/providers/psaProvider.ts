// ============================================================
// psaProvider.ts — Client-side PSA provider
//
// This provider calls YOUR OWN /api/psa-cards endpoint.
// It NEVER calls PSA's API directly from the browser.
// All PSA credentials stay server-side.
//
// How it works:
//   1. Loads cards from Local seed data (which have values/prices)
//   2. For any cards that have cert numbers, enriches them with
//      PSA-verified grade, player, product, and population data
//   3. PSA does NOT provide pricing — values come from local data
// ============================================================

import type { Card, PlayerInfo, DataProvider, PSAApiResponse, PSAEnrichedCard } from "@/lib/types";
import { SEED_PLAYERS, SEED_CARDS } from "@/lib/data";

export const PSAProvider: DataProvider = {
  name: "PSA Verified",
  canSave: false,

  async fetchPlayers(): Promise<Record<string, PlayerInfo>> {
    // PSA doesn't manage player metadata — use seed data + localStorage
    const players = { ...SEED_PLAYERS };
    try {
      const saved = localStorage.getItem("vanguardVault_userPlayers");
      if (saved) Object.assign(players, JSON.parse(saved));
    } catch { /* ignore */ }
    return players;
  },

  async fetchCards(): Promise<Card[]> {
    // Start with all local cards (seed + user-added)
    const cards = [...SEED_CARDS];
    try {
      const saved = localStorage.getItem("vanguardVault_userCards");
      if (saved) cards.push(...JSON.parse(saved));
    } catch { /* ignore */ }

    // Collect cert numbers from cards that have them
    const certsToLookup: string[] = [];
    const certToCardIndices = new Map<string, number[]>();

    cards.forEach((card, index) => {
      if (card.certNumber) {
        const cert = card.certNumber.trim();
        if (!certToCardIndices.has(cert)) {
          certToCardIndices.set(cert, []);
          certsToLookup.push(cert);
        }
        certToCardIndices.get(cert)!.push(index);
      }
    });

    // If no cards have cert numbers, return local data as-is
    if (certsToLookup.length === 0) {
      return cards;
    }

    // Call our server-side PSA proxy
    try {
      const res = await fetch(`/api/psa-cards?certs=${certsToLookup.join(",")}`);
      const data: PSAApiResponse = await res.json();

      // If PSA is not configured, return local data
      if (data.configured === false) {
        console.warn("PSA not configured:", data.error);
        return cards;
      }

      // Enrich cards with PSA data
      if (data.cards && data.cards.length > 0) {
        const psaMap = new Map<string, PSAEnrichedCard>();
        data.cards.forEach(pc => psaMap.set(pc.certNumber, pc));

        for (const [cert, indices] of certToCardIndices) {
          const psaData = psaMap.get(cert);
          if (psaData) {
            for (const idx of indices) {
              // Enrich with PSA-verified data, but KEEP local pricing
              cards[idx] = {
                ...cards[idx],
                psa: parseGrade(psaData.grade),
                _source: "psa",
                _psaVerified: true,
                _psaImageUrl: psaData.imageUrl || undefined,
                _psaPopulation: psaData.population,
                _psaPopHigher: psaData.populationHigher,
                _updatedAt: psaData.lastUpdated,
                // PSA does NOT provide these — keep local values:
                // value, pct, range are untouched
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn("PSA enrichment failed, using local data:", err);
      // Non-fatal — return local data without PSA enrichment
    }

    return cards;
  },

  async saveCard(): Promise<void> {
    throw new Error("PSAProvider is read-only. Cards are saved via LocalProvider.");
  },
};

function parseGrade(grade: string): number {
  // PSA grades come as strings like "10", "GEM-MT 10", "MINT 9", etc.
  const match = grade.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
