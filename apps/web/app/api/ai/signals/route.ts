/**
 * GET /api/ai/signals?symbol=INFY
 *
 * Returns AI signal logs for a symbol.
 * Proxies to FastAPI AI backend when available, falls back to Supabase ai_logs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get("symbol") ?? undefined;
  const limit  = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "10"), 50);

  // Try Supabase ai_logs table first
  try {
    const supabase = await createClient();
    let query = supabase
      .from("ai_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (symbol) {
      query = query.eq("symbol", symbol);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch {
    // If Supabase fails (e.g. table empty / not created), return empty array
    // — don't crash the dashboard
    return NextResponse.json([]);
  }
}
