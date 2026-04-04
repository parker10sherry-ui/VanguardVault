"use client";

import type { PsaLookupResult } from "@/lib/cardTypes";

type PsaLookupPanelProps = {
  psaLookupCert: string;
  setPsaLookupCert: (v: string) => void;
  psaLookupResult: PsaLookupResult | null;
  psaLookupLoading: boolean;
  psaLookupError: string | null;
  handlePsaLookup: () => void;
};

export default function PsaLookupPanel({
  psaLookupCert, setPsaLookupCert, psaLookupResult,
  psaLookupLoading, psaLookupError, handlePsaLookup,
}: PsaLookupPanelProps) {
  return (
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
  );
}
