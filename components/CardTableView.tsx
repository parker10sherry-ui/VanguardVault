"use client";

import type { PlayerInfo } from "@/lib/types";
import type { CardWithIndex } from "@/lib/cardTypes";
import { parsePct } from "@/lib/helpers";

type Props = {
  sortedCards: CardWithIndex[];
  players: Record<string, PlayerInfo>;
  onEditCard: (index: number) => void;
};

export default function CardTableView({ sortedCards, players, onEditCard }: Props) {
  return (
    <div className="pro-table-wrap">
      <table className="card-table pro-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Year</th>
            <th>Product</th>
            <th>PSA</th>
            <th>Value</th>
            <th>%</th>
            <th>Range</th>
          </tr>
        </thead>
        <tbody>
          {sortedCards.map((ci, i) => {
            const c = ci.card;
            const info = players[c.player];
            const pct = parsePct(c.pct || "");
            return (
              <tr key={`pro-${ci.originalIndex}-${i}`} className="card-row-clickable" onClick={() => onEditCard(ci.originalIndex)}>
                <td className="pro-player-cell">
                  <span className="pro-player-name">{info?.full || c.player}</span>
                </td>
                <td className="year">{c.year}</td>
                <td className="product">{c.product || "\u2014"}</td>
                <td className={`psa psa-${c.psa}`}>{c.psa === 0 ? "Raw" : c.psa}</td>
                <td className="value">${c.value}</td>
                <td className={`pct ${pct.dir === "up" ? "pct-up" : pct.dir === "down" ? "pct-down" : ""}`}>
                  {pct.display}
                </td>
                <td className="range">{c.range ? `$${c.range}` : "\u2014"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
