"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addSymbolToWatchlist(watchlistId: string, symbol: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("symbols")
    .eq("id", watchlistId)
    .eq("user_id", user.id)
    .single();

  if (!watchlist) return { error: "Watchlist not found" };

  const symbols = [...new Set([...watchlist.symbols, symbol.toUpperCase()])];
  const { error } = await supabase
    .from("watchlists")
    .update({ symbols })
    .eq("id", watchlistId);

  if (error) return { error: error.message };
  revalidatePath("/watchlist");
  return { ok: true };
}

export async function removeSymbolFromWatchlist(watchlistId: string, symbol: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("symbols")
    .eq("id", watchlistId)
    .eq("user_id", user.id)
    .single();

  if (!watchlist) return { error: "Watchlist not found" };

  const symbols = watchlist.symbols.filter((s: string) => s !== symbol.toUpperCase());
  const { error } = await supabase.from("watchlists").update({ symbols }).eq("id", watchlistId);

  if (error) return { error: error.message };
  revalidatePath("/watchlist");
  return { ok: true };
}
