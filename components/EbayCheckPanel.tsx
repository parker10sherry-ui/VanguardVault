"use client";

import type { EbayComp } from "@/lib/cardTypes";

type EbayCheckPanelProps = {
  ebayCheckQuery: string;
  setEbayCheckQuery: (v: string) => void;
  ebayCheckGrade: string;
  setEbayCheckGrade: (v: string) => void;
  ebayCheckResults: EbayComp[];
  ebayCheckLoading: boolean;
  ebayCheckError: string | null;
  ebayCheckAvg: number | null;
  ebayCheckLow: number | null;
  ebayCheckHigh: number | null;
  ebayCheckTotal: number;
  ebayCheckListOpen: boolean;
  isListening: boolean;
  handleEbayCheck: () => void;
  startVoiceInput: () => void;
};

export default function EbayCheckPanel(props: EbayCheckPanelProps) {
  const {
    ebayCheckQuery, setEbayCheckQuery, ebayCheckGrade, setEbayCheckGrade,
    ebayCheckResults, ebayCheckLoading, ebayCheckError,
    ebayCheckAvg, ebayCheckLow, ebayCheckHigh, ebayCheckTotal,
    ebayCheckListOpen, isListening,
    handleEbayCheck, startVoiceInput,
  } = props;

  return (
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
  );
}
