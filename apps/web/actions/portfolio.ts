"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderRequest } from "@/types/trade";

export async function placePaperTrade(order: OrderRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Record trade
  const { error: tradeError } = await supabase.from("trades").insert({
    user_id: user.id,
    symbol: order.symbol,
    exchange: order.exchange,
    type: order.type,
    quantity: order.quantity,
    price: order.price ?? 0,
    mode: "paper",
  });
  if (tradeError) return { error: tradeError.message };

  // Upsert portfolio position
  const { data: existing } = await supabase
    .from("portfolios")
    .select("quantity, avg_price")
    .eq("user_id", user.id)
    .eq("symbol", order.symbol)
    .eq("mode", "paper")
    .maybeSingle();

  let newQty = order.type === "BUY" ? (existing?.quantity ?? 0) + order.quantity : (existing?.quantity ?? 0) - order.quantity;
  let newAvg = existing?.avg_price ?? order.price ?? 0;
  if (order.type === "BUY" && order.price) {
    const totalCost = (existing?.quantity ?? 0) * newAvg + order.quantity * order.price;
    newAvg = newQty > 0 ? totalCost / newQty : 0;
  }

  if (newQty <= 0) {
    await supabase.from("portfolios").delete().eq("user_id", user.id).eq("symbol", order.symbol).eq("mode", "paper");
  } else {
    await supabase.from("portfolios").upsert({
      user_id: user.id,
      symbol: order.symbol,
      exchange: order.exchange,
      quantity: newQty,
      avg_price: newAvg,
      mode: "paper",
    }, { onConflict: "user_id,symbol,mode" });
  }

  revalidatePath("/paper-trading");
  revalidatePath("/portfolio");
  return { ok: true };
}
