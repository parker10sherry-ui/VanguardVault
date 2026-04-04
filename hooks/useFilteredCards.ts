"use client";

import { useState, useMemo } from "react";
import type { Card, PlayerInfo } from "@/lib/types";
import type { CardWithIndex } from "@/lib/cardTypes";
import { getCostBasis } from "@/lib/helpers";

export function useFilteredCards(cards: Card[], players: Record<string, PlayerInfo>) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"value" | "grade" | "pct" | "player">("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { groups, order, soldGroups, soldOrder, totalProfit } = useMemo(() => {
    const indexed: CardWithIndex[] = cards.map((card, i) => ({ card, originalIndex: i }));

    const active = indexed.filter((ci) => !ci.card.soldAt);
    const sold = indexed.filter((ci) => !!ci.card.soldAt);

    let filtered = active;
    if (filter !== "all") {
      filtered = filtered.filter((ci) => ci.card.player === filter);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((ci) => {
        const c = ci.card;
        const p = players[c.player];
        const full = p ? p.full.toLowerCase() : "";
        const team = p ? p.team.toLowerCase() : "";
        return (
          c.player.toLowerCase().includes(s) ||
          full.includes(s) ||
          team.includes(s) ||
          c.product.toLowerCase().includes(s) ||
          String(c.year).includes(s)
        );
      });
    }
    const g: Record<string, CardWithIndex[]> = {};
    const o: string[] = [];
    filtered.forEach((ci) => {
      if (!g[ci.card.player]) {
        g[ci.card.player] = [];
        o.push(ci.card.player);
      }
      g[ci.card.player].push(ci);
    });

    const sg: Record<string, CardWithIndex[]> = {};
    const so: string[] = [];
    let profit = 0;
    sold.forEach((ci) => {
      if (!sg[ci.card.player]) {
        sg[ci.card.player] = [];
        so.push(ci.card.player);
      }
      sg[ci.card.player].push(ci);
      profit += (ci.card.salePrice || 0) - getCostBasis(ci.card);
    });

    return { groups: g, order: o, soldGroups: sg, soldOrder: so, totalProfit: profit };
  }, [cards, players, filter, search]);

  const sortedCards = useMemo(() => {
    const active = cards
      .map((card, i) => ({ card, originalIndex: i }))
      .filter((ci) => !ci.card.soldAt);

    let filtered = active;
    if (filter !== "all") {
      filtered = filtered.filter((ci) => ci.card.player === filter);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((ci) => {
        const c = ci.card;
        const p = players[c.player];
        const full = p ? p.full.toLowerCase() : "";
        const team = p ? p.team.toLowerCase() : "";
        return (
          c.player.toLowerCase().includes(s) ||
          full.includes(s) ||
          team.includes(s) ||
          c.product.toLowerCase().includes(s) ||
          String(c.year).includes(s)
        );
      });
    }

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "value":
          cmp = (a.card.value || 0) - (b.card.value || 0);
          break;
        case "grade":
          cmp = a.card.psa - b.card.psa;
          break;
        case "pct": {
          const parsePctNum = (pct: string) => {
            const clean = pct.replace(/\s/g, "");
            const isDown = clean.includes("D");
            const num = parseFloat(clean.replace("U", "").replace("D", "").replace("%", "")) || 0;
            return isDown ? -num : num;
          };
          cmp = parsePctNum(a.card.pct || "") - parsePctNum(b.card.pct || "");
          break;
        }
        case "player": {
          const nameA = (players[a.card.player]?.full || a.card.player).toLowerCase();
          const nameB = (players[b.card.player]?.full || b.card.player).toLowerCase();
          cmp = nameA.localeCompare(nameB);
          break;
        }
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return sorted;
  }, [cards, players, filter, search, sortBy, sortDir]);

  const handleFilterClick = (f: string) => {
    setFilter(f);
    setSearch("");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilter("all");
  };

  return {
    filter, search, sortBy, setSortBy, sortDir, setSortDir,
    groups, order, soldGroups, soldOrder, totalProfit, sortedCards,
    handleFilterClick, handleSearchChange,
  };
}
