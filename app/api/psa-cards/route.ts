// ============================================================
// GET /api/psa-cards — Server-side proxy for PSA's Public API
//
// PSA credentials stay server-side only (env vars).
// The frontend calls this endpoint; it NEVER calls PSA directly.
//
// PSA API docs: https://www.psacard.com/publicapi/documentation
// Swagger:      https://api.psacard.com/publicapi/swagger/ui/index
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import type { PSACertResponse, PSAEnrichedCard } from "@/lib/types";

// --- Server-side cache ---
// Keyed by cert number. PSA grades don't change, so cache aggressively.
const certCache = new Map<string, { data: PSAEnrichedCard; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours (grades don't change)

// --- Daily quota tracking ---
let quotaUsed = 0;
let quotaResetDate = new Date().toDateString();
const DAILY_QUOTA = 100;

function checkAndIncrementQuota(): boolean {
  const today = new Date().toDateString();
  if (today !== quotaResetDate) {
    quotaUsed = 0;
    quotaResetDate = today;
  }
  if (quotaUsed >= DAILY_QUOTA) return false;
  quotaUsed++;
  return true;
}

// --- Token management ---
let cachedToken: { token: string; expiresAt: number } | null = null;

function getPSAConfig() {
  return {
    baseUrl: (process.env.PSA_API_BASE_URL || "https://api.psacard.com/publicapi").replace(/\/+$/, ""),
    username: process.env.PSA_USERNAME || "",
    password: process.env.PSA_PASSWORD || "",
    token: process.env.PSA_API_TOKEN || "", // Direct token if user has one
  };
}

async function getAuthToken(): Promise<string> {
  const config = getPSAConfig();

  // If user provided a direct token, use it
  if (config.token) return config.token;

  // If we have a cached token that hasn't expired, use it
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  // Generate token from username/password
  if (!config.username || !config.password) {
    throw new Error("PSA credentials not configured");
  }

  const res = await fetch(`${config.baseUrl}/generatetoken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=password&username=${encodeURIComponent(config.username)}&password=${encodeURIComponent(config.password)}`,
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PSA auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const token = data.access_token || data.token;
  if (!token) throw new Error("PSA auth response missing token");

  // Cache token (default 1 hour, or use expires_in if provided)
  const expiresIn = (data.expires_in || 3600) * 1000;
  cachedToken = { token, expiresAt: Date.now() + expiresIn - 60_000 }; // refresh 1 min early

  return token;
}

// --- Cert lookup ---
async function lookupCert(certNumber: string, token: string): Promise<PSAEnrichedCard | null> {
  // Check cache first
  const cached = certCache.get(certNumber);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Check quota
  if (!checkAndIncrementQuota()) {
    throw new Error(`Daily API quota reached (${DAILY_QUOTA}/day). Resets at midnight.`);
  }

  const config = getPSAConfig();
  const res = await fetch(`${config.baseUrl}/cert/GetByCertNumber/${certNumber}`, {
    method: "GET",
    headers: {
      "Authorization": `bearer ${token}`,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
  });

  // Handle rate limiting
  if (res.status === 429) {
    throw new Error("Rate limited by PSA API. Try again later.");
  }

  // Handle auth failure
  if (res.status === 401 || res.status === 403) {
    cachedToken = null; // Clear cached token so it refreshes
    throw new Error("PSA authentication failed. Check your credentials.");
  }

  if (!res.ok) {
    throw new Error(`PSA API error: ${res.status} ${res.statusText}`);
  }

  let data: { PSACert?: PSACertResponse["PSACert"]; IsValidRequest?: boolean; ServerMessage?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error("PSA returned malformed JSON");
  }

  // Handle invalid cert number
  if (data.IsValidRequest === false) {
    return null;
  }

  // Handle no data
  if (!data.PSACert || data.ServerMessage === "No data found") {
    return null;
  }

  const cert = data.PSACert;

  const enriched: PSAEnrichedCard = {
    certNumber: cert.CertNumber || certNumber,
    playerName: cert.Subject || "",
    year: cert.Year || "",
    product: [cert.Brand, cert.Variety].filter(Boolean).join(" "),
    grade: cert.CardGrade || cert.GradeDescription || "",
    cardNumber: cert.CardNumber || "",
    variety: cert.Variety || "",
    category: cert.Category || "",
    population: cert.TotalPopulation || 0,
    populationHigher: cert.PopulationHigher || 0,
    imageUrl: "",  // Will try image endpoint separately
    externalUrl: `https://www.psacard.com/cert/${certNumber}`,
    verified: true,
    lastUpdated: new Date().toISOString(),
  };

  // Try to get card image
  try {
    if (checkAndIncrementQuota()) {
      const imgRes = await fetch(`${config.baseUrl}/cert/GetImagesByCertNumber/${certNumber}`, {
        headers: {
          "Authorization": `bearer ${token}`,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(5_000),
      });
      if (imgRes.ok) {
        const imgData = await imgRes.json();
        // PSA image response format may vary — handle flexibly
        if (Array.isArray(imgData) && imgData.length > 0) {
          enriched.imageUrl = imgData[0].ImageURL || imgData[0].imageUrl || imgData[0].url || "";
        } else if (imgData.ImageURL || imgData.imageUrl) {
          enriched.imageUrl = imgData.ImageURL || imgData.imageUrl;
        }
      }
    }
  } catch {
    // Image lookup is optional — don't fail the whole request
  }

  // Cache the result
  certCache.set(certNumber, { data: enriched, timestamp: Date.now() });

  return enriched;
}

// ============================================================
// GET handler
// Accepts: ?certs=12345,67890 (comma-separated cert numbers)
// ============================================================
export async function GET(request: NextRequest) {
  const config = getPSAConfig();

  // 1. Check if PSA is configured
  if (!config.token && (!config.username || !config.password)) {
    return NextResponse.json(
      {
        error: "PSA API not configured",
        message: "Set PSA_API_TOKEN (or PSA_USERNAME + PSA_PASSWORD) in your .env.local file.",
        configured: false,
        cards: [],
      },
      { status: 503 }
    );
  }

  // 2. Parse cert numbers from query
  const certsParam = request.nextUrl.searchParams.get("certs") || "";
  const certNumbers = certsParam
    .split(",")
    .map(c => c.trim())
    .filter(c => c.length > 0 && /^\d+$/.test(c));

  if (certNumbers.length === 0) {
    return NextResponse.json({
      cards: [],
      source: "psa",
      lastUpdated: new Date().toISOString(),
      cached: false,
      configured: true,
      quotaRemaining: DAILY_QUOTA - quotaUsed,
      message: "No cert numbers provided. Pass ?certs=12345,67890",
    });
  }

  // 3. Cap batch size to protect quota
  const MAX_BATCH = 20;
  const batch = certNumbers.slice(0, MAX_BATCH);

  try {
    // 4. Get auth token
    const token = await getAuthToken();

    // 5. Look up each cert (sequentially to respect rate limits)
    const results: PSAEnrichedCard[] = [];
    const errors: string[] = [];

    for (const cert of batch) {
      try {
        const result = await lookupCert(cert, token);
        if (result) {
          results.push(result);
        } else {
          errors.push(`Cert #${cert}: not found`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.includes("quota")) {
          errors.push(msg);
          break; // Stop processing if quota exhausted
        }
        errors.push(`Cert #${cert}: ${msg}`);
      }
    }

    return NextResponse.json({
      cards: results,
      source: "psa",
      lastUpdated: new Date().toISOString(),
      cached: false,
      configured: true,
      quotaRemaining: DAILY_QUOTA - quotaUsed,
      ...(errors.length > 0 ? { warnings: errors } : {}),
      ...(certNumbers.length > MAX_BATCH
        ? { truncated: true, message: `Only first ${MAX_BATCH} certs processed to preserve quota` }
        : {}),
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const isAuth = message.includes("auth") || message.includes("credential");

    return NextResponse.json(
      {
        error: isAuth
          ? "PSA authentication failed. Check your credentials in .env.local."
          : `PSA API error: ${message}`,
        cards: [],
        configured: true,
        quotaRemaining: DAILY_QUOTA - quotaUsed,
      },
      { status: isAuth ? 401 : 502 }
    );
  }
}
