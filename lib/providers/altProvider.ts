// ============================================================
// altProvider.ts — Client-side Alt provider
//
// This provider calls YOUR OWN /api/alt-cards endpoint.
// It NEVER calls Alt's API directly from the browser.
// All Alt credentials stay server-side.
// ============================================================

import type { Card, PlayerInfo, DataProvider, AltApiResponse } from "@/lib/types";
import { SEED_PLAYERS } from "@/lib/data";

function generatePlayerKey(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

export const AltProvider: DataProvider = {
  name: "Alt",
  canSave: false,

  async fetchPlayers(): Promise<Record<string, PlayerInfo>> {
    // Alt doesn't manage player metadata — use seed data
    return { ...SEED_PLAYERS };
  },

  async fetchCards(): Promise<Card[]> {
    // Call our internal API proxy — never Alt directly
    const res = await fetch("/api/alt-cards");

    if (!res.ok && res.status !== 503) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data: AltApiResponse = await res.json();

    // Handle not-configured state
    if (data.configured === false) {
      throw new Error(
        "Alt API not configured. Add ALT_API_BASE_URL and ALT_API_KEY to your .env.local file."
      );
    }

    // Handle upstream errors
    if (data.error) {
      throw new Error(data.error);
    }

    // Handle empty response
    if (!data.cards || data.cards.length === 0) {
      return [];
    }

    // Map normalized cards → internal Card format
    return data.cards.map(nc => ({
      year: nc.year,
      player: generatePlayerKey(nc.playerName),
      product: nc.product,
      psa: nc.grade,
      value: nc.value,
      pct: nc.percentChange,
      range: nc.sixMonthRange,
      _source: "alt",
      _updatedAt: nc.lastUpdated,
    }));
  },

  async saveCard(): Promise<void> {
    throw new Error("AltProvider is read-only. Cards are saved via LocalProvider.");
  },
};
