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
  certNumber?: string;
  _source?: string;
  _updatedAt?: string;
  _psaVerified?: boolean;
  _psaImageUrl?: string;
  _psaPopulation?: number;
  _psaPopHigher?: number;
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

/** PSA API cert response */
export interface PSACertResponse {
  PSACert: {
    CertNumber: string;
    Year: string;
    Brand: string;
    Category: string;
    CardNumber: string;
    Subject: string;
    Variety: string;
    GradeDescription: string;
    CardGrade: string;
    AutographGrade: string;
    SpecNumber: string;
    SpecID: number;
    LabelType: string;
    TotalPopulation: number;
    TotalPopulationWithQualifier: number;
    PopulationHigher: number;
    IsDualCert: boolean;
    IsPSADNA: boolean;
  };
  DNACert: unknown;
}

/** Shape returned by GET /api/psa-cards */
export interface PSAApiResponse {
  cards: PSAEnrichedCard[];
  source: string;
  lastUpdated: string;
  cached: boolean;
  error?: string;
  configured?: boolean;
  quotaRemaining?: number;
}

export interface PSAEnrichedCard {
  certNumber: string;
  playerName: string;
  year: string;
  product: string;
  grade: string;
  cardNumber: string;
  variety: string;
  category: string;
  population: number;
  populationHigher: number;
  imageUrl: string;
  externalUrl: string;
  verified: boolean;
  lastUpdated: string;
}
