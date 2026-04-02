// ============================================================
// GET /api/ebay-prices — Search eBay for card pricing data
//
// Uses the eBay Browse API to find active listings for a given
// card. Returns recent listings with prices to help gauge
// current market value.
//
// Query params:
//   q       — search query (e.g. "Jalen Hurts Prizm Rookie")
//   grade   — PSA grade to tag matches (e.g. "10")
//   limit   — max results (default 20, max 50)
//
// Credentials are server-side only (never exposed to browser).
// ============================================================

import { NextRequest, NextResponse } from "next/server";

// --- OAuth token cache ---
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getEbayToken(): Promise<string> {
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

// --- Grade detection from listing title ---
function detectGrade(title: string): { grade: number; gradeLabel: string } | null {
  const upper = title.toUpperCase();

  // PSA grades: "PSA 10", "PSA10", "PSA GEM MT 10"
  const psaMatch = upper.match(/PSA\s*(?:GEM\s*(?:MT|MINT)\s*)?(\d{1,2}(?:\.5)?)/);
  if (psaMatch) return { grade: parseFloat(psaMatch[1]), gradeLabel: `PSA ${psaMatch[1]}` };

  // BGS/BVG grades: "BGS 9.5", "BVG 8"
  const bgsMatch = upper.match(/B[GV][GS]\s*(\d{1,2}(?:\.\d)?)/);
  if (bgsMatch) return { grade: parseFloat(bgsMatch[1]), gradeLabel: `BGS ${bgsMatch[1]}` };

  // SGC grades: "SGC 10", "SGC 98"
  const sgcMatch = upper.match(/SGC\s*(\d{1,3})/);
  if (sgcMatch) {
    const val = parseInt(sgcMatch[1]);
    // SGC uses both 10-point and 100-point scale
    const normalized = val > 10 ? Math.round(val / 10) : val;
    return { grade: normalized, gradeLabel: `SGC ${sgcMatch[1]}` };
  }

  // CGC grades
  const cgcMatch = upper.match(/CGC\s*(\d{1,2}(?:\.\d)?)/);
  if (cgcMatch) return { grade: parseFloat(cgcMatch[1]), gradeLabel: `CGC ${cgcMatch[1]}` };

  // Check for "RAW" or "UNGRADED"
  if (upper.includes("RAW") || upper.includes("UNGRADED") || upper.includes("BASE")) {
    return { grade: 0, gradeLabel: "Raw" };
  }

  return null;
}

// --- Response types ---
interface EbayItemSummary {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  itemWebUrl?: string;
  condition?: string;
  conditionId?: string;
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
  detectedGrade: number | null;
  gradeLabel: string;
  gradeMatch: "exact" | "different" | "unknown";
}

// ============================================================
// GET handler
// ============================================================
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const userGrade = searchParams.get("grade");
  const limitParam = searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 50);

  if (!query || !query.trim()) {
    return NextResponse.json(
      { error: "Missing required query parameter: q", results: [] },
      { status: 400 }
    );
  }

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

  const userGradeNum = userGrade ? parseFloat(userGrade) : null;

  try {
    const token = await getEbayToken();

    // Search eBay Browse API
    // category_ids: 213 = Sports Trading Cards (broadest, includes all sub-categories)
    // No buying option filter — include both BIN and auction
    const params = new URLSearchParams({
      q: query,
      category_ids: "213",
      limit: String(limit),
      filter: "deliveryCountry:US",
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

    const results: EbayPriceResult[] = items.map((item) => {
      const detected = detectGrade(item.title);
      let gradeMatch: "exact" | "different" | "unknown" = "unknown";

      if (userGradeNum !== null && detected) {
        gradeMatch = detected.grade === userGradeNum ? "exact" : "different";
      } else if (userGradeNum === 0 && item.condition === "Ungraded") {
        gradeMatch = "exact";
      }

      return {
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
        detectedGrade: detected?.grade ?? null,
        gradeLabel: detected?.gradeLabel || (item.condition === "Ungraded" ? "Raw" : ""),
        gradeMatch,
      };
    });

    // Sort: exact grade matches first, then different, then unknown
    const sortOrder = { exact: 0, different: 1, unknown: 2 };
    results.sort((a, b) => sortOrder[a.gradeMatch] - sortOrder[b.gradeMatch]);

    return NextResponse.json({
      query,
      total: searchData.total || 0,
      results,
      source: "ebay",
      userGrade: userGradeNum,
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
