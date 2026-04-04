"use client";

import type { PlayerInfo } from "@/lib/types";
import type { CardWithIndex } from "@/lib/cardTypes";
import { parsePct, getPlayerImage } from "@/lib/helpers";

type Props = {
  order: string[];
  groups: Record<string, CardWithIndex[]>;
  players: Record<string, PlayerInfo>;
  onEditCard: (index: number) => void;
};

export default function ClassicView({ order, groups, players, onEditCard }: Props) {
  if (order.length === 0) {
    return <div className="no-results">No cards found.</div>;
  }

  return (
    <>
      {order.map((playerKey) => {
        const playerCards = groups[playerKey];
        const info = players[playerKey] || { full: playerKey, team: "" };
        const imgUrl = getPlayerImage(players, playerKey);
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          info.full
        )}&background=1e293b&color=d4a843&size=120&bold=true&font-size=0.4`;
        const totalValue = playerCards.reduce(
          (sum, ci) => sum + (ci.card.value || 0),
          0
        );

        return (
          <section key={playerKey} className="player-section" data-player={playerKey}>
            <div className="player-header">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="player-photo"
                src={imgUrl || fallbackUrl}
                alt={info.full}
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = fallbackUrl;
                }}
              />
              <div className="player-info">
                <h2>{info.full}</h2>
                <span className="team">{info.team}</span>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Portfolio Value
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--accent-gold)" }}>
                  ${totalValue.toLocaleString()}
                </div>
              </div>
            </div>

            <table className="card-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Product</th>
                  <th>PSA</th>
                  <th>Alt Value</th>
                  <th>Alt %</th>
                  <th>6-Mo Range</th>
                </tr>
              </thead>
              <tbody>
                {playerCards.map((ci, i) => {
                  const c = ci.card;
                  const pct = parsePct(c.pct || "");
                  return (
                    <tr
                      key={`${c.player}-${c.product}-${c.psa}-${i}`}
                      className="card-row-clickable"
                      onClick={() => onEditCard(ci.originalIndex)}
                    >
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
          </section>
        );
      })}
    </>
  );
}
