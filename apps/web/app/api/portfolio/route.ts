import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mode = request.nextUrl.searchParams.get("mode"); // "paper" | "real" | null (all)

  let query = supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", user.id)
    .order("symbol");

  if (mode === "paper" || mode === "real") {
    query = query.eq("mode", mode);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
