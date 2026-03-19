import type { Card, PlayerInfo, DataProvider } from "@/lib/types";
import { SEED_PLAYERS, SEED_CARDS } from "@/lib/data";

export const LocalProvider: DataProvider = {
  name: "Local",
  canSave: true,

  async fetchPlayers(): Promise<Record<string, PlayerInfo>> {
    const players = { ...SEED_PLAYERS };
    try {
      const saved = localStorage.getItem("vanguardVault_userPlayers");
      if (saved) Object.assign(players, JSON.parse(saved));
    } catch { /* ignore */ }
    return players;
  },

  async fetchCards(): Promise<Card[]> {
    const cards = [...SEED_CARDS];
    try {
      const saved = localStorage.getItem("vanguardVault_userCards");
      if (saved) cards.push(...JSON.parse(saved));
    } catch { /* ignore */ }
    return cards;
  },

  async saveCard(card: Card, playerKey: string, playerData?: PlayerInfo | null): Promise<void> {
    try {
      const saved = localStorage.getItem("vanguardVault_userCards");
      const userCards = saved ? JSON.parse(saved) : [];
      userCards.push(card);
      localStorage.setItem("vanguardVault_userCards", JSON.stringify(userCards));

      if (playerData) {
        const savedP = localStorage.getItem("vanguardVault_userPlayers");
        const userPlayers = savedP ? JSON.parse(savedP) : {};
        userPlayers[playerKey] = playerData;
        localStorage.setItem("vanguardVault_userPlayers", JSON.stringify(userPlayers));
      }
    } catch {
      throw new Error("Failed to save to localStorage");
    }
  },
};
