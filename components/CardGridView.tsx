"use client";

import type { PlayerInfo } from "@/lib/types";
import type { CardWithIndex } from "@/lib/cardTypes";
import { parsePct, getPlayerImage } from "@/lib/helpers";

type Props = {
  sortedCards: CardWithIndex[];
  players: Record<string, PlayerInfo>;
  onEditCard: (index: number) => void;
};

export default function CardGridView({ sortedCards, players, onEditCard }: Props) {
  return (
    <div className="pro-grid">
      {sortedCards.map((ci) => {
        const c = ci.card;
        const info = players[c.player];
        const pct = parsePct(c.pct || "");
        const imgSrc = c.frontImageUrl || c._psaImageUrl || null;
        const playerImg = getPlayerImage(players, c.player);
        return (
          <div key={ci.originalIndex} className="pro-grid-card" onClick={() => onEditCard(ci.originalIndex)}>
            <div className="grid-card-image">
              {imgSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgSrc} alt={c.product} />
              ) : (
                <div className="grid-card-placeholder">
                  <span className={`grid-psa-badge psa-${c.psa}`}>{c.psa === 0 ? "RAW" : `PSA ${c.psa}`}</span>
                </div>
              )}
            </div>
            <div className="grid-card-body">
              <span className="grid-card-player">{info?.full || c.player}</span>
              <span className="grid-card-product">{c.year} {c.product}</span>
              <div className="grid-card-footer">
                <span className="grid-card-value">${c.value}</span>
                {pct.dir && (
                  <span className={`grid-card-pct ${pct.dir === "up" ? "pct-up" : "pct-down"}`}>
                    {pct.display}
                  </span>
                )}
                <span className={`grid-psa-badge psa-${c.psa}`}>{c.psa === 0 ? "Raw" : c.psa}</span>
              </div>
              {playerImg && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={playerImg} alt={info?.full || c.player} className="grid-player-headshot" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
