import type { Card, PlayerInfo, DataProvider } from "@/lib/types";
import { SEED_PLAYERS, SEED_CARDS } from "@/lib/data";

const SEED_COUNT = SEED_CARDS.length;

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

    // Apply any saved edits to seed cards
    try {
      const edits = localStorage.getItem("vanguardVault_seedEdits");
      if (edits) {
        const editMap: Record<string, Partial<Card>> = JSON.parse(edits);
        for (const [idx, overrides] of Object.entries(editMap)) {
          const i = parseInt(idx);
          if (i >= 0 && i < cards.length) {
            cards[i] = { ...cards[i], ...overrides };
          }
        }
      }
    } catch { /* ignore */ }

    // Append user-added cards
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

/** Update an existing card by its index in the full cards array (seed + user) */
export function updateCardAtIndex(index: number, updated: Card): void {
  if (index < SEED_COUNT) {
    // It's a seed card — store override
    const raw = localStorage.getItem("vanguardVault_seedEdits");
    const editMap: Record<string, Partial<Card>> = raw ? JSON.parse(raw) : {};
    editMap[index] = updated;
    localStorage.setItem("vanguardVault_seedEdits", JSON.stringify(editMap));
  } else {
    // It's a user-added card
    const userIndex = index - SEED_COUNT;
    const raw = localStorage.getItem("vanguardVault_userCards");
    const userCards: Card[] = raw ? JSON.parse(raw) : [];
    if (userIndex >= 0 && userIndex < userCards.length) {
      userCards[userIndex] = updated;
      localStorage.setItem("vanguardVault_userCards", JSON.stringify(userCards));
    }
  }
}
