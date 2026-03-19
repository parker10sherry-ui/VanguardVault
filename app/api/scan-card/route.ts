// ============================================================
// /api/scan-card — Server-side card scanning via Claude Vision
//
// Receives base64 image(s) of a trading card, sends them to
// Claude Vision API, and returns extracted card details.
// The Anthropic API key stays server-side.
// ============================================================

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured", configured: false },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { images } = body as { images: { data: string; mediaType: string }[] };

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (images.length > 4) {
      return NextResponse.json({ error: "Maximum 4 images allowed" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    // Normalize media types — the API only accepts jpeg, png, gif, webp
    const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
    function normalizeMediaType(type: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
      const lower = type.toLowerCase();
      if (ALLOWED_TYPES.has(lower)) return lower as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      // HEIC, HEIF, or anything else from phone cameras → treat as jpeg
      return "image/jpeg";
    }

    // Build the content array with images + prompt
    const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

    for (const img of images) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: normalizeMediaType(img.mediaType),
          data: img.data,
        },
      });
    }

    content.push({
      type: "text",
      text: `You are analyzing images of a graded NFL trading card (front and/or back). Extract the following details from what you can see. If the card is in a PSA slab, read the PSA label carefully.

Return ONLY a JSON object with these fields (use null for anything you can't determine):

{
  "playerName": "Full player name (e.g. Patrick Mahomes)",
  "team": "NFL team name (e.g. Kansas City Chiefs)",
  "year": 2020,
  "product": "Card product/set and variant (e.g. Prizm Silver, Mosaic Green, Select Concourse)",
  "psaGrade": 10,
  "certNumber": "PSA cert number from the label (e.g. 12345678)",
  "cardNumber": "Card number if visible (e.g. 151)",
  "confidence": "high" | "medium" | "low"
}

Important:
- For "product", include the brand AND variant/parallel if visible (e.g. "Prizm Silver" not just "Prizm")
- For "year", use the card year, not the season year
- Read the PSA label carefully for cert number and grade
- If there's no PSA slab, set psaGrade and certNumber to null
- Return ONLY the JSON, no markdown, no explanation`,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{ role: "user", content }],
    });

    // Extract the text response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response from vision model" }, { status: 500 });
    }

    // Parse the JSON from Claude's response
    let parsed;
    try {
      // Strip markdown code fences if present
      let jsonStr = textBlock.text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse vision response", raw: textBlock.text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      card: {
        playerName: parsed.playerName || null,
        team: parsed.team || null,
        year: parsed.year || null,
        product: parsed.product || null,
        psaGrade: parsed.psaGrade || null,
        certNumber: parsed.certNumber || null,
        cardNumber: parsed.cardNumber || null,
        confidence: parsed.confidence || "low",
      },
    });
  } catch (err) {
    console.error("Scan card error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
