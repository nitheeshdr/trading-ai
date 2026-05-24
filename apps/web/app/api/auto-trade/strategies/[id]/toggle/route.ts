import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch current state
  const { data: strategy, error: fetchError } = await supabase
    .from("auto_trade_strategies")
    .select("enabled")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !strategy) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("auto_trade_strategies")
    .update({ enabled: !strategy.enabled })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
