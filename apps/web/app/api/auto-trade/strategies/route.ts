import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const StrategySchema = z.object({
  name: z.string().min(1).max(80),
  symbol: z.string().min(1),
  exchange: z.string().default("NSE"),
  mode: z.enum(["real", "paper"]).default("paper"),
  entry_signal: z.enum(["AI_BUY", "PRICE_ABOVE", "PRICE_BELOW", "RSI_OVERSOLD", "RSI_OVERBOUGHT"]).default("AI_BUY"),
  entry_price_level: z.number().optional(),
  min_confidence: z.number().min(0.60).max(1.0).default(0.70),
  quantity: z.number().int().positive(),
  profit_target_pct: z.number().positive(),
  stop_loss_pct: z.number().positive(),
  trailing_stop: z.boolean().default(false),
  trailing_stop_pct: z.number().optional(),
  max_hold_minutes: z.number().int().positive().default(60),
  max_daily_trades: z.number().int().positive().default(5),
  max_daily_loss_pct: z.number().positive().default(2.0),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("auto_trade_strategies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = StrategySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("auto_trade_strategies")
    .insert({ user_id: user.id, enabled: false, ...parsed.data })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
