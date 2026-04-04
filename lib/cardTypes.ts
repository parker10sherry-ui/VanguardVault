import type { Card } from "@/lib/types";

export type CardWithIndex = { card: Card; originalIndex: number };

export type PsaData = {
  grade: string;
  population: number;
  populationHigher: number;
  imageUrl: string;
  externalUrl: string;
  playerName: string;
  year: string;
  product: string;
  verified: boolean;
};

export type EbayComp = {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  itemUrl: string;
  condition: string;
  seller: string;
  sellerFeedback: string;
  gradeLabel: string;
  gradeMatch: "exact" | "different" | "unknown";
  listingDate: string;
};

export type PsaLookupResult = {
  grade: string;
  population: number;
  populationHigher: number;
  imageUrl: string;
  externalUrl: string;
  playerName: string;
  year: string;
  product: string;
  certNumber: string;
};
