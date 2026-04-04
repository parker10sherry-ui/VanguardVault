"use client";

import type { PlayerInfo } from "@/lib/types";

type DashboardStats = {
  totalValue: number;
  totalCards: number;
  realizedProfit: number;
  soldCount: number;
  gradeBreakdown: Record<number, number>;
};

type PortfolioBreakdown = {
  byPlayer: { name: string; value: number; costBasis: number }[];
  totalCostBasis: number;
  totalValue: number;
  unrealizedPL: number;
};

type TopMovers = {
  gainers: { card: { player: string; year: number; product: string; value: number }; originalIndex: number; pctNum: number }[];
  losers: { card: { player: string; year: number; product: string; value: number }; originalIndex: number; pctNum: number }[];
};

type Props = {
  dashboardStats: DashboardStats;
  portfolioBreakdown: PortfolioBreakdown;
  topMovers: TopMovers;
  players: Record<string, PlayerInfo>;
  onEditCard: (index: number) => void;
  onFilterClick: (key: string) => void;
  onExportCSV: () => void;
};

export default function ProDashboard({
  dashboardStats, portfolioBreakdown, topMovers, players,
  onEditCard, onFilterClick, onExportCSV,
}: Props) {
  return (
    <>
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

      {(topMovers.gainers.length > 0 || topMovers.losers.length > 0) && (
        <div className="pro-movers">
          {topMovers.gainers.length > 0 && (
            <div className="movers-col movers-up">
              <h3 className="movers-title">Top Gainers</h3>
              {topMovers.gainers.map((ci) => {
                const info = players[ci.card.player];
                return (
                  <div key={ci.originalIndex} className="mover-card" onClick={() => onEditCard(ci.originalIndex)}>
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
                  <div key={ci.originalIndex} className="mover-card" onClick={() => onEditCard(ci.originalIndex)}>
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

      {portfolioBreakdown.byPlayer.length > 0 && (
        <div className="pro-chart-section">
          <div className="pro-chart-header">
            <h3 className="pro-chart-title">Portfolio Breakdown</h3>
            <button className="csv-export-btn" onClick={onExportCSV}>Export CSV</button>
          </div>
          <div className="pro-chart-bars">
            {portfolioBreakdown.byPlayer.slice(0, 8).map((p) => {
              const pct = portfolioBreakdown.totalValue > 0 ? (p.value / portfolioBreakdown.totalValue) * 100 : 0;
              const playerKey = Object.entries(players).find(([, info]) => info.full === p.name)?.[0] || "";
              return (
                <div key={p.name} className="chart-bar-row chart-bar-clickable" onClick={() => { if (playerKey) onFilterClick(playerKey); }}>
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
  );
}
