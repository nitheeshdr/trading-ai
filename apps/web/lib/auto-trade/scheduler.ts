/**
 * scheduler.ts
 * ------------
 * Runs the auto-trade engine on a tick interval for all active users.
 * Start this in a separate Node.js process or via a Next.js Route Handler
 * with a keep-alive mechanism (Edge runtime not suitable — use Node runtime).
 *
 * Usage: npx tsx apps/web/lib/auto-trade/scheduler.ts
 *
 * In production: wrap in a PM2 process or Railway worker.
 */

import { redis } from "@/lib/redis/client";
import { createClient } from "@/lib/supabase/server";
import { runEngineCycle } from "./engine";

const INTERVAL_MS = 5_000;   // Run every 5 seconds

async function tick() {
  // Get all users with enabled strategies
  const supabase = await createClient();
  const { data: strategies } = await supabase
    .from("auto_trade_strategies")
    .select("user_id")
    .eq("enabled", true);

  const uniqueUsers = [...new Set(strategies?.map((s) => s.user_id) ?? [])];

  await Promise.allSettled(
    uniqueUsers.map((userId) =>
      runEngineCycle(userId).catch((e) =>
        console.error(`[scheduler] cycle failed for ${userId}:`, e)
      )
    )
  );
}

async function start() {
  console.log("[auto-trade scheduler] Starting…");
  await redis.ping();

  // Run immediately, then on interval
  await tick().catch(console.error);
  setInterval(() => tick().catch(console.error), INTERVAL_MS);
}

start();
