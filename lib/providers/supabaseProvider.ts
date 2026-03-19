// ============================================================
// supabaseProvider.ts — Shared database provider
//
// All users see the same data. Cards and players are stored
// in Supabase (PostgreSQL). No auth — single shared portfolio.
// ============================================================

import type { Card, PlayerInfo, DataProvider } from "@/lib/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";

// Map database row to Card type
function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as number,
    year: row.year as number,
    player: row.player_key as string,
    product: row.product as string,
    psa: row.psa as number,
    value: row.value as number,
    pct: (row.pct as string) || "",
    range: (row.range as string) || "",
    purchase: (row.purchase as string) || "",
    certNumber: (row.cert_number as string) || undefined,
    _source: (row.source as string) || undefined,
    _psaVerified: (row.psa_verified as boolean) || false,
    _psaImageUrl: (row.psa_image_url as string) || undefined,
    _psaPopulation: (row.psa_population as number) || undefined,
    _psaPopHigher: (row.psa_pop_higher as number) || undefined,
  };
}

// Map Card type to database row
function cardToRow(card: Card, playerKey: string) {
  return {
    year: card.year,
    player_key: playerKey,
    product: card.product,
    psa: card.psa,
    value: card.value || 0,
    pct: card.pct || "",
    range: card.range || "",
    purchase: card.purchase || "",
    cert_number: card.certNumber || null,
    source: "user",
  };
}

export const SupabaseProvider: DataProvider = {
  name: "Supabase",
  canSave: true,

  async fetchPlayers(): Promise<Record<string, PlayerInfo>> {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    const { data, error } = await supabase
      .from("players")
      .select("*");

    if (error) throw new Error(`Failed to fetch players: ${error.message}`);

    const players: Record<string, PlayerInfo> = {};
    for (const row of data || []) {
      players[row.key] = {
        full: row.full_name,
        team: row.team,
        espnId: row.espn_id,
      };
    }
    return players;
  },

  async fetchCards(): Promise<Card[]> {
    if (!isSupabaseConfigured) throw new Error("Supabase not configured");

    const { data, error } = await supabase
      .from("cards")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw new Error(`Failed to fetch cards: ${error.message}`);

    return (data || []).map(rowToCard);
  },

  async saveCard(card: Card, playerKey: string, playerData?: PlayerInfo | null): Promise<void> {
    // Insert player if new
    if (playerData) {
      const { error: playerError } = await supabase
        .from("players")
        .upsert({
          key: playerKey,
          full_name: playerData.full,
          team: playerData.team,
          espn_id: playerData.espnId || null,
        }, { onConflict: "key" });

      if (playerError) throw new Error(`Failed to save player: ${playerError.message}`);
    }

    // Insert card
    const { error } = await supabase
      .from("cards")
      .insert(cardToRow(card, playerKey));

    if (error) throw new Error(`Failed to save card: ${error.message}`);
  },

  async updateCard(id: number, card: Card): Promise<void> {
    const { error } = await supabase
      .from("cards")
      .update({
        year: card.year,
        player_key: card.player,
        product: card.product,
        psa: card.psa,
        value: card.value || 0,
        pct: card.pct || "",
        range: card.range || "",
        cert_number: card.certNumber || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(`Failed to update card: ${error.message}`);
  },

  async deleteCard(id: number): Promise<void> {
    const { error } = await supabase
      .from("cards")
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete card: ${error.message}`);
  },
};
