"use client";

import { useMemo } from "react";
import type { Card, PlayerInfo } from "@/lib/types";
import { getCostBasis } from "@/lib/helpers";

export function usePortfolioStats(cards: Card[], players: Record<string, PlayerInfo>) {
  const dashboardStats = useMemo(() => {
    const active = cards.filter((c) => !c.soldAt);
    const sold = cards.filter((c) => !!c.soldAt);
    const totalValue = active.reduce((sum, c) => sum + (c.value || 0), 0);
    const totalCards = active.length;
    const realizedProfit = sold.reduce((sum, c) => sum + ((c.salePrice || 0) - getCostBasis(c)), 0);
    const soldCount = sold.length;

    const gradeBreakdown: Record<number, number> = {};
    active.forEach((c) => {
      gradeBreakdown[c.psa] = (gradeBreakdown[c.psa] || 0) + 1;
    });

    return { totalValue, totalCards, realizedProfit, soldCount, gradeBreakdown };
  }, [cards]);

  const topMovers = useMemo(() => {
    const active = cards
      .map((card, i) => ({ card, originalIndex: i }))
      .filter((ci) => !ci.card.soldAt && ci.card.pct);

    const parsed = active.map((ci) => {
      const clean = (ci.card.pct || "").replace(/\s/g, "");
      const isUp = clean.includes("U");
      const isDown = clean.includes("D");
      const numStr = clean.replace("U", "").replace("D", "").replace("%", "").trim();
      const num = parseFloat(numStr) || 0;
      const signedNum = isDown ? -num : num;
      return { ...ci, pctNum: signedNum, isUp, isDown };
    });

    const sorted = [...parsed].sort((a, b) => b.pctNum - a.pctNum);
    const gainers = sorted.filter((c) => c.pctNum > 0).slice(0, 3);
    const losers = sorted.filter((c) => c.pctNum < 0).slice(-3).reverse();
    losers.reverse();

    return { gainers, losers };
  }, [cards]);

  const portfolioBreakdown = useMemo(() => {
    const active = cards.filter((c) => !c.soldAt);
    const byPlayer: { name: string; value: number; costBasis: number }[] = [];
    const playerTotals: Record<string, { value: number; costBasis: number }> = {};

    active.forEach((c) => {
      if (!playerTotals[c.player]) playerTotals[c.player] = { value: 0, costBasis: 0 };
      playerTotals[c.player].value += c.value || 0;
      playerTotals[c.player].costBasis += getCostBasis(c);
    });

    for (const [key, totals] of Object.entries(playerTotals)) {
      const info = players[key];
      byPlayer.push({ name: info?.full || key, ...totals });
    }

    byPlayer.sort((a, b) => b.value - a.value);
    const totalCostBasis = active.reduce((sum, c) => sum + getCostBasis(c), 0);
    const totalValue = active.reduce((sum, c) => sum + (c.value || 0), 0);
    const unrealizedPL = totalValue - totalCostBasis;

    return { byPlayer, totalCostBasis, totalValue, unrealizedPL };
  }, [cards, players]);

  return { dashboardStats, topMovers, portfolioBreakdown };
}
