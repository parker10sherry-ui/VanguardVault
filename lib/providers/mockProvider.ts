import type { Card, PlayerInfo, DataProvider } from "@/lib/types";
import { SEED_PLAYERS, SEED_CARDS } from "@/lib/data";

export const MockProvider: DataProvider = {
  name: "Mock (Alt Simulation)",
  canSave: false,

  async fetchPlayers(): Promise<Record<string, PlayerInfo>> {
    await new Promise(r => setTimeout(r, 600));
    return { ...SEED_PLAYERS };
  },

  async fetchCards(): Promise<Card[]> {
    await new Promise(r => setTimeout(r, 800));

    return SEED_CARDS.map(card => {
      // Higher-value cards get smaller swings, low-value cards swing more
      const volatility = card.value > 500 ? 0.04 : card.value > 100 ? 0.08 : 0.15;
      const fluctuation = 1 + (Math.random() * 2 - 1) * volatility;
      const newValue = Math.max(1, Math.round(card.value * fluctuation));
      const delta = ((newValue - card.value) / card.value * 100).toFixed(1);
      const dir = newValue >= card.value ? "U" : "D";

      const lo = Math.round(newValue * (0.7 + Math.random() * 0.15));
      const hi = Math.round(newValue * (1.1 + Math.random() * 0.2));

      return {
        ...card,
        value: newValue,
        pct: `${Math.abs(parseFloat(delta))}% ${dir}`,
        range: `${lo}-${hi}`,
        _source: "mock",
        _updatedAt: new Date().toISOString(),
      };
    });
  },

  async saveCard(): Promise<void> {
    throw new Error("MockProvider is read-only. Cards are saved via LocalProvider.");
  },
};
