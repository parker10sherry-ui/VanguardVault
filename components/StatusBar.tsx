"use client";

import type { DataStatus } from "@/lib/types";

type StatusBarProps = {
  status: DataStatus;
  activeProvider: string;
  onProviderChange: (key: string) => void;
  onRefresh: () => void;
  onExportCSV: () => void;
};

export default function StatusBar({
  status, activeProvider, onProviderChange, onRefresh, onExportCSV,
}: StatusBarProps) {
  return (
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
          onChange={(e) => onProviderChange(e.target.value)}
        >
          <option value="supabase">Cloud</option>
          <option value="local">Local</option>
          <option value="mock">Mock (Sim)</option>
          <option value="psa">PSA Verified</option>
        </select>
        <button className="csv-export-btn" onClick={onExportCSV} title="Export CSV">CSV</button>
        <button
          className={`refresh-btn ${status.loading ? "spinning" : ""}`}
          onClick={onRefresh}
          title="Refresh data"
        >
          &#8635; Refresh
        </button>
      </div>
    </div>
  );
}
