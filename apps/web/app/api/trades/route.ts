import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const TradeSchema = z.object({
  symbol: z.string().min(1),
  exchange: z.string().default("NSE"),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  mode: z.enum(["real", "paper"]).default("paper"),
  broker_order_id: z.string().optional(),
  strategy_id: z.string().uuid().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const symbol = searchParams.get("symbol");

  let query = supabase.from("trades").select("*").eq("user_id", user.id).order("executed_at", { ascending: false }).limit(100);
  if (mode) query = query.eq("mode", mode);
  if (symbol) query = query.eq("symbol", symbol);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = TradeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase.from("trades").insert({ user_id: user.id, ...parsed.data }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
