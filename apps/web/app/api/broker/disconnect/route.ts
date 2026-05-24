import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/redis/client";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await redis.del(`kite:token:${user.id}`);
  await supabase.from("users").update({ broker_connected: false }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}
