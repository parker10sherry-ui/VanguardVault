// ============================================================
// GET /api/ebay-prices — Search eBay for card pricing data
//
// Uses the eBay Browse API to find active listings for a given
// card. Returns recent listings with prices to help gauge
// current market value.
//
// Query params:
//   q       — search query (e.g. "Jalen Hurts Prizm Rookie PSA 10")
//   limit   — max results (default 10, max 50)
//
// Credentials are server-side only (never exposed to browser).
// ============================================================

import { NextRequest, NextResponse } from "next/server";

// --- OAuth token cache ---
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getEbayToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("EBAY_CLIENT_ID and EBAY_CLIENT_SECRET must be set in .env.local");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`eBay OAuth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

// --- Response types ---
interface EbayItemSummary {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  itemWebUrl?: string;
  condition?: string;
  seller?: { username: string; feedbackPercentage: string; feedbackScore: number };
  categories?: { categoryId: string; categoryName: string }[];
  buyingOptions?: string[];
  itemLocation?: { country: string; postalCode?: string };
}

interface EbaySearchResponse {
  href: string;
  total: number;
  next?: string;
  limit: number;
  offset: number;
  itemSummaries?: EbayItemSummary[];
}

export interface EbayPriceResult {
  itemId: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  itemUrl: string;
  condition: string;
  seller: string;
  sellerFeedback: string;
  buyingOption: string;
}

// ============================================================
// GET handler
// ============================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "10", 10) || 10, 1), 50);

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Missing required query parameter: q", results: [] },
      { status: 400 }
    );
  }

  // Check credentials
  if (!process.env.EBAY_CLIENT_ID || !process.env.EBAY_CLIENT_SECRET) {
    return NextResponse.json(
      {
        error: "eBay API not configured",
        message: "Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in .env.local",
        configured: false,
        results: [],
      },
      { status: 503 }
    );
  }

  try {
    const token = await getEbayToken();

    // Search eBay Browse API — category 213 = Sports Trading Cards
    const params = new URLSearchParams({
      q: query,
      category_ids: "213",
      limit: String(limit),
      sort: "price",
      filter: "deliveryCountry:US,buyingOptions:{FIXED_PRICE}",
    });

    const searchRes = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
        },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (searchRes.status === 429) {
      return NextResponse.json(
        { error: "eBay rate limit exceeded. Try again later.", results: [] },
        { status: 429 }
      );
    }

    if (!searchRes.ok) {
      const text = await searchRes.text();
      throw new Error(`eBay Browse API returned ${searchRes.status}: ${text}`);
    }

    const searchData: EbaySearchResponse = await searchRes.json();
    const items = searchData.itemSummaries || [];

    const results: EbayPriceResult[] = items.map((item) => ({
      itemId: item.itemId,
      title: item.title,
      price: parseFloat(item.price?.value || "0"),
      currency: item.price?.currency || "USD",
      imageUrl: item.image?.imageUrl || "",
      itemUrl: item.itemWebUrl || "",
      condition: item.condition || "Not Specified",
      seller: item.seller?.username || "",
      sellerFeedback: item.seller?.feedbackPercentage || "",
      buyingOption: item.buyingOptions?.[0] || "",
    }));

    return NextResponse.json({
      query,
      total: searchData.total || 0,
      results,
      source: "ebay",
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = message.includes("timeout") || message.includes("abort");

    return NextResponse.json(
      {
        error: isTimeout
          ? "eBay API request timed out"
          : `eBay API error: ${message}`,
        results: [],
      },
      { status: 502 }
    );
  }
}
