"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Card, PlayerInfo, DataStatus, DataProvider } from "@/lib/types";
import { LocalProvider, MockProvider, AltProvider, PSAProvider, SupabaseProvider } from "@/lib/providers";
import { supabase } from "@/lib/supabase/client";

// ============================================================
// Provider registry
// ============================================================
const PROVIDERS: Record<string, DataProvider> = {
  supabase: SupabaseProvider,
  local: LocalProvider,
  mock: MockProvider,
  psa: PSAProvider,
  alt: AltProvider,
};

// ============================================================
// Helpers
// ============================================================

function generatePlayerKey(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

function parsePct(pct: string) {
  if (!pct) return { dir: "", display: "\u2014" };
  const clean = pct.replace(/\s/g, "");
  const up = clean.includes("U");
  const down = clean.includes("D");
  const dir = up ? "up" : down ? "down" : "";
  const arrow = up ? "\u25B2" : down ? "\u25BC" : "";
  return {
    dir,
    display: `${arrow} ${clean.replace("U", "").replace("D", "").trim()}`,
  };
}

function getPlayerImage(
  players: Record<string, PlayerInfo>,
  shortName: string
): string {
  const p = players[shortName];
  if (!p) return "";
  if (p.espnId) {
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${p.espnId}.png`;
  }
  return "";
}

async function fetchEspnId(fullName: string): Promise<number | null> {
  // Try v2 search (includes retired players)
  try {
    const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(
      fullName
    )}&limit=1&page=1&type=player&sport=football&league=nfl`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      for (const group of data.results || []) {
        for (const item of group.contents || []) {
          if (item.uid) {
            const match = item.uid.match(/~a:(\d+)/);
            if (match) return parseInt(match[1]);
          }
          if (item.id && /^\d+$/.test(item.id)) return parseInt(item.id);
        }
      }
    }
  } catch {
    /* try fallback */
  }

  // Fallback to v3 (active players only)
  try {
    const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(
      fullName
    )}&limit=1&type=player&sport=football`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) return parseInt(data.items[0].id);
    }
  } catch {
    /* no photo */
  }

  return null;
}

// ============================================================
// Component
// ============================================================

export default function VanguardVault() {
  // --- Data state ---
  const [cards, setCards] = useState<Card[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerInfo>>({});
  const [status, setStatus] = useState<DataStatus>({
    source: "Supabase",
    lastUpdated: null,
    loading: true,
    error: null,
  });
  const [activeProvider, setActiveProvider] = useState("supabase");

  // --- UI state ---
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [proView, setProView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vv_proView") === "true";
    }
    return false;
  });
  const [sortBy, setSortBy] = useState<"value" | "grade" | "pct" | "player">("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [gridView, setGridView] = useState(false);
  const [proModalEdit, setProModalEdit] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [proTab, setProTab] = useState<"portfolio" | "scan" | "watchlist">("portfolio");

  // --- Watchlist state ---
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

  // --- Form state ---
  const [formFullName, setFormFullName] = useState("");
  const [formTeam, setFormTeam] = useState("");
  const [formYear, setFormYear] = useState("2025");
  const [formProduct, setFormProduct] = useState("");
  const [formPSA, setFormPSA] = useState("10");
  const [formValue, setFormValue] = useState("");
  const [formPct, setFormPct] = useState("");
  const [formPctDir, setFormPctDir] = useState("");
  const [formRange, setFormRange] = useState("");
  const [formCert, setFormCert] = useState("");
  const [formPurchase, setFormPurchase] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Sell state ---
  const [sellMode, setSellMode] = useState(false);
  const [formSalePrice, setFormSalePrice] = useState("");
  const [showSold, setShowSold] = useState(false);
  const [unsellCode, setUnsellCode] = useState("");

  // --- PSA state ---
  const [psaData, setPsaData] = useState<{
    grade: string; population: number; populationHigher: number;
    imageUrl: string; externalUrl: string; playerName: string;
    year: string; product: string; verified: boolean;
  } | null>(null);
  const [psaLoading, setPsaLoading] = useState(false);
  // --- eBay Quick Price Check state ---
  const [ebayCheckOpen, setEbayCheckOpen] = useState(false);
  const [ebayCheckQuery, setEbayCheckQuery] = useState("");
  const [ebayCheckGrade, setEbayCheckGrade] = useState("");
  const [ebayCheckResults, setEbayCheckResults] = useState<{
    itemId: string; title: string; price: number; currency: string;
    imageUrl: string; itemUrl: string; condition: string;
    seller: string; sellerFeedback: string;
    gradeLabel: string; gradeMatch: "exact" | "different" | "unknown";
    listingDate: string;
  }[]>([]);
  const [ebayCheckLoading, setEbayCheckLoading] = useState(false);
  const [ebayCheckError, setEbayCheckError] = useState<string | null>(null);
  const [ebayCheckAvg, setEbayCheckAvg] = useState<number | null>(null);
  const [ebayCheckLow, setEbayCheckLow] = useState<number | null>(null);
  const [ebayCheckHigh, setEbayCheckHigh] = useState<number | null>(null);
  const [ebayCheckTotal, setEbayCheckTotal] = useState(0);
  const [ebayCheckListOpen, setEbayCheckListOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [psaLookupOpen, setPsaLookupOpen] = useState(false);
  const [psaLookupCert, setPsaLookupCert] = useState("");
  const [psaLookupResult, setPsaLookupResult] = useState<{
    grade: string; population: number; populationHigher: number;
    imageUrl: string; externalUrl: string; playerName: string;
    year: string; product: string; certNumber: string;
  } | null>(null);
  const [psaLookupLoading, setPsaLookupLoading] = useState(false);
  const [psaLookupError, setPsaLookupError] = useState<string | null>(null);

  // --- Scan state ---
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanConfidence, setScanConfidence] = useState<string | null>(null);
  const [scanFrontFile, setScanFrontFile] = useState<File | null>(null);
  const [scanBackFile, setScanBackFile] = useState<File | null>(null);
  const [scanFrontPreview, setScanFrontPreview] = useState<string | null>(null);
  const [scanBackPreview, setScanBackPreview] = useState<string | null>(null);
  const [croppedFrontUrl, setCroppedFrontUrl] = useState<string | null>(null);
  const [croppedBackUrl, setCroppedBackUrl] = useState<string | null>(null);

  // --- eBay comps state ---
  const [ebayComps, setEbayComps] = useState<{
    itemId: string; title: string; price: number; currency: string;
    imageUrl: string; itemUrl: string; condition: string;
    seller: string; sellerFeedback: string;
    gradeLabel: string; gradeMatch: "exact" | "different" | "unknown";
    listingDate: string;
  }[]>([]);
  const [ebayCompsLoading, setEbayCompsLoading] = useState(false);
  const [ebayCompsError, setEbayCompsError] = useState<string | null>(null);
  const [ebayCompsAvg, setEbayCompsAvg] = useState<number | null>(null);
  const [ebayCompsLow, setEbayCompsLow] = useState<number | null>(null);
  const [ebayCompsHigh, setEbayCompsHigh] = useState<number | null>(null);
  const [ebayCompsTotal, setEbayCompsTotal] = useState(0);
  const [ebayCompsOpen, setEbayCompsOpen] = useState(false);

  // --- Data loading ---
  const loadData = useCallback(async (providerKey: string) => {
    const provider = PROVIDERS[providerKey];
    setStatus((s) => ({ ...s, loading: true, error: null }));

    try {
      const [fetchedCards, fetchedPlayers] = await Promise.all([
        provider.fetchCards(),
        provider.fetchPlayers(),
      ]);

      let mergedCards = fetchedCards;
      let mergedPlayers = fetchedPlayers;

      // If using a remote provider, also merge localStorage manual entries
      if (providerKey !== "local") {
        try {
          const saved = localStorage.getItem("vanguardVault_userCards");
          if (saved) mergedCards = [...mergedCards, ...JSON.parse(saved)];
          const savedP = localStorage.getItem("vanguardVault_userPlayers");
          if (savedP) mergedPlayers = { ...mergedPlayers, ...JSON.parse(savedP) };
        } catch {
          /* ignore */
        }
      }

      setCards(mergedCards);
      setPlayers(mergedPlayers);
      setStatus({
        source: provider.name,
        lastUpdated: new Date(),
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";

      // Fallback to local data so the site isn't blank
      try {
        const [fallbackCards, fallbackPlayers] = await Promise.all([
          LocalProvider.fetchCards(),
          LocalProvider.fetchPlayers(),
        ]);
        setCards(fallbackCards);
        setPlayers(fallbackPlayers);
        setStatus({
          source: "Local (fallback)",
          lastUpdated: new Date(),
          loading: false,
          error: `${provider.name}: ${message}`,
        });
      } catch {
        setCards([]);
        setPlayers({});
        setStatus({
          source: "Error",
          lastUpdated: null,
          loading: false,
          error: message,
        });
      }
    }
  }, []);

  useEffect(() => {
    loadData(activeProvider);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Batch-fetch PSA images for cards that have cert numbers but no image
  useEffect(() => {
    const cardsNeedingImages = cards
      .map((c, i) => ({ cert: c.certNumber, index: i, hasImage: !!(c.frontImageUrl || c._psaImageUrl) }))
      .filter((c) => c.cert && !c.hasImage);

    if (cardsNeedingImages.length === 0) return;

    const certs = cardsNeedingImages.map((c) => c.cert).join(",");
    fetch(`/api/psa-cards?certs=${certs}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.cards || data.cards.length === 0) return;
        // Build a map of cert -> imageUrl
        const imageMap = new Map<string, string>();
        for (const psaCard of data.cards) {
          if (psaCard.imageUrl) {
            imageMap.set(psaCard.certNumber, psaCard.imageUrl);
          }
        }
        if (imageMap.size === 0) return;
        setCards((prev) => {
          const updated = [...prev];
          for (const item of cardsNeedingImages) {
            const url = imageMap.get(item.cert!);
            if (url && updated[item.index]) {
              updated[item.index] = { ...updated[item.index], _psaImageUrl: url };
            }
          }
          return updated;
        });
      })
      .catch(() => { /* non-fatal */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  // --- Filter + search ---
  // Each entry tracks the card AND its original index in the cards array
  type CardWithIndex = { card: Card; originalIndex: number };
  const { groups, order, soldGroups, soldOrder, totalProfit } = useMemo(() => {
    const indexed: CardWithIndex[] = cards.map((card, i) => ({ card, originalIndex: i }));

    // Separate active vs sold
    const active = indexed.filter((ci) => !ci.card.soldAt);
    const sold = indexed.filter((ci) => !!ci.card.soldAt);

    // Apply filter + search to active cards
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

    // Group sold cards
    const sg: Record<string, CardWithIndex[]> = {};
    const so: string[] = [];
    let profit = 0;
    sold.forEach((ci) => {
      if (!sg[ci.card.player]) {
        sg[ci.card.player] = [];
        so.push(ci.card.player);
      }
      sg[ci.card.player].push(ci);
      profit += (ci.card.salePrice || 0) - (ci.card.value || 0);
    });

    return { groups: g, order: o, soldGroups: sg, soldOrder: so, totalProfit: profit };
  }, [cards, players, filter, search]);

  // Unique players for filter dropdown (alphabetical by full name)
  const filterPlayers = useMemo(() => {
    const seen = new Set<string>();
    const keys = cards
      .filter((c) => {
        if (seen.has(c.player)) return false;
        seen.add(c.player);
        return true;
      })
      .map((c) => c.player);
    return keys.sort((a, b) => {
      const nameA = (players[a]?.full || a).toLowerCase();
      const nameB = (players[b]?.full || b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [cards, players]);

  // Player names for form datalist
  const playerNames = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(players)
      .filter((p) => {
        if (seen.has(p.full)) return false;
        seen.add(p.full);
        return true;
      })
      .map((p) => p.full);
  }, [players]);

  // --- Event handlers ---
  // Show toast notification (auto-dismiss after 3s)
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Toggle pro view and persist preference
  const handleToggleProView = () => {
    setProView((prev) => {
      const next = !prev;
      localStorage.setItem("vv_proView", String(next));
      return next;
    });
  };

  // --- Pro view computed data ---
  const dashboardStats = useMemo(() => {
    const active = cards.filter((c) => !c.soldAt);
    const sold = cards.filter((c) => !!c.soldAt);
    const totalValue = active.reduce((sum, c) => sum + (c.value || 0), 0);
    const totalCards = active.length;
    const realizedProfit = sold.reduce((sum, c) => sum + ((c.salePrice || 0) - (c.value || 0)), 0);
    const soldCount = sold.length;

    // Count by grade
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
    // reverse losers so worst is first
    losers.reverse();

    return { gainers, losers };
  }, [cards]);

  // Sorted flat card list for pro view
  const sortedCards = useMemo(() => {
    const active = cards
      .map((card, i) => ({ card, originalIndex: i }))
      .filter((ci) => !ci.card.soldAt);

    // Apply filter
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

    // Sort
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

  // Portfolio breakdown by player (for chart)
  const portfolioBreakdown = useMemo(() => {
    const active = cards.filter((c) => !c.soldAt);
    const byPlayer: { name: string; value: number; costBasis: number }[] = [];
    const playerTotals: Record<string, { value: number; costBasis: number }> = {};

    active.forEach((c) => {
      if (!playerTotals[c.player]) playerTotals[c.player] = { value: 0, costBasis: 0 };
      playerTotals[c.player].value += c.value || 0;
      playerTotals[c.player].costBasis += parseInt(c.purchase || "0") || 0;
    });

    for (const [key, totals] of Object.entries(playerTotals)) {
      const info = players[key];
      byPlayer.push({ name: info?.full || key, ...totals });
    }

    byPlayer.sort((a, b) => b.value - a.value);
    const totalCostBasis = active.reduce((sum, c) => sum + (parseInt(c.purchase || "0") || 0), 0);
    const totalValue = active.reduce((sum, c) => sum + (c.value || 0), 0);
    const unrealizedPL = totalValue - totalCostBasis;

    return { byPlayer, totalCostBasis, totalValue, unrealizedPL };
  }, [cards, players]);

  // CSV export
  const handleExportCSV = useCallback(() => {
    const active = cards.filter((c) => !c.soldAt);
    const headers = ["Player", "Team", "Year", "Product", "PSA Grade", "Value", "Cost Basis", "% Change", "6-Mo Range", "Cert #"];
    const rows = active.map((c) => {
      const info = players[c.player];
      return [
        info?.full || c.player,
        info?.team || "",
        c.year,
        c.product,
        c.psa === 0 ? "Raw" : c.psa,
        c.value || 0,
        c.purchase || "",
        c.pct || "",
        c.range || "",
        c.certNumber || "",
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vanguard-vault-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Collection exported");
  }, [cards, players, showToast]);

  // Watchlist handlers
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

  const handleProviderChange = async (key: string) => {
    setActiveProvider(key);
    setFilter("all");
    await loadData(key);
  };

  const handleRefresh = () => loadData(activeProvider);

  const handleFilterClick = (f: string) => {
    setFilter(f);
    setSearch("");
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setFilter("all");
  };

  const handleFullNameInput = (value: string) => {
    setFormFullName(value);
    const lower = value.trim().toLowerCase();
    for (const info of Object.values(players)) {
      if (info.full.toLowerCase() === lower) {
        setFormTeam(info.team);
        return;
      }
    }
  };

  const resetForm = () => {
    setFormFullName("");
    setFormTeam("");
    setFormProduct("");
    setFormValue("");
    setFormPct("");
    setFormPctDir("");
    setFormRange("");
    setFormCert("");
    setFormPurchase("");
    setFormYear("2025");
    setFormPSA("10");
    setEditingIndex(null);
    setSellMode(false);
    setFormSalePrice("");
    setUnsellCode("");
    setPsaData(null);
    setPsaLoading(false);
    setScanError(null);
    setScanConfidence(null);
    setScanFrontFile(null);
    setScanBackFile(null);
    setScanFrontPreview(null);
    setScanBackPreview(null);
    setCroppedFrontUrl(null);
    setCroppedBackUrl(null);
    setProModalEdit(false);
    setEbayComps([]);
    setEbayCompsLoading(false);
    setEbayCompsError(null);
    setEbayCompsAvg(null);
    setEbayCompsLow(null);
    setEbayCompsHigh(null);
    setEbayCompsTotal(0);
    setEbayCompsOpen(false);
  };

  const handleEditCard = (cardIndex: number) => {
    const card = cards[cardIndex];
    if (!card) return;

    // Reset modal state for fresh view
    setProModalEdit(false);
    setSellMode(false);
    setPsaData(null);
    setPsaLoading(false);
    setFormSalePrice("");
    setUnsellCode("");
    setScanError(null);
    setScanConfidence(null);
    setScanFrontFile(null);
    setScanBackFile(null);
    setScanFrontPreview(null);
    setScanBackPreview(null);
    setCroppedFrontUrl(null);
    setCroppedBackUrl(null);
    setEbayComps([]);
    setEbayCompsAvg(null);
    setEbayCompsLow(null);
    setEbayCompsHigh(null);
    setEbayCompsTotal(0);
    setEbayCompsOpen(false);
    setEbayCompsError(null);

    const info = players[card.player];
    setFormFullName(info ? info.full : card.player);
    setFormTeam(info ? info.team : "");
    setFormYear(String(card.year));
    setFormProduct(card.product);
    setFormPSA(String(card.psa));
    setFormValue(String(card.value || ""));
    setFormCert(card.certNumber || "");

    // Parse pct into value and direction
    if (card.pct) {
      const clean = card.pct.replace(/\s/g, "");
      if (clean.includes("U")) {
        setFormPctDir("U");
        setFormPct(clean.replace("U", "").trim());
      } else if (clean.includes("D")) {
        setFormPctDir("D");
        setFormPct(clean.replace("D", "").trim());
      } else {
        setFormPctDir("");
        setFormPct(clean);
      }
    } else {
      setFormPct("");
      setFormPctDir("");
    }

    setFormRange(card.range || "");
    setFormPurchase(card.purchase || "");
    setEditingIndex(cardIndex);
    setModalOpen(true);

    // Auto-fetch PSA data if card has a cert number
    if (card.certNumber) {
      fetchPsaCert(card.certNumber);
    }

    // Auto-fetch eBay comps
    fetchEbayComps(card);
  };

  const handleScanFile = (file: File, side: "front" | "back") => {
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setScanFrontFile(file);
      setScanFrontPreview(url);
      // Auto-scan if back is already taken
      if (scanBackFile) {
        setTimeout(() => triggerScan(file, scanBackFile), 100);
      } else {
        // Auto-prompt for back photo
        setTimeout(() => {
          const backInput = document.getElementById("scan-back");
          if (backInput) backInput.click();
        }, 300);
      }
    } else {
      setScanBackFile(file);
      setScanBackPreview(url);
      // Auto-scan if front is already taken
      if (scanFrontFile) {
        setTimeout(() => triggerScan(scanFrontFile, file), 100);
      }
    }
    setScanError(null);
  };

  const fetchPsaCert = async (certNumber: string) => {
    try {
      setPsaLoading(true);
      const res = await fetch(`/api/psa-cards?certs=${certNumber}`);
      const data = await res.json();
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
        // Persist PSA image to card state so grid view can show it
        if (card.imageUrl && editingIndex !== null) {
          setCards((prev) => {
            const updated = [...prev];
            const existing = updated[editingIndex];
            if (existing && !existing._psaImageUrl) {
              updated[editingIndex] = { ...existing, _psaImageUrl: card.imageUrl };
            }
            return updated;
          });
        }
        return card;
      }
      return null;
    } catch {
      return null;
    } finally {
      setPsaLoading(false);
    }
  };

  const fetchEbayComps = async (card: Card) => {
    setEbayCompsLoading(true);
    setEbayCompsError(null);
    setEbayComps([]);
    setEbayCompsAvg(null);
    setEbayCompsLow(null);
    setEbayCompsHigh(null);
    setEbayCompsTotal(0);

    try {
      const info = players[card.player];
      const playerName = info?.full || card.player;
      // Search without grade — get broader results, grade matching is done server-side
      const query = `${playerName} ${card.year} ${card.product}`.trim();
      const gradeParam = `&grade=${card.psa}`;

      const res = await fetch(`/api/ebay-prices?q=${encodeURIComponent(query)}&limit=20${gradeParam}`);
      if (!res.ok) throw new Error("Failed to fetch eBay comps");
      const data = await res.json();

      const results = data.results || [];
      setEbayComps(results);
      setEbayCompsTotal(data.total || 0);

      if (results.length > 0) {
        const prices = results.map((r: { price: number }) => r.price).filter((p: number) => p > 0);
        if (prices.length > 0) {
          setEbayCompsAvg(Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length));
          setEbayCompsLow(Math.min(...prices));
          setEbayCompsHigh(Math.max(...prices));
        }
      }
    } catch (err) {
      setEbayCompsError(err instanceof Error ? err.message : "Failed to load eBay comps");
    } finally {
      setEbayCompsLoading(false);
    }
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

  // --- eBay Quick Price Check ---
  const handleEbayCheck = async () => {
    const q = ebayCheckQuery.trim();
    if (!q) return;
    setEbayCheckLoading(true);
    setEbayCheckError(null);
    setEbayCheckResults([]);
    setEbayCheckAvg(null);
    setEbayCheckLow(null);
    setEbayCheckHigh(null);
    setEbayCheckTotal(0);
    setEbayCheckListOpen(false);

    try {
      const gradeParam = ebayCheckGrade ? `&grade=${ebayCheckGrade}` : "";
      const res = await fetch(`/api/ebay-prices?q=${encodeURIComponent(q)}&limit=20${gradeParam}`);
      if (!res.ok) throw new Error("Failed to fetch eBay prices");
      const data = await res.json();
      const results = data.results || [];
      setEbayCheckResults(results);
      setEbayCheckTotal(data.total || 0);
      if (results.length > 0) {
        const prices = results.map((r: { price: number }) => r.price).filter((p: number) => p > 0);
        if (prices.length > 0) {
          setEbayCheckAvg(Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length));
          setEbayCheckLow(Math.min(...prices));
          setEbayCheckHigh(Math.max(...prices));
        }
      }
      setEbayCheckListOpen(true);
    } catch (err) {
      setEbayCheckError(err instanceof Error ? err.message : "Failed to search eBay");
    } finally {
      setEbayCheckLoading(false);
    }
  };

  const startVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SpeechRecognition = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setEbayCheckError("Voice input not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      const transcript = event.results[0][0].transcript;
      setEbayCheckQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => { setIsListening(false); };
    recognition.onend = () => { setIsListening(false); };
    recognition.start();
  };

  const fileToBase64 = (file: File): Promise<{ data: string; mediaType: string }> =>
    new Promise((resolve, reject) => {
      // Draw to canvas to convert any format (HEIC, etc.) to JPEG
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Limit size to 1600px max dimension to keep payload reasonable
        const maxDim = 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        URL.revokeObjectURL(url);
        resolve({ data: dataUrl.split(",")[1], mediaType: "image/jpeg" });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    });

  // Crop card from photo using bounding box from Claude Vision
  const cropCardImage = (
    file: File,
    bbox: { x: number; y: number; width: number; height: number }
  ): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        // Convert percentage-based bbox to pixel coordinates
        const sx = Math.round(bbox.x * img.width);
        const sy = Math.round(bbox.y * img.height);
        const sw = Math.round(bbox.width * img.width);
        const sh = Math.round(bbox.height * img.height);

        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        URL.revokeObjectURL(url);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to crop image"));
          },
          "image/jpeg",
          0.9
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image for cropping"));
      };
      img.src = url;
    });

  // Upload image blob to Supabase Storage, return public URL
  const uploadCardImage = async (
    blob: Blob,
    side: "front" | "back"
  ): Promise<string | null> => {
    try {
      const fileName = `${side}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
      const filePath = `cards/${fileName}`;

      const { error } = await supabase.storage
        .from("card-images")
        .upload(filePath, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error.message);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("card-images")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    }
  };

  const triggerScan = async (front: File, back: File) => {
    setScanning(true);
    setScanError(null);
    setScanConfidence(null);

    try {
      const images = [
        await fileToBase64(front),
        await fileToBase64(back),
      ];

      const res = await fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setScanError(data.error || "Scan failed");
        setScanning(false);
        return;
      }

      const card = data.card;

      // Pre-fill form with scanned data
      if (card.playerName) setFormFullName(card.playerName);
      if (card.team) setFormTeam(card.team);
      if (card.year) setFormYear(String(card.year));
      if (card.product) setFormProduct(card.product);
      setFormPSA(card.psaGrade != null ? String(card.psaGrade) : "0");
      if (card.certNumber) {
        setFormCert(card.certNumber);
        // Auto-verify with PSA API
        fetchPsaCert(card.certNumber);
      }
      setScanConfidence(card.confidence);

      // Helper: convert Blob to data URL
      const blobToDataUrl = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

      // Crop and upload card images using bounding boxes
      try {
        const frontBlob = card.frontBoundingBox
          ? await cropCardImage(front, card.frontBoundingBox)
          : front;
        setScanFrontPreview(URL.createObjectURL(frontBlob));
        const frontUrl = await uploadCardImage(frontBlob, "front");
        setCroppedFrontUrl(frontUrl || await blobToDataUrl(frontBlob));

        const backBlob = card.backBoundingBox
          ? await cropCardImage(back, card.backBoundingBox)
          : back;
        setScanBackPreview(URL.createObjectURL(backBlob));
        const backUrl = await uploadCardImage(backBlob, "back");
        setCroppedBackUrl(backUrl || await blobToDataUrl(backBlob));
      } catch (cropErr) {
        console.error("Crop/upload error:", cropErr);
        // Non-fatal — card data was still extracted
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      setScanError(message);
    } finally {
      setScanning(false);
    }
  };

  const handleScanSubmit = async () => {
    if (!scanFrontFile || !scanBackFile) {
      setScanError("Please take photos of both the front and back of the card.");
      return;
    }
    triggerScan(scanFrontFile, scanBackFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) return;

    setSubmitting(true);

    const fullName = formFullName.trim();
    const team = formTeam.trim();
    const year = parseInt(formYear);
    const product = formProduct.trim();
    const psa = parseInt(formPSA);
    const value = parseInt(formValue) || 0;
    const pct = formPct.trim()
      ? `${formPct.trim()} ${formPctDir}`.trim()
      : "";
    const range = formRange.trim();

    // Find existing player or create new
    let playerKey: string | null = null;
    for (const [key, info] of Object.entries(players)) {
      if (info.full.toLowerCase() === fullName.toLowerCase()) {
        playerKey = key;
        break;
      }
    }

    let newPlayerData: PlayerInfo | null = null;

    if (!playerKey) {
      playerKey = generatePlayerKey(fullName);
      let baseKey = playerKey;
      let counter = 2;
      while (players[playerKey]) {
        playerKey = `${baseKey} ${counter}`;
        counter++;
      }
      const espnId = await fetchEspnId(fullName);
      newPlayerData = { full: fullName, team: team || "Unknown", espnId };
    }

    const certNumber = formCert.trim() || undefined;
    const purchase = formPurchase.trim() || "";
    const existingImages = editingIndex !== null ? cards[editingIndex] : null;
    const card: Card = {
      year, player: playerKey, product, psa, value, pct, range, certNumber, purchase,
      frontImageUrl: croppedFrontUrl || existingImages?.frontImageUrl || undefined,
      backImageUrl: croppedBackUrl || existingImages?.backImageUrl || undefined,
    };

    const provider = PROVIDERS[activeProvider];

    if (editingIndex !== null) {
      // --- EDIT MODE ---
      const existingCard = cards[editingIndex];
      if (existingCard?.id && provider.updateCard) {
        // Database-backed provider (Supabase)
        await provider.updateCard(existingCard.id, card);
      }
      // Update local state immediately
      setCards((prev) => {
        const updated = [...prev];
        updated[editingIndex] = { ...card, id: existingCard?.id };
        return updated;
      });
    } else {
      // --- ADD MODE ---
      await provider.saveCard(card, playerKey, newPlayerData);
      // Re-fetch to get the server-assigned ID
      await loadData(activeProvider);
    }

    if (newPlayerData && !provider.canSave) {
      setPlayers((prev) => ({ ...prev, [playerKey!]: newPlayerData! }));
    }

    const wasEditing = editingIndex !== null;
    setModalOpen(false);
    resetForm();
    setSubmitting(false);
    showToast(wasEditing ? "Card updated" : "Card added");
  };

  const handleSellCard = async () => {
    if (editingIndex === null) return;
    const salePrice = parseFloat(formSalePrice);
    if (isNaN(salePrice) || salePrice <= 0) return;

    setSubmitting(true);
    const existingCard = cards[editingIndex];
    const soldCard: Card = {
      ...existingCard,
      salePrice,
      soldAt: new Date().toISOString(),
    };

    const provider = PROVIDERS[activeProvider];
    if (existingCard?.id && provider.updateCard) {
      await provider.updateCard(existingCard.id, soldCard);
    }

    setCards((prev) => {
      const updated = [...prev];
      updated[editingIndex] = soldCard;
      return updated;
    });

    setModalOpen(false);
    resetForm();
    setSubmitting(false);
    showToast("Card sold");
  };

  const handleUnsellCard = async () => {
    if (editingIndex === null) return;
    if (unsellCode !== "0319") return;

    setSubmitting(true);
    const existingCard = cards[editingIndex];
    const restoredCard: Card = {
      ...existingCard,
      salePrice: null,
      soldAt: null,
    };

    const provider = PROVIDERS[activeProvider];
    if (existingCard?.id && provider.updateCard) {
      await provider.updateCard(existingCard.id, restoredCard);
    }

    setCards((prev) => {
      const updated = [...prev];
      updated[editingIndex] = restoredCard;
      return updated;
    });

    setModalOpen(false);
    resetForm();
    setSubmitting(false);
    showToast("Sale reversed");
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      {/* HEADER */}
      <header>
        <div className="header-left">
          <h1 className="logo">
            VANGUARD <span>VAULT</span>
          </h1>
          <p className="subtitle">Sherry&apos;s Trading Cards</p>
        </div>
        <div className="header-right">
          <div className="view-toggle" onClick={handleToggleProView} title={proView ? "Switch to Classic" : "Switch to Pro"}>
            <span className={`view-toggle-label ${!proView ? "active" : ""}`}>Classic</span>
            <div className={`view-toggle-track ${proView ? "on" : ""}`}>
              <div className="view-toggle-thumb" />
            </div>
            <span className={`view-toggle-label ${proView ? "active" : ""}`}>Pro</span>
          </div>
          <button className="ebay-check-btn" onClick={() => { setEbayCheckOpen(!ebayCheckOpen); setEbayCheckResults([]); setEbayCheckError(null); setEbayCheckAvg(null); setEbayCheckLow(null); setEbayCheckHigh(null); setEbayCheckTotal(0); setEbayCheckListOpen(false); }}>
            Price Check
          </button>
          <button className="psa-lookup-btn" onClick={() => { setPsaLookupOpen(!psaLookupOpen); setPsaLookupResult(null); setPsaLookupError(null); setPsaLookupCert(""); }}>
            PSA Lookup
          </button>
          <button className="add-card-btn" onClick={() => { resetForm(); setModalOpen(true); }}>
            + Add Card
          </button>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search players, cards..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* EBAY QUICK PRICE CHECK PANEL */}
      {ebayCheckOpen && (
        <div className="ebay-check-panel">
          <div className="ebay-check-input-row">
            <input
              type="text"
              placeholder="e.g. Jalen Hurts 2020 Prizm Rookie"
              value={ebayCheckQuery}
              onChange={(e) => setEbayCheckQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleEbayCheck(); }}
              className="ebay-check-input"
            />
            <select
              className="ebay-check-grade"
              value={ebayCheckGrade}
              onChange={(e) => setEbayCheckGrade(e.target.value)}
            >
              <option value="">Any Grade</option>
              <option value="10">PSA 10</option>
              <option value="9">PSA 9</option>
              <option value="8">PSA 8</option>
              <option value="7">PSA 7</option>
              <option value="0">Raw</option>
            </select>
            <button className="ebay-check-mic" onClick={startVoiceInput} disabled={isListening} title="Voice search">
              {isListening ? "..." : "\uD83C\uDF99"}
            </button>
            <button
              className="ebay-check-go"
              onClick={handleEbayCheck}
              disabled={ebayCheckLoading || !ebayCheckQuery.trim()}
            >
              {ebayCheckLoading ? "Searching..." : "Search"}
            </button>
          </div>
          {ebayCheckError && <div className="ebay-check-error">{ebayCheckError}</div>}
          {ebayCheckAvg !== null && (
            <div className="ebay-check-summary">
              <div className="ebay-stat"><span className="ebay-stat-label">Avg</span><span className="ebay-stat-value">${ebayCheckAvg.toLocaleString()}</span></div>
              <div className="ebay-stat"><span className="ebay-stat-label">Low</span><span className="ebay-stat-value">${ebayCheckLow?.toLocaleString()}</span></div>
              <div className="ebay-stat"><span className="ebay-stat-label">High</span><span className="ebay-stat-value">${ebayCheckHigh?.toLocaleString()}</span></div>
              <div className="ebay-stat"><span className="ebay-stat-label">Listings</span><span className="ebay-stat-value">{ebayCheckTotal.toLocaleString()}</span></div>
            </div>
          )}
          {!ebayCheckLoading && ebayCheckResults.length === 0 && ebayCheckAvg === null && ebayCheckQuery.trim() && !ebayCheckError && (
            <div className="ebay-check-hint">Search any card to see current eBay market prices</div>
          )}
          {ebayCheckListOpen && ebayCheckResults.length > 0 && (
            <div className="ebay-check-list">
              {ebayCheckResults.map((comp) => (
                <a key={comp.itemId} href={comp.itemUrl} target="_blank" rel="noopener noreferrer" className={`ebay-comp-item ${comp.gradeMatch === "different" ? "ebay-comp-diff" : ""}`}>
                  {comp.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={comp.imageUrl} alt="" className="ebay-comp-img" />
                  )}
                  <div className="ebay-comp-info">
                    <span className="ebay-comp-title">{comp.title}</span>
                    <div className="ebay-comp-meta-row">
                      {comp.gradeLabel && (
                        <span className={`ebay-grade-badge ${comp.gradeMatch === "exact" ? "grade-exact" : comp.gradeMatch === "different" ? "grade-diff" : ""}`}>
                          {comp.gradeLabel}
                        </span>
                      )}
                      {comp.listingDate && (
                        <span className="ebay-comp-date">{new Date(comp.listingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      )}
                      <span className="ebay-comp-meta">{comp.seller}</span>
                    </div>
                  </div>
                  <span className="ebay-comp-price">${comp.price.toLocaleString()}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PSA LOOKUP PANEL */}
      {psaLookupOpen && (
        <div className="psa-lookup-panel">
          <div className="psa-lookup-input-row">
            <input
              type="text"
              placeholder="Enter PSA Cert #"
              value={psaLookupCert}
              onChange={(e) => setPsaLookupCert(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handlePsaLookup(); }}
              className="psa-lookup-input"
            />
            <button
              className="psa-lookup-go"
              onClick={handlePsaLookup}
              disabled={psaLookupLoading || !psaLookupCert.trim()}
            >
              {psaLookupLoading ? "Looking up..." : "Look Up"}
            </button>
          </div>
          {psaLookupError && <div className="psa-lookup-error">{psaLookupError}</div>}
          {psaLookupResult && (
            <div className="psa-lookup-result">
              {psaLookupResult.imageUrl && (
                <div className="psa-lookup-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={psaLookupResult.imageUrl} alt="Card" />
                </div>
              )}
              <div className="psa-lookup-details">
                <div className="psa-lookup-name">{psaLookupResult.playerName}</div>
                <div className="psa-lookup-meta">
                  {psaLookupResult.year} {psaLookupResult.product}
                </div>
                <div className="psa-lookup-grade">Grade: {psaLookupResult.grade}</div>
                <div className="psa-lookup-pop">
                  Pop: {psaLookupResult.population.toLocaleString()} | Higher: {psaLookupResult.populationHigher.toLocaleString()}
                </div>
                <a href={psaLookupResult.externalUrl} target="_blank" rel="noopener noreferrer" className="psa-link">
                  View on PSA →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILTER BAR */}
      <nav className="filter-bar">
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => handleFilterClick(e.target.value)}
        >
          <option value="all">All Players ({filterPlayers.length})</option>
          {filterPlayers.map((key) => {
            const info = players[key] || { full: key };
            return (
              <option key={key} value={key}>
                {info.full}
              </option>
            );
          })}
        </select>

        {/* Sort & Grid controls — Pro view only */}
        {proView && (
          <div className="pro-controls">
            <div className="sort-controls">
              <label className="sort-label">Sort</label>
              <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="value">Value</option>
                <option value="grade">Grade</option>
                <option value="pct">% Change</option>
                <option value="player">Player</option>
              </select>
              <button className="sort-dir-btn" onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")} title={sortDir === "desc" ? "Highest first" : "Lowest first"}>
                {sortDir === "desc" ? "\u25BC" : "\u25B2"}
              </button>
            </div>
            <div className="view-mode-controls">
              <button className={`view-mode-btn ${!gridView ? "active" : ""}`} onClick={() => setGridView(false)} title="Table view">
                &#9776;
              </button>
              <button className={`view-mode-btn ${gridView ? "active" : ""}`} onClick={() => setGridView(true)} title="Grid view">
                &#9638;
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* STATUS BAR */}
      <div className="status-bar">
        <div className="status-left">
          <span className="status-source">{status.source}</span>
          {status.lastUpdated && (
            <span className="status-updated">
              Updated {status.lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="status-right">
          {status.error && (
            <span className="status-error">{status.error}</span>
          )}
          <select
            className="provider-select"
            value={activeProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="supabase">Cloud</option>
            <option value="local">Local</option>
            <option value="mock">Mock (Sim)</option>
            <option value="psa">PSA Verified</option>
          </select>
          <button className="csv-export-btn" onClick={handleExportCSV} title="Export CSV">CSV</button>
          <button
            className={`refresh-btn ${status.loading ? "spinning" : ""}`}
            onClick={handleRefresh}
            title="Refresh data"
          >
            &#8635; Refresh
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PRO VIEW — Dashboard, Top Movers, Sorted Grid/Table          */}
      {/* ============================================================ */}
      {proView && !status.loading && proTab === "portfolio" && (
        <>
          {/* PORTFOLIO DASHBOARD */}
          <div className="pro-dashboard">
            <div className="dash-card dash-primary">
              <span className="dash-label">Portfolio Value</span>
              <span className="dash-value">${dashboardStats.totalValue.toLocaleString()}</span>
            </div>
            <div className="dash-card">
              <span className="dash-label">Active Cards</span>
              <span className="dash-value">{dashboardStats.totalCards}</span>
            </div>
            {portfolioBreakdown.totalCostBasis > 0 && (
              <div className="dash-card">
                <span className="dash-label">Cost Basis</span>
                <span className="dash-value">${portfolioBreakdown.totalCostBasis.toLocaleString()}</span>
              </div>
            )}
            {portfolioBreakdown.totalCostBasis > 0 && (
              <div className="dash-card">
                <span className="dash-label">Unrealized P/L</span>
                <span className={`dash-value ${portfolioBreakdown.unrealizedPL >= 0 ? "profit-positive" : "profit-negative"}`}>
                  {portfolioBreakdown.unrealizedPL >= 0 ? "+" : ""}${portfolioBreakdown.unrealizedPL.toLocaleString()}
                </span>
              </div>
            )}
            <div className="dash-card">
              <span className="dash-label">Realized P/L</span>
              <span className={`dash-value ${dashboardStats.realizedProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                {dashboardStats.realizedProfit >= 0 ? "+" : ""}${dashboardStats.realizedProfit.toLocaleString()}
              </span>
            </div>
            <div className="dash-card">
              <span className="dash-label">Sold</span>
              <span className="dash-value">{dashboardStats.soldCount}</span>
            </div>
            <div className="dash-card">
              <span className="dash-label">Grade Split</span>
              <div className="dash-grades">
                {[10, 9, 8, 7, 6, 0].map((g) =>
                  dashboardStats.gradeBreakdown[g] ? (
                    <span key={g} className={`dash-grade-chip psa-${g}`}>
                      {g === 0 ? "Raw" : g}: {dashboardStats.gradeBreakdown[g]}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          </div>

          {/* TOP MOVERS */}
          {(topMovers.gainers.length > 0 || topMovers.losers.length > 0) && (
            <div className="pro-movers">
              {topMovers.gainers.length > 0 && (
                <div className="movers-col movers-up">
                  <h3 className="movers-title">Top Gainers</h3>
                  {topMovers.gainers.map((ci) => {
                    const info = players[ci.card.player];
                    return (
                      <div key={ci.originalIndex} className="mover-card" onClick={() => handleEditCard(ci.originalIndex)}>
                        <div className="mover-info">
                          <span className="mover-name">{info?.full || ci.card.player}</span>
                          <span className="mover-product">{ci.card.year} {ci.card.product}</span>
                        </div>
                        <div className="mover-stats">
                          <span className="mover-value">${ci.card.value}</span>
                          <span className="mover-pct pct-up">{"\u25B2"} {Math.abs(ci.pctNum)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {topMovers.losers.length > 0 && (
                <div className="movers-col movers-down">
                  <h3 className="movers-title">Top Losers</h3>
                  {topMovers.losers.map((ci) => {
                    const info = players[ci.card.player];
                    return (
                      <div key={ci.originalIndex} className="mover-card" onClick={() => handleEditCard(ci.originalIndex)}>
                        <div className="mover-info">
                          <span className="mover-name">{info?.full || ci.card.player}</span>
                          <span className="mover-product">{ci.card.year} {ci.card.product}</span>
                        </div>
                        <div className="mover-stats">
                          <span className="mover-value">${ci.card.value}</span>
                          <span className="mover-pct pct-down">{"\u25BC"} {Math.abs(ci.pctNum)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {/* PORTFOLIO CHART — value by player */}
          {portfolioBreakdown.byPlayer.length > 0 && (
            <div className="pro-chart-section">
              <div className="pro-chart-header">
                <h3 className="pro-chart-title">Portfolio Breakdown</h3>
                <button className="csv-export-btn" onClick={handleExportCSV}>Export CSV</button>
              </div>
              <div className="pro-chart-bars">
                {portfolioBreakdown.byPlayer.slice(0, 8).map((p) => {
                  const pct = portfolioBreakdown.totalValue > 0 ? (p.value / portfolioBreakdown.totalValue) * 100 : 0;
                  // Find player key from full name
                  const playerKey = Object.entries(players).find(([, info]) => info.full === p.name)?.[0] || "";
                  return (
                    <div key={p.name} className="chart-bar-row chart-bar-clickable" onClick={() => { if (playerKey) handleFilterClick(playerKey); }}>
                      <span className="chart-bar-label">{p.name}</span>
                      <div className="chart-bar-track">
                        <div className="chart-bar-fill" style={{ width: `${Math.max(pct, 2)}%` }} />
                      </div>
                      <span className="chart-bar-value">${p.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MAIN CONTENT — hidden when Pro watchlist tab is active */}
      <main style={proView && proTab === "watchlist" ? { display: "none" } : undefined}>
        {status.loading ? (
          proView ? (
            /* PRO SKELETON LOADING */
            <div className="skeleton-wrap">
              <div className="skeleton-dash">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-card"><div className="skeleton-line skeleton-lg" /><div className="skeleton-line skeleton-sm" /></div>
                ))}
              </div>
              <div className="skeleton-rows">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-line skeleton-md" />
                    <div className="skeleton-line skeleton-sm" />
                    <div className="skeleton-line skeleton-xs" />
                    <div className="skeleton-line skeleton-xs" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="loading-overlay">
              <div className="spinner"></div>
              Loading cards...
            </div>
          )
        ) : proView ? (
          /* ---- PRO VIEW: sorted flat list or grid ---- */
          sortedCards.length === 0 ? (
            <div className="no-results">No cards found.</div>
          ) : gridView ? (
            /* GRID VIEW */
            <div className="pro-grid">
              {sortedCards.map((ci) => {
                const c = ci.card;
                const info = players[c.player];
                const pct = parsePct(c.pct || "");
                const imgSrc = c.frontImageUrl || c._psaImageUrl || null;
                const playerImg = getPlayerImage(players, c.player);
                return (
                  <div key={ci.originalIndex} className="pro-grid-card" onClick={() => handleEditCard(ci.originalIndex)}>
                    <div className="grid-card-image">
                      {imgSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imgSrc} alt={c.product} />
                      ) : (
                        <div className="grid-card-placeholder">
                          <span className={`grid-psa-badge psa-${c.psa}`}>{c.psa === 0 ? "RAW" : `PSA ${c.psa}`}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid-card-body">
                      <span className="grid-card-player">{info?.full || c.player}</span>
                      <span className="grid-card-product">{c.year} {c.product}</span>
                      <div className="grid-card-footer">
                        <span className="grid-card-value">${c.value}</span>
                        {pct.dir && (
                          <span className={`grid-card-pct ${pct.dir === "up" ? "pct-up" : "pct-down"}`}>
                            {pct.display}
                          </span>
                        )}
                        <span className={`grid-psa-badge psa-${c.psa}`}>{c.psa === 0 ? "Raw" : c.psa}</span>
                      </div>
                      {playerImg && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={playerImg} alt={info?.full || c.player} className="grid-player-headshot" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW — flat sorted table */
            <div className="pro-table-wrap">
              <table className="card-table pro-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Year</th>
                    <th>Product</th>
                    <th>PSA</th>
                    <th>Value</th>
                    <th>%</th>
                    <th>Range</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCards.map((ci, i) => {
                    const c = ci.card;
                    const info = players[c.player];
                    const pct = parsePct(c.pct || "");
                    return (
                      <tr key={`pro-${ci.originalIndex}-${i}`} className="card-row-clickable" onClick={() => handleEditCard(ci.originalIndex)}>
                        <td className="pro-player-cell">
                          <span className="pro-player-name">{info?.full || c.player}</span>
                        </td>
                        <td className="year">{c.year}</td>
                        <td className="product">{c.product || "\u2014"}</td>
                        <td className={`psa psa-${c.psa}`}>{c.psa === 0 ? "Raw" : c.psa}</td>
                        <td className="value">${c.value}</td>
                        <td className={`pct ${pct.dir === "up" ? "pct-up" : pct.dir === "down" ? "pct-down" : ""}`}>
                          {pct.display}
                        </td>
                        <td className="range">{c.range ? `$${c.range}` : "\u2014"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* ---- CLASSIC VIEW: grouped by player ---- */
          order.length === 0 ? (
            <div className="no-results">No cards found.</div>
          ) : (
            order.map((playerKey) => {
              const playerCards = groups[playerKey];
              const info = players[playerKey] || {
                full: playerKey,
                team: "",
              };
              const imgUrl = getPlayerImage(players, playerKey);
              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                info.full
              )}&background=1e293b&color=d4a843&size=120&bold=true&font-size=0.4`;
              const totalValue = playerCards.reduce(
                (sum, ci) => sum + (ci.card.value || 0),
                0
              );

              return (
                <section
                  key={playerKey}
                  className="player-section"
                  data-player={playerKey}
                >
                  <div className="player-header">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className="player-photo"
                      src={imgUrl || fallbackUrl}
                      alt={info.full}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = fallbackUrl;
                      }}
                    />
                    <div className="player-info">
                      <h2>{info.full}</h2>
                      <span className="team">{info.team}</span>
                    </div>
                    <div
                      style={{
                        marginLeft: "auto",
                        textAlign: "right",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "1px",
                        }}
                      >
                        Portfolio Value
                      </div>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          color: "var(--accent-gold)",
                        }}
                      >
                        ${totalValue.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <table className="card-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Product</th>
                        <th>PSA</th>
                        <th>Alt Value</th>
                        <th>Alt %</th>
                        <th>6-Mo Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerCards.map((ci, i) => {
                        const c = ci.card;
                        const pct = parsePct(c.pct || "");
                        return (
                          <tr
                            key={`${c.player}-${c.product}-${c.psa}-${i}`}
                            className="card-row-clickable"
                            onClick={() => handleEditCard(ci.originalIndex)}
                          >
                            <td className="year">{c.year}</td>
                            <td className="product">{c.product || "\u2014"}</td>
                            <td className={`psa psa-${c.psa}`}>{c.psa === 0 ? "Raw" : c.psa}</td>
                            <td className="value">${c.value}</td>
                            <td
                              className={`pct ${
                                pct.dir === "up"
                                  ? "pct-up"
                                  : pct.dir === "down"
                                    ? "pct-down"
                                    : ""
                              }`}
                            >
                              {pct.display}
                            </td>
                            <td className="range">
                              {c.range ? `$${c.range}` : "\u2014"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              );
            })
          )
        )}

        {/* SOLD CARDS SECTION */}
        {soldOrder.length > 0 && (
          <>
            <div className="sold-section-header" onClick={() => setShowSold(!showSold)}>
              <h2>Sold Cards ({soldOrder.reduce((sum, k) => sum + soldGroups[k].length, 0)})</h2>
              <div className="sold-profit-summary">
                <span className={`sold-total-profit ${totalProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
                  Total Profit: {totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString()}
                </span>
                <span className="sold-toggle">{showSold ? "▲ Hide" : "▼ Show"}</span>
              </div>
            </div>
            {showSold && soldOrder.map((playerKey) => {
              const playerCards = soldGroups[playerKey];
              const info = players[playerKey] || { full: playerKey, team: "" };
              return (
                <section key={`sold-${playerKey}`} className="player-section sold-player-section">
                  <div className="player-header">
                    <div className="player-info">
                      <h2>{info.full}</h2>
                      <span className="team">{info.team}</span>
                    </div>
                  </div>
                  <table className="card-table sold-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Product</th>
                        <th>PSA</th>
                        <th>Cost</th>
                        <th>Sale Price</th>
                        <th>Profit</th>
                        <th>Sold Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerCards.map((ci, i) => {
                        const c = ci.card;
                        const profit = (c.salePrice || 0) - (c.value || 0);
                        return (
                          <tr key={`sold-${c.player}-${i}`} className="card-row-clickable" onClick={() => handleEditCard(ci.originalIndex)}>
                            <td className="year">{c.year}</td>
                            <td className="product">{c.product || "\u2014"}</td>
                            <td className={`psa psa-${c.psa}`}>{c.psa === 0 ? "Raw" : c.psa}</td>
                            <td className="value">${c.value}</td>
                            <td className="value">${c.salePrice?.toLocaleString()}</td>
                            <td className={`profit ${profit >= 0 ? "profit-positive" : "profit-negative"}`}>
                              {profit >= 0 ? "+" : ""}${profit.toLocaleString()}
                            </td>
                            <td className="sold-date">
                              {c.soldAt ? new Date(c.soldAt).toLocaleDateString() : "\u2014"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              );
            })}
          </>
        )}
      </main>

      {/* ADD CARD MODAL */}
      <div
        className={`modal-overlay ${modalOpen ? "active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) { setModalOpen(false); resetForm(); }
        }}
      >
        <div className={`modal ${editingIndex !== null ? "pro-modal" : ""}`}>
          <div className="modal-header">
            <h3>{editingIndex !== null ? (cards[editingIndex]?.soldAt ? "Sold Card" : "Edit Card") : "Add New Card"}</h3>
            <button
              className="modal-close"
              onClick={() => { setModalOpen(false); resetForm(); }}
            >
              &times;
            </button>
          </div>

          {/* ============================================================ */}
          {/* PRO DETAIL VIEW — shows card details first, edit as secondary */}
          {/* ============================================================ */}
          {editingIndex !== null && !proModalEdit && (() => {
            const detailCard = cards[editingIndex];
            const detailInfo = players[detailCard?.player] || { full: detailCard?.player, team: "" };
            const detailPct = parsePct(detailCard?.pct || "");
            const detailImg = psaData?.imageUrl || detailCard?._psaImageUrl || detailCard?.frontImageUrl || scanFrontPreview;
            return (
              <div className="pro-detail">
                {/* Hero image */}
                {detailImg && (
                  <div className="pro-detail-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={detailImg} alt="Card" />
                  </div>
                )}

                {/* Card info */}
                <div className="pro-detail-header">
                  <h2 className="pro-detail-name">{detailInfo.full}</h2>
                  <span className="pro-detail-team">{detailInfo.team}</span>
                </div>

                <div className="pro-detail-stats">
                  <div className="pro-stat">
                    <span className="pro-stat-label">Year</span>
                    <span className="pro-stat-value">{detailCard?.year}</span>
                  </div>
                  <div className="pro-stat">
                    <span className="pro-stat-label">Product</span>
                    <span className="pro-stat-value">{detailCard?.product}</span>
                  </div>
                  <div className="pro-stat">
                    <span className="pro-stat-label">Grade</span>
                    <span className={`pro-stat-value psa-${detailCard?.psa}`}>{detailCard?.psa === 0 ? "Raw" : `PSA ${detailCard?.psa}`}</span>
                  </div>
                  <div className="pro-stat">
                    <span className="pro-stat-label">Value</span>
                    <span className="pro-stat-value pro-stat-gold">${detailCard?.value}</span>
                  </div>
                  {detailPct.dir && (
                    <div className="pro-stat">
                      <span className="pro-stat-label">Change</span>
                      <span className={`pro-stat-value ${detailPct.dir === "up" ? "pct-up" : "pct-down"}`}>{detailPct.display}</span>
                    </div>
                  )}
                  {detailCard?.range && (
                    <div className="pro-stat">
                      <span className="pro-stat-label">6-Mo Range</span>
                      <span className="pro-stat-value">${detailCard.range}</span>
                    </div>
                  )}
                  {detailCard?.certNumber && (
                    <div className="pro-stat">
                      <span className="pro-stat-label">Cert #</span>
                      <span className="pro-stat-value">{detailCard.certNumber}</span>
                    </div>
                  )}
                </div>

                {/* PSA Verification */}
                {psaLoading && <div className="psa-info-section"><span className="psa-loading">Verifying with PSA...</span></div>}
                {psaData && !psaLoading && (
                  <div className="psa-info-section">
                    <div className="psa-verified-badge">PSA VERIFIED</div>
                    <div className="psa-info-grid">
                      <div className="psa-info-item"><span className="psa-info-label">Grade</span><span className="psa-info-value">{psaData.grade}</span></div>
                      <div className="psa-info-item"><span className="psa-info-label">Population</span><span className="psa-info-value">{psaData.population.toLocaleString()}</span></div>
                      <div className="psa-info-item"><span className="psa-info-label">Pop Higher</span><span className="psa-info-value">{psaData.populationHigher.toLocaleString()}</span></div>
                    </div>
                    {psaData.externalUrl && (
                      <a href={psaData.externalUrl} target="_blank" rel="noopener noreferrer" className="psa-link">View on PSA →</a>
                    )}
                  </div>
                )}

                {/* Sold info */}
                {detailCard?.soldAt && (
                  <div className="sold-info-section">
                    <div className="sold-info-row"><span>Sale Price:</span><span className="sold-info-value">${detailCard.salePrice?.toLocaleString()}</span></div>
                    <div className="sold-info-row">
                      <span>Profit:</span>
                      <span className={((detailCard.salePrice || 0) - (detailCard.value || 0)) >= 0 ? "profit-positive" : "profit-negative"}>
                        {((detailCard.salePrice || 0) - (detailCard.value || 0)) >= 0 ? "+" : ""}${((detailCard.salePrice || 0) - (detailCard.value || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="sold-info-row"><span>Sold:</span><span className="sold-info-value">{new Date(detailCard.soldAt).toLocaleString()}</span></div>
                  </div>
                )}

                {/* eBay Comps */}
                <div className="ebay-comps-section">
                  <div className="ebay-comps-header" onClick={() => setEbayCompsOpen(!ebayCompsOpen)}>
                    <h4 className="ebay-comps-title">eBay Market Comps</h4>
                    <span className="ebay-comps-toggle">{ebayCompsOpen ? "\u25B2" : "\u25BC"}</span>
                  </div>

                  {/* Summary always visible */}
                  {ebayCompsLoading && <div className="ebay-comps-loading">Searching eBay...</div>}
                  {ebayCompsError && <div className="ebay-comps-error">{ebayCompsError}</div>}
                  {!ebayCompsLoading && !ebayCompsError && ebayCompsAvg !== null && (
                    <div className="ebay-comps-summary">
                      <div className="ebay-stat">
                        <span className="ebay-stat-label">Avg</span>
                        <span className="ebay-stat-value">${ebayCompsAvg.toLocaleString()}</span>
                      </div>
                      <div className="ebay-stat">
                        <span className="ebay-stat-label">Low</span>
                        <span className="ebay-stat-value">${ebayCompsLow?.toLocaleString()}</span>
                      </div>
                      <div className="ebay-stat">
                        <span className="ebay-stat-label">High</span>
                        <span className="ebay-stat-value">${ebayCompsHigh?.toLocaleString()}</span>
                      </div>
                      <div className="ebay-stat">
                        <span className="ebay-stat-label">Listings</span>
                        <span className="ebay-stat-value">{ebayCompsTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  {!ebayCompsLoading && !ebayCompsError && ebayComps.length === 0 && ebayCompsAvg === null && (
                    <div className="ebay-comps-empty">No eBay listings found for this card.</div>
                  )}

                  {/* Expanded listing detail */}
                  {ebayCompsOpen && ebayComps.length > 0 && (
                    <div className="ebay-comps-list">
                      {ebayComps.map((comp) => (
                        <a key={comp.itemId} href={comp.itemUrl} target="_blank" rel="noopener noreferrer" className={`ebay-comp-item ${comp.gradeMatch === "different" ? "ebay-comp-diff" : ""}`}>
                          {comp.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={comp.imageUrl} alt="" className="ebay-comp-img" />
                          )}
                          <div className="ebay-comp-info">
                            <span className="ebay-comp-title">{comp.title}</span>
                            <div className="ebay-comp-meta-row">
                              {comp.gradeLabel && (
                                <span className={`ebay-grade-badge ${comp.gradeMatch === "exact" ? "grade-exact" : comp.gradeMatch === "different" ? "grade-diff" : ""}`}>
                                  {comp.gradeLabel}
                                </span>
                              )}
                              {comp.listingDate && (
                                <span className="ebay-comp-date">{new Date(comp.listingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                              )}
                              <span className="ebay-comp-meta">{comp.seller}</span>
                            </div>
                          </div>
                          <span className="ebay-comp-price">${comp.price.toLocaleString()}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="pro-detail-actions">
                  <button className="pro-edit-btn" onClick={() => setProModalEdit(true)}>Edit Card</button>
                  {!detailCard?.soldAt && (
                    <button className="pro-sell-btn" onClick={() => { setProModalEdit(true); setSellMode(true); }}>Sell Card</button>
                  )}
                </div>

                {/* Unsell for sold cards */}
                {detailCard?.soldAt && (
                  <div className="unsell-section">
                    <div className="unsell-row">
                      <input type="password" placeholder="Enter code to reverse" value={unsellCode} onChange={(e) => setUnsellCode(e.target.value)} className="unsell-code-input" />
                      <button type="button" className="unsell-btn" disabled={submitting || unsellCode !== "0319"} onClick={handleUnsellCard}>Reverse Sale</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ============================================================ */}
          {/* CLASSIC MODAL / PRO EDIT MODE — form view                    */}
          {/* ============================================================ */}
          {(editingIndex === null || proModalEdit) && (
          <>
          {/* Back to detail button (edit mode) */}
          {proModalEdit && editingIndex !== null && (
            <button className="pro-back-btn" onClick={() => setProModalEdit(false)}>&larr; Back to Details</button>
          )}

          {/* Card Image Display (PSA image, stored image, or scan preview) */}
          {editingIndex !== null && (psaData?.imageUrl || cards[editingIndex]?._psaImageUrl || cards[editingIndex]?.frontImageUrl || scanFrontPreview) && (
            <div className="card-image-display">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={psaData?.imageUrl || cards[editingIndex]?._psaImageUrl || cards[editingIndex]?.frontImageUrl || scanFrontPreview || ""}
                alt="Card"
                className="card-image-large"
              />
            </div>
          )}

          {/* PSA Verification Data */}
          {psaLoading && (
            <div className="psa-info-section">
              <span className="psa-loading">Verifying with PSA...</span>
            </div>
          )}
          {psaData && !psaLoading && (
            <div className="psa-info-section">
              <div className="psa-verified-badge">PSA VERIFIED</div>
              <div className="psa-info-grid">
                <div className="psa-info-item">
                  <span className="psa-info-label">Grade</span>
                  <span className="psa-info-value">{psaData.grade}</span>
                </div>
                <div className="psa-info-item">
                  <span className="psa-info-label">Population</span>
                  <span className="psa-info-value">{psaData.population.toLocaleString()}</span>
                </div>
                <div className="psa-info-item">
                  <span className="psa-info-label">Pop Higher</span>
                  <span className="psa-info-value">{psaData.populationHigher.toLocaleString()}</span>
                </div>
              </div>
              {psaData.externalUrl && (
                <a href={psaData.externalUrl} target="_blank" rel="noopener noreferrer" className="psa-link">
                  View on PSA →
                </a>
              )}
            </div>
          )}

          {/* Scan Card Section */}
          <div className="scan-section">
            <div className="scan-photos">
              <div className="scan-photo-slot">
                <label className="scan-photo-label" htmlFor="scan-front">
                  {scanFrontPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scanFrontPreview} alt="Front" className="scan-preview" />
                  ) : (
                    <span>FRONT</span>
                  )}
                </label>
                <input
                  id="scan-front"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  disabled={scanning}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleScanFile(e.target.files[0], "front");
                      e.target.value = "";
                    }
                  }}
                />
              </div>
              <div className="scan-photo-slot">
                <label className="scan-photo-label" htmlFor="scan-back">
                  {scanBackPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scanBackPreview} alt="Back" className="scan-preview" />
                  ) : (
                    <span>BACK</span>
                  )}
                </label>
                <input
                  id="scan-back"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: "none" }}
                  disabled={scanning}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleScanFile(e.target.files[0], "back");
                      e.target.value = "";
                    }
                  }}
                />
              </div>
              <button
                type="button"
                className="scan-btn"
                disabled={scanning || !scanFrontFile || !scanBackFile}
                onClick={handleScanSubmit}
              >
                {scanning ? "Scanning..." : "Scan Card"}
              </button>
            </div>
            <span className="scan-hint">
              Take a photo of the front and back to auto-fill
            </span>
            {scanError && <span className="scan-error">{scanError}</span>}
            {scanConfidence && (
              <span className={`scan-confidence scan-confidence-${scanConfidence}`}>
                {scanConfidence} confidence
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Player Name</label>
                <input
                  type="text"
                  list="playerList"
                  placeholder="e.g. Shedeur Sanders"
                  required
                  autoComplete="off"
                  value={formFullName}
                  onChange={(e) => handleFullNameInput(e.target.value)}
                />
                <datalist id="playerList">
                  {playerNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="form-group">
                <label>Team</label>
                <input
                  type="text"
                  placeholder="e.g. Cleveland Browns"
                  value={formTeam}
                  onChange={(e) => setFormTeam(e.target.value)}
                />
              </div>
              <div className="form-group year-group">
                <label>Year</label>
                <input
                  type="number"
                  required
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Product</label>
                <input
                  type="text"
                  placeholder="e.g. Mosaic Green"
                  required
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>PSA Grade</label>
                <select
                  required
                  value={formPSA}
                  onChange={(e) => setFormPSA(e.target.value)}
                >
                  <option value="10">PSA 10</option>
                  <option value="9">PSA 9</option>
                  <option value="8">PSA 8</option>
                  <option value="7">PSA 7</option>
                  <option value="6">PSA 6</option>
                  <option value="0">Raw</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Value ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  required
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>% Change</label>
                <div className="pct-input-group">
                  <input
                    type="text"
                    placeholder="e.g. 15%"
                    value={formPct}
                    onChange={(e) => setFormPct(e.target.value)}
                  />
                  <select
                    value={formPctDir}
                    onChange={(e) => setFormPctDir(e.target.value)}
                  >
                    <option value="">&mdash;</option>
                    <option value="U">Up</option>
                    <option value="D">Down</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>6-Month Range</label>
                <input
                  type="text"
                  placeholder="e.g. 45-108"
                  value={formRange}
                  onChange={(e) => setFormRange(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>PSA Cert #</label>
                <input
                  type="text"
                  placeholder="e.g. 12345678"
                  value={formCert}
                  onChange={(e) => setFormCert(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                  <label>Purchase Price ($)</label>
                  <input
                    type="number"
                    placeholder="What you paid"
                    value={formPurchase}
                    onChange={(e) => setFormPurchase(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            <button
              type="submit"
              className="form-submit"
              disabled={submitting}
            >
              {submitting ? "Saving..." : editingIndex !== null ? "Save Changes" : "Add Card"}
            </button>
          </form>

          {/* Sell Card Section (only when editing an active card) */}
          {editingIndex !== null && !cards[editingIndex]?.soldAt && (
            <div className="sell-section">
              <div className="sell-section-header" onClick={() => setSellMode(!sellMode)}>
                <span>Sell This Card</span>
                <span className="sell-toggle">{sellMode ? "▲" : "▼"}</span>
              </div>
              {sellMode && (
                <div className="sell-form">
                  <div className="form-group">
                    <label>Sale Price ($)</label>
                    <input
                      type="number"
                      placeholder="Enter sale amount"
                      value={formSalePrice}
                      onChange={(e) => setFormSalePrice(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {formSalePrice && parseFloat(formSalePrice) > 0 && (
                    <div className="sell-profit-preview">
                      <span>Profit: </span>
                      <span className={
                        (parseFloat(formSalePrice) - (cards[editingIndex]?.value || 0)) >= 0
                          ? "profit-positive" : "profit-negative"
                      }>
                        {(parseFloat(formSalePrice) - (cards[editingIndex]?.value || 0)) >= 0 ? "+" : ""}
                        ${(parseFloat(formSalePrice) - (cards[editingIndex]?.value || 0)).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="sell-confirm-btn"
                    disabled={submitting || !formSalePrice || parseFloat(formSalePrice) <= 0}
                    onClick={handleSellCard}
                  >
                    {submitting ? "Processing..." : "Confirm Sale"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sold card info (when viewing a sold card) */}
          {editingIndex !== null && cards[editingIndex]?.soldAt && (
            <div className="sold-info-section">
              <div className="sold-info-row">
                <span>Sale Price:</span>
                <span className="sold-info-value">${cards[editingIndex]?.salePrice?.toLocaleString()}</span>
              </div>
              <div className="sold-info-row">
                <span>Profit:</span>
                <span className={
                  ((cards[editingIndex]?.salePrice || 0) - (cards[editingIndex]?.value || 0)) >= 0
                    ? "profit-positive" : "profit-negative"
                }>
                  {((cards[editingIndex]?.salePrice || 0) - (cards[editingIndex]?.value || 0)) >= 0 ? "+" : ""}
                  ${((cards[editingIndex]?.salePrice || 0) - (cards[editingIndex]?.value || 0)).toLocaleString()}
                </span>
              </div>
              <div className="sold-info-row">
                <span>Sold:</span>
                <span className="sold-info-value">
                  {new Date(cards[editingIndex]?.soldAt || "").toLocaleString()}
                </span>
              </div>
              <div className="unsell-section">
                <div className="unsell-row">
                  <input
                    type="password"
                    placeholder="Enter code to reverse"
                    value={unsellCode}
                    onChange={(e) => setUnsellCode(e.target.value)}
                    className="unsell-code-input"
                  />
                  <button
                    type="button"
                    className="unsell-btn"
                    disabled={submitting || unsellCode !== "0319"}
                    onClick={handleUnsellCard}
                  >
                    Reverse Sale
                  </button>
                </div>
              </div>
            </div>
          )}
          </>
          )}

          {/* TOAST NOTIFICATION */}
        </div>
      </div>

      {/* WATCHLIST MODAL */}
      {watchModalOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setWatchModalOpen(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add to Watchlist</h3>
              <button className="modal-close" onClick={() => setWatchModalOpen(false)}>&times;</button>
            </div>
            <div className="watch-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Player Name</label>
                  <input type="text" placeholder="e.g. Patrick Mahomes" value={watchPlayer} onChange={(e) => setWatchPlayer(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group year-group">
                  <label>Year</label>
                  <input type="number" value={watchYear} onChange={(e) => setWatchYear(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Product</label>
                  <input type="text" placeholder="e.g. Prizm Silver" value={watchProduct} onChange={(e) => setWatchProduct(e.target.value)} />
                </div>
                <div className="form-group year-group">
                  <label>PSA</label>
                  <select value={watchPSA} onChange={(e) => setWatchPSA(e.target.value)}>
                    <option value="10">10</option><option value="9">9</option><option value="8">8</option><option value="0">Raw</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Price ($)</label>
                  <input type="number" placeholder="Max you'd pay" value={watchTarget} onChange={(e) => setWatchTarget(e.target.value)} min="0" />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input type="text" placeholder="Optional notes" value={watchNotes} onChange={(e) => setWatchNotes(e.target.value)} />
                </div>
              </div>
              <button className="form-submit" onClick={handleAddWatchlist} disabled={!watchPlayer.trim() || !watchProduct.trim()}>
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WATCHLIST SECTION (Pro view, watchlist tab) */}
      {proView && proTab === "watchlist" && (
        <div className="watchlist-section">
          <div className="watchlist-header">
            <h2 className="watchlist-title">Watchlist</h2>
            <button className="add-card-btn" onClick={() => setWatchModalOpen(true)}>+ Add</button>
          </div>
          {watchlist.length === 0 ? (
            <div className="no-results">No cards on your watchlist yet.</div>
          ) : (
            <div className="watchlist-grid">
              {watchlist.map((item, i) => (
                <div key={i} className="watchlist-card">
                  <div className="watchlist-card-info">
                    <span className="watchlist-card-player">{item.player}</span>
                    <span className="watchlist-card-product">{item.year} {item.product}</span>
                    <span className="watchlist-card-meta">
                      {item.psa === 0 ? "Raw" : `PSA ${item.psa}`}
                      {item.targetPrice > 0 && ` | Target: $${item.targetPrice}`}
                    </span>
                    {item.notes && <span className="watchlist-card-notes">{item.notes}</span>}
                  </div>
                  <button className="watchlist-remove" onClick={() => handleRemoveWatchlist(i)} title="Remove">&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRO MOBILE BOTTOM NAV */}
      {proView && (
        <nav className="pro-bottom-nav">
          <button className={`bottom-nav-btn ${proTab === "portfolio" ? "active" : ""}`} onClick={() => setProTab("portfolio")}>
            <span className="bottom-nav-icon">&#9733;</span>
            <span className="bottom-nav-label">Portfolio</span>
          </button>
          <button className="bottom-nav-btn" onClick={() => { setProTab("portfolio"); resetForm(); setModalOpen(true); }}>
            <span className="bottom-nav-icon bottom-nav-scan">&#9211;</span>
            <span className="bottom-nav-label">Scan</span>
          </button>
          <button className={`bottom-nav-btn ${proTab === "watchlist" ? "active" : ""}`} onClick={() => setProTab("watchlist")}>
            <span className="bottom-nav-icon">&#9788;</span>
            <span className="bottom-nav-label">Watchlist</span>
          </button>
        </nav>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
