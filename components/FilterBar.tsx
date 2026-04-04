"use client";

import type { PlayerInfo } from "@/lib/types";

type FilterBarProps = {
  filter: string;
  onFilterChange: (f: string) => void;
  filterPlayers: string[];
  players: Record<string, PlayerInfo>;
  proView: boolean;
  sortBy: string;
  setSortBy: (v: "value" | "grade" | "pct" | "player") => void;
  sortDir: "asc" | "desc";
  setSortDir: (fn: (d: "asc" | "desc") => "asc" | "desc") => void;
  gridView: boolean;
  setGridView: (v: boolean) => void;
};

export default function FilterBar({
  filter, onFilterChange, filterPlayers, players,
  proView, sortBy, setSortBy, sortDir, setSortDir, gridView, setGridView,
}: FilterBarProps) {
  return (
    <nav className="filter-bar">
      <select
        className="filter-select"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
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

      {proView && (
        <div className="pro-controls">
          <div className="sort-controls">
            <label className="sort-label">Sort</label>
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as "value" | "grade" | "pct" | "player")}>
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
  );
}
