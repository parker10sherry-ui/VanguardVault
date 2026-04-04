"use client";

import { useState, useCallback } from "react";
import type { Card, PlayerInfo } from "@/lib/types";
import { generatePlayerKey, fetchEspnId } from "@/lib/helpers";
import { updateCardAtIndex } from "@/lib/providers/localProvider";

// Hooks
import { useCards, PROVIDERS } from "@/hooks/useCards";
import { useToast } from "@/hooks/useToast";
import { useFilteredCards } from "@/hooks/useFilteredCards";
import { usePortfolioStats } from "@/hooks/usePortfolioStats";
import { useEbayCheck } from "@/hooks/useEbayCheck";
import { useEbayComps } from "@/hooks/useEbayComps";
import { usePsaLookup } from "@/hooks/usePsaLookup";
import { usePsaVerify } from "@/hooks/usePsaVerify";
import { useCardScanner } from "@/hooks/useCardScanner";
import { useWatchlist } from "@/hooks/useWatchlist";

// Components
import Header from "@/components/Header";
import EbayCheckPanel from "@/components/EbayCheckPanel";
import PsaLookupPanel from "@/components/PsaLookupPanel";
import FilterBar from "@/components/FilterBar";
import StatusBar from "@/components/StatusBar";
import ProDashboard from "@/components/ProDashboard";
import CardGridView from "@/components/CardGridView";
import CardTableView from "@/components/CardTableView";
import ClassicView from "@/components/ClassicView";
import SoldCardsSection from "@/components/SoldCardsSection";
import CardModal from "@/components/CardModal";
import WatchlistModal from "@/components/WatchlistModal";
import WatchlistSection from "@/components/WatchlistSection";
import ProBottomNav from "@/components/ProBottomNav";
import Toast from "@/components/Toast";

export default function VanguardVault() {
  // --- Core hooks ---
  const { toast, showToast } = useToast();
  const {
    cards, setCards, players, setPlayers, status, activeProvider,
    loadData, handleProviderChange, handleRefresh,
    filterPlayers, playerNames,
  } = useCards();

  const {
    filter, search, sortBy, setSortBy, sortDir, setSortDir,
    groups, order, soldGroups, soldOrder, totalProfit, sortedCards,
    handleFilterClick, handleSearchChange,
  } = useFilteredCards(cards, players);

  const { dashboardStats, topMovers, portfolioBreakdown } = usePortfolioStats(cards, players);

  // --- Feature hooks ---
  const ebayCheck = useEbayCheck();
  const psaLookup = usePsaLookup();
  const psaVerify = usePsaVerify(setCards);
  const ebayComps = useEbayComps(players);
  const watchlist = useWatchlist(showToast);

  // --- UI state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [proView, setProView] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("vv_proView") === "true";
    }
    return false;
  });
  const [gridView, setGridView] = useState(false);
  const [proModalEdit, setProModalEdit] = useState(false);
  const [proTab, setProTab] = useState<"portfolio" | "scan" | "watchlist">("portfolio");
  const [showSold, setShowSold] = useState(false);

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
  const [sellMode, setSellMode] = useState(false);
  const [formSalePrice, setFormSalePrice] = useState("");
  const [unsellCode, setUnsellCode] = useState("");

  // --- Scanner (needs form setters) ---
  const scanner = useCardScanner(
    (data) => {
      if (data.playerName) setFormFullName(data.playerName);
      if (data.team) setFormTeam(data.team);
      if (data.year) setFormYear(String(data.year));
      if (data.product) setFormProduct(data.product);
      setFormPSA(data.psaGrade != null ? String(data.psaGrade) : "0");
      if (data.certNumber) setFormCert(data.certNumber);
    },
    psaVerify.fetchPsaCert
  );

  // --- Handlers ---
  const resetForm = () => {
    setFormFullName(""); setFormTeam(""); setFormProduct(""); setFormValue("");
    setFormPct(""); setFormPctDir(""); setFormRange(""); setFormCert("");
    setFormPurchase(""); setFormYear("2025"); setFormPSA("10");
    setEditingIndex(null); setSellMode(false); setFormSalePrice("");
    setUnsellCode(""); setProModalEdit(false);
    psaVerify.reset();
    scanner.reset();
    ebayComps.reset();
  };

  const handleToggleProView = () => {
    setProView((prev) => {
      const next = !prev;
      localStorage.setItem("vv_proView", String(next));
      return next;
    });
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

  const handleEditCard = (cardIndex: number) => {
    const card = cards[cardIndex];
    if (!card) return;

    // Reset modal state
    setProModalEdit(false);
    setSellMode(false);
    setFormSalePrice("");
    setUnsellCode("");
    psaVerify.reset();
    scanner.reset();
    ebayComps.reset();

    const info = players[card.player];
    setFormFullName(info ? info.full : card.player);
    setFormTeam(info ? info.team : "");
    setFormYear(String(card.year));
    setFormProduct(card.product);
    setFormPSA(String(card.psa));
    setFormValue(String(card.value || ""));
    setFormCert(card.certNumber || "");

    if (card.pct) {
      const clean = card.pct.replace(/\s/g, "");
      if (clean.includes("U")) { setFormPctDir("U"); setFormPct(clean.replace("U", "").trim()); }
      else if (clean.includes("D")) { setFormPctDir("D"); setFormPct(clean.replace("D", "").trim()); }
      else { setFormPctDir(""); setFormPct(clean); }
    } else { setFormPct(""); setFormPctDir(""); }

    setFormRange(card.range || "");
    setFormPurchase(card.purchase || "");
    setEditingIndex(cardIndex);
    setModalOpen(true);

    if (card.certNumber) psaVerify.fetchPsaCert(card.certNumber, cardIndex);
    ebayComps.fetchEbayComps(card);
  };

  const handleExportCSV = useCallback(() => {
    const active = cards.filter((c) => !c.soldAt);
    const headers = ["Player", "Team", "Year", "Product", "PSA Grade", "Value", "Cost Basis", "% Change", "6-Mo Range", "Cert #"];
    const rows = active.map((c) => {
      const info = players[c.player];
      return [
        info?.full || c.player, info?.team || "", c.year, c.product,
        c.psa === 0 ? "Raw" : c.psa, c.value || 0, c.purchase || "",
        c.pct || "", c.range || "", c.certNumber || "",
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
    const pct = formPct.trim() ? `${formPct.trim()} ${formPctDir}`.trim() : "";
    const range = formRange.trim();

    let playerKey: string | null = null;
    for (const [key, info] of Object.entries(players)) {
      if (info.full.toLowerCase() === fullName.toLowerCase()) { playerKey = key; break; }
    }

    let newPlayerData: PlayerInfo | null = null;
    if (!playerKey) {
      playerKey = generatePlayerKey(fullName);
      let baseKey = playerKey;
      let counter = 2;
      while (players[playerKey]) { playerKey = `${baseKey} ${counter}`; counter++; }
      const espnId = await fetchEspnId(fullName);
      newPlayerData = { full: fullName, team: team || "Unknown", espnId };
    }

    const certNumber = formCert.trim() || undefined;
    const purchase = formPurchase.trim() || "";
    const existingImages = editingIndex !== null ? cards[editingIndex] : null;
    const card: Card = {
      year, player: playerKey, product, psa, value, pct, range, certNumber, purchase,
      frontImageUrl: scanner.croppedFrontUrl || existingImages?.frontImageUrl || undefined,
      backImageUrl: scanner.croppedBackUrl || existingImages?.backImageUrl || undefined,
    };

    const provider = PROVIDERS[activeProvider];

    if (editingIndex !== null) {
      const existingCard = cards[editingIndex];
      if (existingCard?.id && provider.updateCard) {
        await provider.updateCard(existingCard.id, card);
      } else if (activeProvider === "local") {
        updateCardAtIndex(editingIndex, card);
      }
      setCards((prev) => {
        const updated = [...prev];
        updated[editingIndex] = { ...card, id: existingCard?.id };
        return updated;
      });
    } else {
      await provider.saveCard(card, playerKey, newPlayerData);
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
    const soldCard: Card = { ...existingCard, salePrice, soldAt: new Date().toISOString() };

    const provider = PROVIDERS[activeProvider];
    if (existingCard?.id && provider.updateCard) {
      await provider.updateCard(existingCard.id, soldCard);
    } else if (activeProvider === "local") {
      updateCardAtIndex(editingIndex, soldCard);
    }

    setCards((prev) => { const updated = [...prev]; updated[editingIndex] = soldCard; return updated; });
    setModalOpen(false); resetForm(); setSubmitting(false);
    showToast("Card sold");
  };

  const handleUnsellCard = async () => {
    if (editingIndex === null) return;
    if (unsellCode !== "0319") return;

    setSubmitting(true);
    const existingCard = cards[editingIndex];
    const restoredCard: Card = { ...existingCard, salePrice: null, soldAt: null };

    const provider = PROVIDERS[activeProvider];
    if (existingCard?.id && provider.updateCard) {
      await provider.updateCard(existingCard.id, restoredCard);
    } else if (activeProvider === "local") {
      updateCardAtIndex(editingIndex, restoredCard);
    }

    setCards((prev) => { const updated = [...prev]; updated[editingIndex] = restoredCard; return updated; });
    setModalOpen(false); resetForm(); setSubmitting(false);
    showToast("Sale reversed");
  };

  const handleCloseModal = () => { setModalOpen(false); resetForm(); };

  // ============================================================
  // Render
  // ============================================================
  return (
    <>
      <Header
        proView={proView}
        onToggleProView={handleToggleProView}
        search={search}
        onSearchChange={handleSearchChange}
        onAddCard={() => { resetForm(); setModalOpen(true); }}
        onToggleEbayCheck={ebayCheck.togglePanel}
        onTogglePsaLookup={psaLookup.togglePanel}
      />

      {ebayCheck.ebayCheckOpen && <EbayCheckPanel {...ebayCheck} />}
      {psaLookup.psaLookupOpen && <PsaLookupPanel {...psaLookup} />}

      <FilterBar
        filter={filter}
        onFilterChange={handleFilterClick}
        filterPlayers={filterPlayers}
        players={players}
        proView={proView}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDir={sortDir}
        setSortDir={setSortDir}
        gridView={gridView}
        setGridView={setGridView}
      />

      <StatusBar
        status={status}
        activeProvider={activeProvider}
        onProviderChange={handleProviderChange}
        onRefresh={handleRefresh}
        onExportCSV={handleExportCSV}
      />

      {proView && !status.loading && proTab === "portfolio" && (
        <ProDashboard
          dashboardStats={dashboardStats}
          portfolioBreakdown={portfolioBreakdown}
          topMovers={topMovers}
          players={players}
          onEditCard={handleEditCard}
          onFilterClick={handleFilterClick}
          onExportCSV={handleExportCSV}
        />
      )}

      <main style={proView && proTab === "watchlist" ? { display: "none" } : undefined}>
        {status.loading ? (
          proView ? (
            <div className="skeleton-wrap">
              <div className="skeleton-dash">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton-card"><div className="skeleton-line skeleton-lg" /><div className="skeleton-line skeleton-sm" /></div>
                ))}
              </div>
              <div className="skeleton-rows">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-line skeleton-md" /><div className="skeleton-line skeleton-sm" />
                    <div className="skeleton-line skeleton-xs" /><div className="skeleton-line skeleton-xs" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="loading-overlay"><div className="spinner"></div>Loading cards...</div>
          )
        ) : proView ? (
          sortedCards.length === 0 ? (
            <div className="no-results">No cards found.</div>
          ) : gridView ? (
            <CardGridView sortedCards={sortedCards} players={players} onEditCard={handleEditCard} />
          ) : (
            <CardTableView sortedCards={sortedCards} players={players} onEditCard={handleEditCard} />
          )
        ) : (
          <ClassicView order={order} groups={groups} players={players} onEditCard={handleEditCard} />
        )}

        <SoldCardsSection
          soldOrder={soldOrder}
          soldGroups={soldGroups}
          players={players}
          totalProfit={totalProfit}
          showSold={showSold}
          onToggleShowSold={() => setShowSold(!showSold)}
          onEditCard={handleEditCard}
        />
      </main>

      <CardModal
        modalOpen={modalOpen}
        editingIndex={editingIndex}
        cards={cards}
        players={players}
        playerNames={playerNames}
        proModalEdit={proModalEdit}
        setProModalEdit={setProModalEdit}
        onClose={handleCloseModal}
        formFullName={formFullName} setFormFullName={setFormFullName}
        formTeam={formTeam} setFormTeam={setFormTeam}
        formYear={formYear} setFormYear={setFormYear}
        formProduct={formProduct} setFormProduct={setFormProduct}
        formPSA={formPSA} setFormPSA={setFormPSA}
        formValue={formValue} setFormValue={setFormValue}
        formPct={formPct} setFormPct={setFormPct}
        formPctDir={formPctDir} setFormPctDir={setFormPctDir}
        formRange={formRange} setFormRange={setFormRange}
        formCert={formCert} setFormCert={setFormCert}
        formPurchase={formPurchase} setFormPurchase={setFormPurchase}
        submitting={submitting}
        handleFullNameInput={handleFullNameInput}
        handleSubmit={handleSubmit}
        sellMode={sellMode} setSellMode={setSellMode}
        formSalePrice={formSalePrice} setFormSalePrice={setFormSalePrice}
        unsellCode={unsellCode} setUnsellCode={setUnsellCode}
        handleSellCard={handleSellCard}
        handleUnsellCard={handleUnsellCard}
        psaData={psaVerify.psaData}
        psaLoading={psaVerify.psaLoading}
        scanning={scanner.scanning}
        scanError={scanner.scanError}
        scanConfidence={scanner.scanConfidence}
        scanFrontPreview={scanner.scanFrontPreview}
        scanBackPreview={scanner.scanBackPreview}
        handleScanFile={scanner.handleScanFile}
        handleScanSubmit={scanner.handleScanSubmit}
        scanFrontFile={scanner.scanFrontFile}
        scanBackFile={scanner.scanBackFile}
        ebayComps={ebayComps.ebayComps}
        ebayCompsLoading={ebayComps.ebayCompsLoading}
        ebayCompsError={ebayComps.ebayCompsError}
        ebayCompsAvg={ebayComps.ebayCompsAvg}
        ebayCompsLow={ebayComps.ebayCompsLow}
        ebayCompsHigh={ebayComps.ebayCompsHigh}
        ebayCompsTotal={ebayComps.ebayCompsTotal}
        ebayCompsOpen={ebayComps.ebayCompsOpen}
        setEbayCompsOpen={ebayComps.setEbayCompsOpen}
      />

      <WatchlistModal
        watchModalOpen={watchlist.watchModalOpen}
        onClose={() => watchlist.setWatchModalOpen(false)}
        watchPlayer={watchlist.watchPlayer} setWatchPlayer={watchlist.setWatchPlayer}
        watchYear={watchlist.watchYear} setWatchYear={watchlist.setWatchYear}
        watchProduct={watchlist.watchProduct} setWatchProduct={watchlist.setWatchProduct}
        watchPSA={watchlist.watchPSA} setWatchPSA={watchlist.setWatchPSA}
        watchTarget={watchlist.watchTarget} setWatchTarget={watchlist.setWatchTarget}
        watchNotes={watchlist.watchNotes} setWatchNotes={watchlist.setWatchNotes}
        handleAddWatchlist={watchlist.handleAddWatchlist}
      />

      {proView && proTab === "watchlist" && (
        <WatchlistSection
          watchlist={watchlist.watchlist}
          onRemove={watchlist.handleRemoveWatchlist}
          onOpenAddModal={() => watchlist.setWatchModalOpen(true)}
        />
      )}

      {proView && (
        <ProBottomNav
          proTab={proTab}
          onSetTab={setProTab}
          onScanClick={() => { setProTab("portfolio"); resetForm(); setModalOpen(true); }}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}
