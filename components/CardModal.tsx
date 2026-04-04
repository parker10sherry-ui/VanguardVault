"use client";

import type { Card, PlayerInfo } from "@/lib/types";
import type { PsaData, EbayComp } from "@/lib/cardTypes";
import { parsePct, getCostBasis } from "@/lib/helpers";

type CardModalProps = {
  modalOpen: boolean;
  editingIndex: number | null;
  cards: Card[];
  players: Record<string, PlayerInfo>;
  playerNames: string[];
  proModalEdit: boolean;
  setProModalEdit: (v: boolean) => void;
  onClose: () => void;

  // Form state
  formFullName: string; setFormFullName: (v: string) => void;
  formTeam: string; setFormTeam: (v: string) => void;
  formYear: string; setFormYear: (v: string) => void;
  formProduct: string; setFormProduct: (v: string) => void;
  formPSA: string; setFormPSA: (v: string) => void;
  formValue: string; setFormValue: (v: string) => void;
  formPct: string; setFormPct: (v: string) => void;
  formPctDir: string; setFormPctDir: (v: string) => void;
  formRange: string; setFormRange: (v: string) => void;
  formCert: string; setFormCert: (v: string) => void;
  formPurchase: string; setFormPurchase: (v: string) => void;
  submitting: boolean;
  handleFullNameInput: (v: string) => void;
  handleSubmit: (e: React.FormEvent) => void;

  // Sell
  sellMode: boolean; setSellMode: (v: boolean) => void;
  formSalePrice: string; setFormSalePrice: (v: string) => void;
  unsellCode: string; setUnsellCode: (v: string) => void;
  handleSellCard: () => void;
  handleUnsellCard: () => void;

  // PSA
  psaData: PsaData | null;
  psaLoading: boolean;

  // Scan
  scanning: boolean;
  scanError: string | null;
  scanConfidence: string | null;
  scanFrontPreview: string | null;
  scanBackPreview: string | null;
  handleScanFile: (file: File, side: "front" | "back") => void;
  handleScanSubmit: () => void;
  scanFrontFile: File | null;
  scanBackFile: File | null;

  // eBay comps
  ebayComps: EbayComp[];
  ebayCompsLoading: boolean;
  ebayCompsError: string | null;
  ebayCompsAvg: number | null;
  ebayCompsLow: number | null;
  ebayCompsHigh: number | null;
  ebayCompsTotal: number;
  ebayCompsOpen: boolean;
  setEbayCompsOpen: (v: boolean) => void;
};

export default function CardModal(props: CardModalProps) {
  const {
    modalOpen, editingIndex, cards, players, playerNames,
    proModalEdit, setProModalEdit, onClose,
    formFullName, setFormFullName: _sfn, formTeam, setFormTeam, formYear, setFormYear,
    formProduct, setFormProduct, formPSA, setFormPSA, formValue, setFormValue,
    formPct, setFormPct, formPctDir, setFormPctDir, formRange, setFormRange,
    formCert, setFormCert, formPurchase, setFormPurchase,
    submitting, handleFullNameInput, handleSubmit,
    sellMode, setSellMode, formSalePrice, setFormSalePrice,
    unsellCode, setUnsellCode, handleSellCard, handleUnsellCard,
    psaData, psaLoading,
    scanning, scanError, scanConfidence, scanFrontPreview, scanBackPreview,
    handleScanFile, handleScanSubmit, scanFrontFile, scanBackFile,
    ebayComps, ebayCompsLoading, ebayCompsError,
    ebayCompsAvg, ebayCompsLow, ebayCompsHigh, ebayCompsTotal,
    ebayCompsOpen, setEbayCompsOpen,
  } = props;

  // Suppress unused warning — setFormFullName is used via handleFullNameInput
  void _sfn;

  const detailCard = editingIndex !== null ? cards[editingIndex] : null;

  return (
    <div
      className={`modal-overlay ${modalOpen ? "active" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`modal ${editingIndex !== null ? "pro-modal" : ""}`}>
        <div className="modal-header">
          <h3>{editingIndex !== null ? (detailCard?.soldAt ? "Sold Card" : "Edit Card") : "Add New Card"}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        {/* PRO DETAIL VIEW */}
        {editingIndex !== null && !proModalEdit && (() => {
          if (!detailCard) return null;
          const detailInfo = players[detailCard.player] || { full: detailCard.player, team: "" };
          const detailPct = parsePct(detailCard.pct || "");
          const detailImg = psaData?.imageUrl || detailCard._psaImageUrl || detailCard.frontImageUrl || scanFrontPreview;
          return (
            <div className="pro-detail">
              {detailImg && (
                <div className="pro-detail-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detailImg} alt="Card" />
                </div>
              )}

              <div className="pro-detail-header">
                <h2 className="pro-detail-name">{detailInfo.full}</h2>
                <span className="pro-detail-team">{detailInfo.team}</span>
              </div>

              <div className="pro-detail-stats">
                <div className="pro-stat"><span className="pro-stat-label">Year</span><span className="pro-stat-value">{detailCard.year}</span></div>
                <div className="pro-stat"><span className="pro-stat-label">Product</span><span className="pro-stat-value">{detailCard.product}</span></div>
                <div className="pro-stat"><span className="pro-stat-label">Grade</span><span className={`pro-stat-value psa-${detailCard.psa}`}>{detailCard.psa === 0 ? "Raw" : `PSA ${detailCard.psa}`}</span></div>
                <div className="pro-stat"><span className="pro-stat-label">Value</span><span className="pro-stat-value pro-stat-gold">${detailCard.value}</span></div>
                {detailPct.dir && (
                  <div className="pro-stat"><span className="pro-stat-label">Change</span><span className={`pro-stat-value ${detailPct.dir === "up" ? "pct-up" : "pct-down"}`}>{detailPct.display}</span></div>
                )}
                {detailCard.range && (
                  <div className="pro-stat"><span className="pro-stat-label">6-Mo Range</span><span className="pro-stat-value">${detailCard.range}</span></div>
                )}
                {detailCard.certNumber && (
                  <div className="pro-stat"><span className="pro-stat-label">Cert #</span><span className="pro-stat-value">{detailCard.certNumber}</span></div>
                )}
              </div>

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

              {detailCard.soldAt && (
                <div className="sold-info-section">
                  <div className="sold-info-row"><span>Sale Price:</span><span className="sold-info-value">${detailCard.salePrice?.toLocaleString()}</span></div>
                  <div className="sold-info-row">
                    <span>Profit:</span>
                    <span className={((detailCard.salePrice || 0) - getCostBasis(detailCard)) >= 0 ? "profit-positive" : "profit-negative"}>
                      {((detailCard.salePrice || 0) - getCostBasis(detailCard)) >= 0 ? "+" : ""}${((detailCard.salePrice || 0) - getCostBasis(detailCard)).toLocaleString()}
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
                {ebayCompsLoading && <div className="ebay-comps-loading">Searching eBay...</div>}
                {ebayCompsError && <div className="ebay-comps-error">{ebayCompsError}</div>}
                {!ebayCompsLoading && !ebayCompsError && ebayCompsAvg !== null && (
                  <div className="ebay-comps-summary">
                    <div className="ebay-stat"><span className="ebay-stat-label">Avg</span><span className="ebay-stat-value">${ebayCompsAvg.toLocaleString()}</span></div>
                    <div className="ebay-stat"><span className="ebay-stat-label">Low</span><span className="ebay-stat-value">${ebayCompsLow?.toLocaleString()}</span></div>
                    <div className="ebay-stat"><span className="ebay-stat-label">High</span><span className="ebay-stat-value">${ebayCompsHigh?.toLocaleString()}</span></div>
                    <div className="ebay-stat"><span className="ebay-stat-label">Listings</span><span className="ebay-stat-value">{ebayCompsTotal.toLocaleString()}</span></div>
                  </div>
                )}
                {!ebayCompsLoading && !ebayCompsError && ebayComps.length === 0 && ebayCompsAvg === null && (
                  <div className="ebay-comps-empty">No eBay listings found for this card.</div>
                )}
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

              <div className="pro-detail-actions">
                <button className="pro-edit-btn" onClick={() => setProModalEdit(true)}>Edit Card</button>
                {!detailCard.soldAt && (
                  <button className="pro-sell-btn" onClick={() => { setProModalEdit(true); setSellMode(true); }}>Sell Card</button>
                )}
              </div>

              {detailCard.soldAt && (
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

        {/* FORM VIEW */}
        {(editingIndex === null || proModalEdit) && (
          <>
            {proModalEdit && editingIndex !== null && (
              <button className="pro-back-btn" onClick={() => setProModalEdit(false)}>&larr; Back to Details</button>
            )}

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

            {psaLoading && (
              <div className="psa-info-section"><span className="psa-loading">Verifying with PSA...</span></div>
            )}
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

            {/* Scan Section */}
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
              <span className="scan-hint">Take a photo of the front and back to auto-fill</span>
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
                  <input type="text" list="playerList" placeholder="e.g. Shedeur Sanders" required autoComplete="off" value={formFullName} onChange={(e) => handleFullNameInput(e.target.value)} />
                  <datalist id="playerList">
                    {playerNames.map((name) => <option key={name} value={name} />)}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Team</label>
                  <input type="text" placeholder="e.g. Cleveland Browns" value={formTeam} onChange={(e) => setFormTeam(e.target.value)} />
                </div>
                <div className="form-group year-group">
                  <label>Year</label>
                  <input type="number" required value={formYear} onChange={(e) => setFormYear(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Product</label>
                  <input type="text" placeholder="e.g. Mosaic Green" required value={formProduct} onChange={(e) => setFormProduct(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>PSA Grade</label>
                  <select required value={formPSA} onChange={(e) => setFormPSA(e.target.value)}>
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
                  <input type="number" placeholder="0" required value={formValue} onChange={(e) => setFormValue(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>% Change</label>
                  <div className="pct-input-group">
                    <input type="text" placeholder="e.g. 15%" value={formPct} onChange={(e) => setFormPct(e.target.value)} />
                    <select value={formPctDir} onChange={(e) => setFormPctDir(e.target.value)}>
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
                  <input type="text" placeholder="e.g. 45-108" value={formRange} onChange={(e) => setFormRange(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>PSA Cert #</label>
                  <input type="text" placeholder="e.g. 12345678" value={formCert} onChange={(e) => setFormCert(e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Price ($)</label>
                  <input type="number" placeholder="What you paid" value={formPurchase} onChange={(e) => setFormPurchase(e.target.value)} min="0" />
                </div>
              </div>
              <button type="submit" className="form-submit" disabled={submitting}>
                {submitting ? "Saving..." : editingIndex !== null ? "Save Changes" : "Add Card"}
              </button>
            </form>

            {/* Sell Section */}
            {editingIndex !== null && !cards[editingIndex]?.soldAt && (
              <div className="sell-section">
                <div className="sell-section-header" onClick={() => setSellMode(!sellMode)}>
                  <span>Sell This Card</span>
                  <span className="sell-toggle">{sellMode ? "\u25B2" : "\u25BC"}</span>
                </div>
                {sellMode && (
                  <div className="sell-form">
                    <div className="form-group">
                      <label>Sale Price ($)</label>
                      <input type="number" placeholder="Enter sale amount" value={formSalePrice} onChange={(e) => setFormSalePrice(e.target.value)} min="0" step="0.01" />
                    </div>
                    {formSalePrice && parseFloat(formSalePrice) > 0 && (
                      <div className="sell-profit-preview">
                        <span>Profit: </span>
                        <span className={
                          (parseFloat(formSalePrice) - getCostBasis(cards[editingIndex])) >= 0
                            ? "profit-positive" : "profit-negative"
                        }>
                          {(parseFloat(formSalePrice) - getCostBasis(cards[editingIndex])) >= 0 ? "+" : ""}
                          ${(parseFloat(formSalePrice) - getCostBasis(cards[editingIndex])).toLocaleString()}
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

            {/* Sold card info */}
            {editingIndex !== null && cards[editingIndex]?.soldAt && (
              <div className="sold-info-section">
                <div className="sold-info-row">
                  <span>Sale Price:</span>
                  <span className="sold-info-value">${cards[editingIndex]?.salePrice?.toLocaleString()}</span>
                </div>
                <div className="sold-info-row">
                  <span>Profit:</span>
                  <span className={
                    ((cards[editingIndex]?.salePrice || 0) - getCostBasis(cards[editingIndex])) >= 0
                      ? "profit-positive" : "profit-negative"
                  }>
                    {((cards[editingIndex]?.salePrice || 0) - getCostBasis(cards[editingIndex])) >= 0 ? "+" : ""}
                    ${((cards[editingIndex]?.salePrice || 0) - getCostBasis(cards[editingIndex])).toLocaleString()}
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
                    <input type="password" placeholder="Enter code to reverse" value={unsellCode} onChange={(e) => setUnsellCode(e.target.value)} className="unsell-code-input" />
                    <button type="button" className="unsell-btn" disabled={submitting || unsellCode !== "0319"} onClick={handleUnsellCard}>Reverse Sale</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
