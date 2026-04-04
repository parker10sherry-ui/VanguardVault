"use client";

import { useState, useRef } from "react";
import type { Card } from "@/lib/types";
import type { PsaData } from "@/lib/cardTypes";

export function usePsaVerify(setCards: React.Dispatch<React.SetStateAction<Card[]>>) {
  const [psaData, setPsaData] = useState<PsaData | null>(null);
  const [psaLoading, setPsaLoading] = useState(false);
  const psaRequestIdRef = useRef(0);

  const reset = () => {
    setPsaData(null);
    setPsaLoading(false);
  };

  const fetchPsaCert = async (certNumber: string, targetIndex?: number) => {
    const requestId = ++psaRequestIdRef.current;
    try {
      setPsaLoading(true);
      const res = await fetch(`/api/psa-cards?certs=${certNumber}`);
      const data = await res.json();
      if (requestId !== psaRequestIdRef.current) return null;
      if (data.cards && data.cards.length > 0) {
        const card = data.cards[0];
        setPsaData({
          grade: card.grade,
          population: card.population,
          populationHigher: card.populationHigher,
          imageUrl: card.imageUrl,
          externalUrl: card.externalUrl,
          playerName: card.playerName,
          year: card.year,
          product: card.product,
          verified: card.verified,
        });
        if (card.imageUrl && targetIndex !== undefined) {
          setCards((prev) => {
            const updated = [...prev];
            const existing = updated[targetIndex];
            if (existing && existing.certNumber === certNumber && !existing._psaImageUrl) {
              updated[targetIndex] = { ...existing, _psaImageUrl: card.imageUrl };
            }
            return updated;
          });
        }
        return card;
      }
      return null;
    } catch {
      if (requestId !== psaRequestIdRef.current) return null;
      return null;
    } finally {
      if (requestId === psaRequestIdRef.current) {
        setPsaLoading(false);
      }
    }
  };

  return { psaData, psaLoading, reset, fetchPsaCert };
}
