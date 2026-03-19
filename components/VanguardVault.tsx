"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Card, PlayerInfo, DataStatus, DataProvider } from "@/lib/types";
import { LocalProvider, MockProvider, AltProvider, PSAProvider } from "@/lib/providers";

// ============================================================
// Provider registry
// ============================================================
const PROVIDERS: Record<string, DataProvider> = {
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
    source: "Local",
    lastUpdated: null,
    loading: true,
    error: null,
  });
  const [activeProvider, setActiveProvider] = useState("local");

  // --- UI state ---
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

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

  // --- Scan state ---
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanConfidence, setScanConfidence] = useState<string | null>(null);

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
  const { groups, order } = useMemo(() => {
    let filtered = [...cards];
    if (filter !== "all") {
      filtered = filtered.filter((c) => c.player === filter);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((c) => {
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
    const g: Record<string, Card[]> = {};
    const o: string[] = [];
    filtered.forEach((c) => {
      if (!g[c.player]) {
        g[c.player] = [];
        o.push(c.player);
      }
      g[c.player].push(c);
    });
    return { groups: g, order: o };
  }, [cards, players, filter, search]);

  // Unique players for filter buttons
  const filterPlayers = useMemo(() => {
    const seen = new Set<string>();
    return cards
      .filter((c) => {
        if (seen.has(c.player)) return false;
        seen.add(c.player);
        return true;
      })
      .map((c) => c.player);
  }, [cards]);

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
    setScanError(null);
    setScanConfidence(null);
  };

  const handleScanCard = async (files: FileList) => {
    setScanning(true);
    setScanError(null);
    setScanConfidence(null);

    try {
      // Convert files to base64
      const images: { data: string; mediaType: string }[] = [];
      for (let i = 0; i < Math.min(files.length, 4); i++) {
        const file = files[i];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip the data:image/...;base64, prefix
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        images.push({ data: base64, mediaType: file.type || "image/jpeg" });
      }

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
      if (card.psaGrade) setFormPSA(String(card.psaGrade));
      if (card.certNumber) setFormCert(card.certNumber);
      setScanConfidence(card.confidence);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      setScanError(message);
    } finally {
      setScanning(false);
    }
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
    const value = parseInt(formValue);
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

    await LocalProvider.saveCard(card, playerKey, newPlayerData);

    // Update state
    setCards((prev) => [...prev, card]);
    if (newPlayerData) {
      setPlayers((prev) => ({ ...prev, [playerKey!]: newPlayerData! }));
    }

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

      {/* FILTER BAR */}
      <nav className="filter-bar">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => handleFilterClick("all")}
        >
          All Players
        </button>
        {filterPlayers.map((key) => {
          const info = players[key] || { full: key };
          return (
            <button
              key={key}
              className={`filter-btn ${filter === key ? "active" : ""}`}
              onClick={() => handleFilterClick(key)}
            >
              {info.full}
            </button>
          );
        })}
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
            <option value="local">Local</option>
            <option value="mock">Mock (Sim)</option>
            <option value="psa">PSA Verified</option>
            <option value="alt">Alt (Live)</option>
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
              (sum, c) => sum + (c.value || 0),
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
                    {playerCards.map((c, i) => {
                      const pct = parsePct(c.pct || "");
                      return (
                        <tr key={`${c.player}-${c.product}-${c.psa}-${i}`}>
                          <td className="year">{c.year}</td>
                          <td className="product">{c.product || "\u2014"}</td>
                          <td className={`psa psa-${c.psa}`}>{c.psa}</td>
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
            <h3>Add New Card</h3>
            <button
              className="modal-close"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
          </div>

          {/* Scan Card Section */}
          <div className="scan-section">
            <label className="scan-btn" htmlFor="scan-input">
              {scanning ? "Scanning..." : "Scan Card"}
            </label>
            <input
              id="scan-input"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              style={{ display: "none" }}
              disabled={scanning}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleScanCard(e.target.files);
                  e.target.value = "";
                }
              }}
            />
            <span className="scan-hint">
              Take a photo of front &amp; back to auto-fill
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
              <div className="form-group">
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
              {submitting ? "Looking up player..." : "Add Card"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
