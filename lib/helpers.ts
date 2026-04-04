import type { Card, PlayerInfo } from "@/lib/types";

export function generatePlayerKey(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
}

export function parsePct(pct: string) {
  if (!pct) return { dir: "", display: "\u2014" };
  const clean = pct.replace(/\s/g, "");
  const up = clean.includes("U");
  const down = clean.includes("D");
  const dir = up ? "up" : down ? "down" : "";
  const arrow = up ? "\u25B2" : down ? "\u25BC" : "";
  return {
    dir,
    display: `${arrow} ${clean.replace("U", "").replace("D", "").trim()}`,
  };
}

export function getCostBasis(card?: Card): number {
  return parseFloat(card?.purchase || "0") || 0;
}

export function getPlayerImage(
  players: Record<string, PlayerInfo>,
  shortName: string
): string {
  const p = players[shortName];
  if (!p) return "";
  if (p.espnId) {
    return `https://a.espncdn.com/i/headshots/nfl/players/full/${p.espnId}.png`;
  }
  return "";
}

export async function fetchEspnId(fullName: string): Promise<number | null> {
  try {
    const url = `https://site.web.api.espn.com/apis/search/v2?query=${encodeURIComponent(
      fullName
    )}&limit=1&page=1&type=player&sport=football&league=nfl`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      for (const group of data.results || []) {
        for (const item of group.contents || []) {
          if (item.uid) {
            const match = item.uid.match(/~a:(\d+)/);
            if (match) return parseInt(match[1]);
          }
          if (item.id && /^\d+$/.test(item.id)) return parseInt(item.id);
        }
      }
    }
  } catch {
    /* try fallback */
  }

  try {
    const url = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(
      fullName
    )}&limit=1&type=player&sport=football`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) return parseInt(data.items[0].id);
    }
  } catch {
    /* no photo */
  }

  return null;
}
