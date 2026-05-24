import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const strategyId = searchParams.get("strategy_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("auto_trade_executions")
    .select("*, auto_trade_strategies(name, symbol)")
    .eq("user_id", user.id)
    .order("entered_at", { ascending: false })
    .limit(200);

  if (strategyId) query = query.eq("strategy_id", strategyId);
  if (status) {
    const validStatus = status as "OPEN" | "CLOSED" | "CANCELLED";
    query = query.eq("status", validStatus);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
