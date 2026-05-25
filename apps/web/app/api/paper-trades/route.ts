/**
 * POST /api/paper-trades
 * ----------------------
 * Places a paper trade in Supabase.
 * body: { symbol, type: "BUY"|"SELL", quantity, price, exchange }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  symbol:   z.string().min(1).toUpperCase(),
  type:     z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive(),
  price:    z.number().positive(),
  exchange: z.string().default("NSE"),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { symbol, type, quantity, price, exchange } = parsed.data;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Insert the trade record
    const { error: tradeErr } = await supabase.from("trades").insert({
      user_id:  user.id,
      symbol,
      type,
      quantity,
      price,
      mode:     "paper",
    });
    if (tradeErr) throw tradeErr;

    // 2. Upsert portfolio position (avg price calculation)
    const { data: existing } = await supabase
      .from("portfolios")
      .select("quantity, avg_price")
      .eq("user_id", user.id)
      .eq("symbol", symbol)
      .eq("mode", "paper")
      .maybeSingle();

    if (type === "BUY") {
      if (existing) {
        const newQty  = existing.quantity + quantity;
        const newAvg  = (existing.avg_price * existing.quantity + price * quantity) / newQty;
        await supabase.from("portfolios")
          .update({ quantity: newQty, avg_price: +newAvg.toFixed(2), updated_at: new Date().toISOString() })
          .eq("user_id", user.id).eq("symbol", symbol).eq("mode", "paper");
      } else {
        await supabase.from("portfolios").insert({
          user_id: user.id, symbol, quantity, avg_price: price, mode: "paper",
        });
      }
    } else {
      // SELL — reduce or remove position
      if (existing) {
        const newQty = existing.quantity - quantity;
        if (newQty <= 0) {
          await supabase.from("portfolios")
            .delete()
            .eq("user_id", user.id).eq("symbol", symbol).eq("mode", "paper");
        } else {
          await supabase.from("portfolios")
            .update({ quantity: newQty, updated_at: new Date().toISOString() })
            .eq("user_id", user.id).eq("symbol", symbol).eq("mode", "paper");
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[paper-trades] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
