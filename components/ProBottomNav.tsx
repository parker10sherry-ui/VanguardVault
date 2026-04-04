"use client";

type Props = {
  proTab: string;
  onSetTab: (tab: "portfolio" | "scan" | "watchlist") => void;
  onScanClick: () => void;
};

export default function ProBottomNav({ proTab, onSetTab, onScanClick }: Props) {
  return (
    <nav className="pro-bottom-nav">
      <button className={`bottom-nav-btn ${proTab === "portfolio" ? "active" : ""}`} onClick={() => onSetTab("portfolio")}>
        <span className="bottom-nav-icon">&#9733;</span>
        <span className="bottom-nav-label">Portfolio</span>
      </button>
      <button className="bottom-nav-btn" onClick={onScanClick}>
        <span className="bottom-nav-icon bottom-nav-scan">&#9211;</span>
        <span className="bottom-nav-label">Scan</span>
      </button>
      <button className={`bottom-nav-btn ${proTab === "watchlist" ? "active" : ""}`} onClick={() => onSetTab("watchlist")}>
        <span className="bottom-nav-icon">&#9788;</span>
        <span className="bottom-nav-label">Watchlist</span>
      </button>
    </nav>
  );
}
