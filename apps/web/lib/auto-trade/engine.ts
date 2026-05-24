/**
 * Auto-Trade Engine
 * -----------------
 * Runs one cycle for a user's enabled strategies:
 * 1. Load enabled strategies from Supabase
 * 2. For each strategy, check open positions and current tick
 * 3. Run evaluator → entry or exit decision
 * 4. Execute via executor (paper or Kite)
 * 5. Log to auto_trade_executions
 *
 * Called by:
 *  - /api/auto-trade/engine  (manual dev trigger)
 *  - scheduler.ts            (setInterval in a long-running process)
 */

import { createClient } from "@/lib/supabase/server";
import { evaluateEntry, evaluateExit } from "./evaluator";
import { executeOrder } from "./executor";
import { checkRiskGuard } from "./risk-guard";
import { evaluateAutoSignal } from "@/lib/ai/client";
import { redis } from "@/lib/redis/client";
import type { AutoTradeStrategy, AutoTradeExecution } from "@/types/trade";

export async function runEngineCycle(userId: string, specificStrategyId?: string) {
  const supabase = await createClient();
  const results: { strategyId: string; action: string; reason?: string }[] = [];

  // 1. Load enabled strategies
  let query = supabase
    .from("auto_trade_strategies")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (specificStrategyId) query = query.eq("id", specificStrategyId);

  const { data: strategies, error } = await query;
  if (error || !strategies?.length) return { results: [], error: error?.message };

  for (const strategy of strategies as AutoTradeStrategy[]) {
    // 2. Risk guard check
    const risk = await checkRiskGuard(userId, strategy);
    if (!risk.allowed) {
      results.push({ strategyId: strategy.id, action: "BLOCKED", reason: risk.reason });
      continue;
    }

    // 3. Get current tick from Redis cache
    const tickRaw = await redis.get(`tick:${strategy.symbol}`);
    const tick = tickRaw ? JSON.parse(tickRaw) : null;
    if (!tick) {
      results.push({ strategyId: strategy.id, action: "NO_TICK" });
      continue;
    }

    // 4. Check for open execution
    const { data: openExec } = await supabase
      .from("auto_trade_executions")
      .select("*")
      .eq("strategy_id", strategy.id)
      .eq("status", "OPEN")
      .maybeSingle();

    if (openExec) {
      // 5a. Evaluate exit
      const exitDecision = evaluateExit(strategy, openExec as AutoTradeExecution, tick.ltp);
      if (exitDecision.shouldExit) {
        await executeOrder({ strategy, side: "SELL", price: tick.ltp, executionId: openExec.id, exitReason: exitDecision.reason });
        results.push({ strategyId: strategy.id, action: "EXIT", reason: exitDecision.reason });
      } else {
        results.push({ strategyId: strategy.id, action: "HOLD_POSITION" });
      }
    } else {
      // 5b. Evaluate entry
      const aiSignal = await evaluateAutoSignal({
        symbol: strategy.symbol,
        ohlcv: [],  // populated by socket-server in real impl
        current_price: tick.ltp,
        open_position: false,
      }).catch(() => null);

      if (!aiSignal) {
        results.push({ strategyId: strategy.id, action: "AI_UNAVAILABLE" });
        continue;
      }

      const entryDecision = evaluateEntry(strategy, tick.ltp, aiSignal);
      if (entryDecision.shouldEnter) {
        await executeOrder({ strategy, side: "BUY", price: tick.ltp, aiConfidence: aiSignal.confidence, aiModel: "xgboost" });
        results.push({ strategyId: strategy.id, action: "ENTER" });
      } else {
        results.push({ strategyId: strategy.id, action: "NO_ENTRY", reason: entryDecision.reason });
      }
    }
  }

  return { results };
}
