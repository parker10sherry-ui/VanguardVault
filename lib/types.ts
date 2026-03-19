// ============================================================
// types.ts — Shared type definitions for Vanguard Vault
// ============================================================

export interface PlayerInfo {
  full: string;
  team: string;
  espnId?: number | null;
}

export interface Card {
  year: number;
  player: string;
  product: string;
  psa: number;
  value: number;
  pct?: string;
  range?: string;
  purchase?: string;
  _source?: string;
  _updatedAt?: string;
}

/** The normalized schema returned by /api/alt-cards */
export interface NormalizedCard {
  id: string;
  playerName: string;
  team: string;
  year: number;
  product: string;
  grade: number;
  value: number;
  percentChange: string;
  sixMonthRange: string;
  imageUrl: string;
  externalUrl: string;
  lastUpdated: string;
}

export interface DataStatus {
  source: string;
  lastUpdated: Date | null;
  loading: boolean;
  error: string | null;
}

export interface DataProvider {
  name: string;
  canSave: boolean;
  fetchCards(): Promise<Card[]>;
  fetchPlayers(): Promise<Record<string, PlayerInfo>>;
  saveCard(card: Card, playerKey: string, playerData?: PlayerInfo | null): Promise<void>;
}

/** Shape returned by GET /api/alt-cards */
export interface AltApiResponse {
  cards: NormalizedCard[];
  source: string;
  lastUpdated: string;
  cached: boolean;
  error?: string;
  configured?: boolean;
}
