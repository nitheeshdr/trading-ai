import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getKiteClient } from "@/lib/kite/client";
import { redis } from "@/lib/redis/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestToken = searchParams.get("request_token");
  if (!requestToken) {
    return NextResponse.redirect(new URL("/portfolio?error=missing_token", request.url));
  }

  try {
    const kite = getKiteClient();
    const session = await kite.generateSession(requestToken, process.env.KITE_API_SECRET!);
    const accessToken = session.access_token;

    // Cache token in Redis (expires 1 day — Kite sessions last until market close)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await redis.set(`kite:token:${user.id}`, accessToken, "EX", 86400);
      await supabase.from("users").update({ broker_connected: true, broker_name: "kite" }).eq("id", user.id);
    }

    return NextResponse.redirect(new URL("/portfolio?broker=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/portfolio?error=kite_session_failed", request.url));
  }
}
