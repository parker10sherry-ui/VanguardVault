// ============================================================
// GET /api/alt-cards — Server-side proxy for Alt's API
//
// This route keeps Alt credentials secure (server-side only).
// The frontend calls this endpoint; it NEVER calls Alt directly.
//
// PLACEHOLDER SECTIONS are clearly marked with "PLACEHOLDER:".
// Fill them in once you have real Alt API details.
// ============================================================

import { NextResponse } from "next/server";
import type { NormalizedCard } from "@/lib/types";

// --- Server-side cache ---
let cachedResponse: { data: unknown; timestamp: number } | null = null;

function getCacheTTL(): number {
  const env = process.env.ALT_CACHE_TTL_SECONDS;
  return (env ? parseInt(env, 10) : 60) * 1000;
}

// --- Alt config from env vars (NEVER exposed to browser) ---
function getAltConfig() {
  return {
    baseUrl: process.env.ALT_API_BASE_URL || "",
    apiKey: process.env.ALT_API_KEY || "",
    apiToken: process.env.ALT_API_TOKEN || "",
  };
}

// -------------------------------------------------------
// PLACEHOLDER: Sample Alt API response shape
// Replace this with Alt's actual response structure
// once you have their API documentation.
// -------------------------------------------------------
interface AltApiRawCard {
  id?: string;
  player_name?: string;
  team?: string;
  year?: number;
  card_name?: string;
  grade?: number;
  market_value?: number;
  pct_change?: string;
  six_month_range?: string;
  image_url?: string;
  listing_url?: string;
  updated_at?: string;
}

// -------------------------------------------------------
// PLACEHOLDER: Map Alt's response → Vanguard Vault schema
//
// This is where you adapt Alt's actual JSON fields to our
// NormalizedCard format. Adjust field names to match what
// Alt's API actually returns.
// -------------------------------------------------------
function mapAltCard(raw: AltApiRawCard, index: number): NormalizedCard {
  return {
    id: raw.id || `alt-${index}`,
    playerName: raw.player_name || "Unknown Player",
    team: raw.team || "",
    year: raw.year || 2025,
    product: raw.card_name || "",
    grade: raw.grade || 0,
    value: raw.market_value || 0,
    percentChange: raw.pct_change || "",
    sixMonthRange: raw.six_month_range || "",
    imageUrl: raw.image_url || "",
    externalUrl: raw.listing_url || "",
    lastUpdated: raw.updated_at || new Date().toISOString(),
  };
}

// -------------------------------------------------------
// PLACEHOLDER: Sample mapping object
// Shows exactly what fields we expect from Alt and how
// they map. Useful as documentation until real API is wired.
// -------------------------------------------------------
const ALT_FIELD_MAPPING = {
  "Alt field → Our field": {
    "id":              "id",
    "player_name":     "playerName",
    "team":            "team",
    "year":            "year",
    "card_name":       "product",
    "grade":           "grade (PSA number)",
    "market_value":    "value (in dollars)",
    "pct_change":      "percentChange (e.g. '15% U')",
    "six_month_range": "sixMonthRange (e.g. '45-108')",
    "image_url":       "imageUrl",
    "listing_url":     "externalUrl",
    "updated_at":      "lastUpdated (ISO 8601)",
  },
  "notes": "Adjust field names in mapAltCard() to match Alt's actual response.",
};

// ============================================================
// GET handler
// ============================================================
export async function GET() {
  const config = getAltConfig();

  // 1. Check if Alt is configured
  if (!config.baseUrl || !config.apiKey) {
    return NextResponse.json(
      {
        error: "Alt API not configured",
        message: "Set ALT_API_BASE_URL and ALT_API_KEY in your .env.local file.",
        configured: false,
        cards: [],
        fieldMapping: ALT_FIELD_MAPPING,
      },
      { status: 503 }
    );
  }

  // 2. Return cached response if fresh
  const ttl = getCacheTTL();
  if (cachedResponse && Date.now() - cachedResponse.timestamp < ttl) {
    return NextResponse.json({
      ...(cachedResponse.data as object),
      cached: true,
    });
  }

  // 3. Call Alt's API
  try {
    // -------------------------------------------------------
    // PLACEHOLDER: Alt API request
    // Replace the URL and headers with Alt's real endpoint.
    // -------------------------------------------------------
    const response = await fetch(`${config.baseUrl}/portfolio/cards`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(config.apiToken ? { "X-API-Token": config.apiToken } : {}),
        // PLACEHOLDER: Add any other required headers
      },
      // Abort after 10 seconds
      signal: AbortSignal.timeout(10_000),
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After") || "60";
      return NextResponse.json(
        {
          error: "Rate limited by Alt API. Try again later.",
          retryAfter: parseInt(retryAfter, 10),
          cards: [],
        },
        { status: 429 }
      );
    }

    // Handle other HTTP errors
    if (!response.ok) {
      throw new Error(`Alt API returned ${response.status}: ${response.statusText}`);
    }

    // Parse response
    let altData: unknown;
    try {
      altData = await response.json();
    } catch {
      throw new Error("Alt API returned malformed JSON");
    }

    // Validate response shape
    // -------------------------------------------------------
    // PLACEHOLDER: Adjust this validation to match Alt's
    // actual response structure. It might be:
    //   { cards: [...] }
    //   { data: { cards: [...] } }
    //   [...] (top-level array)
    // -------------------------------------------------------
    let rawCards: AltApiRawCard[] = [];

    if (Array.isArray(altData)) {
      rawCards = altData;
    } else if (altData && typeof altData === "object" && "cards" in altData) {
      rawCards = (altData as { cards: AltApiRawCard[] }).cards;
    } else if (altData && typeof altData === "object" && "data" in altData) {
      const inner = (altData as { data: unknown }).data;
      if (Array.isArray(inner)) {
        rawCards = inner;
      } else if (inner && typeof inner === "object" && "cards" in inner) {
        rawCards = (inner as { cards: AltApiRawCard[] }).cards;
      }
    }

    // Handle empty data
    if (rawCards.length === 0) {
      return NextResponse.json({
        cards: [],
        source: "alt",
        lastUpdated: new Date().toISOString(),
        cached: false,
        message: "Alt API returned no cards",
      });
    }

    // Map to normalized format
    const cards: NormalizedCard[] = rawCards.map((raw, i) => mapAltCard(raw, i));

    const result = {
      cards,
      source: "alt",
      lastUpdated: new Date().toISOString(),
      cached: false,
    };

    // Update cache
    cachedResponse = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = message.includes("timeout") || message.includes("abort");
    const isNetwork =
      error instanceof Error &&
      error.cause &&
      typeof error.cause === "object" &&
      "code" in error.cause &&
      ((error.cause as { code: string }).code === "ECONNREFUSED" ||
       (error.cause as { code: string }).code === "ENOTFOUND");

    return NextResponse.json(
      {
        error: isTimeout
          ? "Alt API request timed out"
          : isNetwork
            ? "Cannot reach Alt API server"
            : `Alt API error: ${message}`,
        cards: [],
      },
      { status: 502 }
    );
  }
}
