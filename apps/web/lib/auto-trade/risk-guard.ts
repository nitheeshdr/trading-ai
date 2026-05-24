import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/redis/client";
import type { AutoTradeStrategy } from "@/types/trade";

interface GuardResult {
  allowed: boolean;
  reason?: string;
}

export async function checkRiskGuard(userId: string, strategy: AutoTradeStrategy): Promise<GuardResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD

  // ─── 1. Daily trade count ─────────────────────────────────────────────────
  const { count: tradeCount } = await supabase
    .from("auto_trade_executions")
    .select("*", { count: "exact", head: true })
    .eq("strategy_id", strategy.id)
    .gte("entered_at", `${today}T00:00:00Z`);

  if ((tradeCount ?? 0) >= strategy.max_daily_trades) {
    return { allowed: false, reason: `Daily trade limit reached (${strategy.max_daily_trades})` };
  }

  // ─── 2. Daily loss check ──────────────────────────────────────────────────
  const { data: todayExecs } = await supabase
    .from("auto_trade_executions")
    .select("profit_loss")
    .eq("user_id", userId)
    .eq("status", "CLOSED")
    .gte("exited_at", `${today}T00:00:00Z`);

  const dailyPL = todayExecs?.reduce((sum, e) => sum + (e.profit_loss ?? 0), 0) ?? 0;

  // Get portfolio value for % calculation (cached in Redis)
  const portfolioValueRaw = await redis.get(`portfolio:value:${userId}`);
  const portfolioValue = portfolioValueRaw ? parseFloat(portfolioValueRaw) : 100_000; // default 1L

  const dailyLossPct = Math.abs(Math.min(dailyPL, 0)) / portfolioValue * 100;

  if (dailyLossPct >= strategy.max_daily_loss_pct) {
    // Auto-disable ALL strategies for this user
    await supabase
      .from("auto_trade_strategies")
      .update({ enabled: false })
      .eq("user_id", userId);

    return { allowed: false, reason: `Daily loss limit ${strategy.max_daily_loss_pct}% breached — all strategies disabled` };
  }

  return { allowed: true };
}
