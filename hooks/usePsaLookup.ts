"use client";

import { useState } from "react";
import type { PsaLookupResult } from "@/lib/cardTypes";

export function usePsaLookup() {
  const [psaLookupOpen, setPsaLookupOpen] = useState(false);
  const [psaLookupCert, setPsaLookupCert] = useState("");
  const [psaLookupResult, setPsaLookupResult] = useState<PsaLookupResult | null>(null);
  const [psaLookupLoading, setPsaLookupLoading] = useState(false);
  const [psaLookupError, setPsaLookupError] = useState<string | null>(null);

  const togglePanel = () => {
    setPsaLookupOpen((prev) => !prev);
    setPsaLookupResult(null);
    setPsaLookupError(null);
    setPsaLookupCert("");
  };

  const handlePsaLookup = async () => {
    const cert = psaLookupCert.trim();
    if (!cert) return;
    setPsaLookupLoading(true);
    setPsaLookupError(null);
    setPsaLookupResult(null);
    try {
      const res = await fetch(`/api/psa-cards?certs=${cert}`);
      const data = await res.json();
      if (data.cards && data.cards.length > 0) {
        const card = data.cards[0];
        setPsaLookupResult({
          grade: card.grade,
          population: card.population,
          populationHigher: card.populationHigher,
          imageUrl: card.imageUrl,
          externalUrl: card.externalUrl,
          playerName: card.playerName,
          year: card.year,
          product: card.product,
          certNumber: card.certNumber,
        });
      } else {
        setPsaLookupError("No card found for that cert number.");
      }
    } catch {
      setPsaLookupError("Failed to look up cert number.");
    } finally {
      setPsaLookupLoading(false);
    }
  };

  return {
    psaLookupOpen, psaLookupCert, setPsaLookupCert,
    psaLookupResult, psaLookupLoading, psaLookupError,
    togglePanel, handlePsaLookup,
  };
}
