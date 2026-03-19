"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Card, PlayerInfo, DataStatus, DataProvider } from "@/lib/types";
import { LocalProvider, MockProvider, AltProvider, PSAProvider, SupabaseProvider } from "@/lib/providers";

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
  };

  const handleEditCard = (cardIndex: number) => {
    const card = cards[cardIndex];
    if (!card) return;

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
    setEditingIndex(cardIndex);
    setModalOpen(true);

    // Auto-fetch PSA data if card has a cert number
    if (card.certNumber) {
      fetchPsaCert(card.certNumber);
    }
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
        return card;
      }
      return null;
    } catch {
      return null;
    } finally {
      setPsaLoading(false);
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
    const card: Card = { year, player: playerKey, product, psa, value, pct, range, certNumber };

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

    setModalOpen(false);
    resetForm();
    setSubmitting(false);
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
          <button className="psa-lookup-btn" onClick={() => { setPsaLookupOpen(!psaLookupOpen); setPsaLookupResult(null); setPsaLookupError(null); setPsaLookupCert(""); }}>
            PSA Lookup
          </button>
          <button className="add-card-btn" onClick={() => setModalOpen(true)}>
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
          <button
            className={`refresh-btn ${status.loading ? "spinning" : ""}`}
            onClick={handleRefresh}
            title="Refresh data"
          >
            &#8635; Refresh
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <main>
        {status.loading ? (
          <div className="loading-overlay">
            <div className="spinner"></div>
            Loading cards...
          </div>
        ) : order.length === 0 ? (
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
          if (e.target === e.currentTarget) setModalOpen(false);
        }}
      >
        <div className="modal">
          <div className="modal-header">
            <h3>{editingIndex !== null ? (cards[editingIndex]?.soldAt ? "Sold Card" : "Edit Card") : "Add New Card"}</h3>
            <button
              className="modal-close"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
          </div>

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
        </div>
      </div>
    </>
  );
}
