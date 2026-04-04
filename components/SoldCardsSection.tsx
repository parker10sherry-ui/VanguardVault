"use client";

import type { PlayerInfo } from "@/lib/types";
import type { CardWithIndex } from "@/lib/cardTypes";
import { getCostBasis } from "@/lib/helpers";

type Props = {
  soldOrder: string[];
  soldGroups: Record<string, CardWithIndex[]>;
  players: Record<string, PlayerInfo>;
  totalProfit: number;
  showSold: boolean;
  onToggleShowSold: () => void;
  onEditCard: (index: number) => void;
};

export default function SoldCardsSection({
  soldOrder, soldGroups, players, totalProfit,
  showSold, onToggleShowSold, onEditCard,
}: Props) {
  if (soldOrder.length === 0) return null;

  return (
    <>
      <div className="sold-section-header" onClick={onToggleShowSold}>
        <h2>Sold Cards ({soldOrder.reduce((sum, k) => sum + soldGroups[k].length, 0)})</h2>
        <div className="sold-profit-summary">
          <span className={`sold-total-profit ${totalProfit >= 0 ? "profit-positive" : "profit-negative"}`}>
            Total Profit: {totalProfit >= 0 ? "+" : ""}${totalProfit.toLocaleString()}
          </span>
          <span className="sold-toggle">{showSold ? "\u25B2 Hide" : "\u25BC Show"}</span>
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
                  const profit = (c.salePrice || 0) - getCostBasis(c);
                  return (
                    <tr key={`sold-${c.player}-${i}`} className="card-row-clickable" onClick={() => onEditCard(ci.originalIndex)}>
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
  );
}
