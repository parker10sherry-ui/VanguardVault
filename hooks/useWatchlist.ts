"use client";

import { useState } from "react";

export function useWatchlist(showToast: (msg: string, type?: "success" | "error") => void) {
  const [watchlist, setWatchlist] = useState<{ player: string; year: number; product: string; psa: number; targetPrice: number; notes: string }[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("vv_watchlist") || "[]"); } catch { return []; }
    }
    return [];
  });
  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const [watchPlayer, setWatchPlayer] = useState("");
  const [watchYear, setWatchYear] = useState("2025");
  const [watchProduct, setWatchProduct] = useState("");
  const [watchPSA, setWatchPSA] = useState("10");
  const [watchTarget, setWatchTarget] = useState("");
  const [watchNotes, setWatchNotes] = useState("");

  const handleAddWatchlist = () => {
    if (!watchPlayer.trim() || !watchProduct.trim()) return;
    const item = {
      player: watchPlayer.trim(),
      year: parseInt(watchYear),
      product: watchProduct.trim(),
      psa: parseInt(watchPSA),
      targetPrice: parseFloat(watchTarget) || 0,
      notes: watchNotes.trim(),
    };
    const updated = [...watchlist, item];
    setWatchlist(updated);
    localStorage.setItem("vv_watchlist", JSON.stringify(updated));
    setWatchModalOpen(false);
    setWatchPlayer("");
    setWatchYear("2025");
    setWatchProduct("");
    setWatchPSA("10");
    setWatchTarget("");
    setWatchNotes("");
    showToast("Added to watchlist");
  };

  const handleRemoveWatchlist = (index: number) => {
    const updated = watchlist.filter((_, i) => i !== index);
    setWatchlist(updated);
    localStorage.setItem("vv_watchlist", JSON.stringify(updated));
    showToast("Removed from watchlist");
  };

  return {
    watchlist, watchModalOpen, setWatchModalOpen,
    watchPlayer, setWatchPlayer, watchYear, setWatchYear,
    watchProduct, setWatchProduct, watchPSA, setWatchPSA,
    watchTarget, setWatchTarget, watchNotes, setWatchNotes,
    handleAddWatchlist, handleRemoveWatchlist,
  };
}
