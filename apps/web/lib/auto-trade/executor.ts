/**
 * executor.ts
 * -----------
 * Places orders — either paper (Supabase only) or real (Kite Connect).
 * All executions are logged to auto_trade_executions.
 *
 * Safety gates (checked in order):
 *  1. TRADE_MODE env must be "real" (default: "paper")
 *  2. strategy.mode must be "real"
 *  3. KITE_API_KEY must be set
 *  4. Valid Redis-cached Kite access_token must exist for the user
 * All four must pass — any failure silently downgrades to paper logging.
 */

import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/redis/client";
import { getAuthorizedKiteClient } from "@/lib/kite/client";
import type { AutoTradeStrategy, ExitReason } from "@/types/trade";

/** True only when explicitly opted into real trading */
function isRealTradingEnabled(strategy: AutoTradeStrategy): boolean {
  if (process.env.TRADE_MODE !== "real") return false;   // env gate
  if (strategy.mode !== "real") return false;             // strategy gate
  if (!process.env.KITE_API_KEY) return false;            // key gate
  return true;
}

interface ExecuteParams {
  strategy: AutoTradeStrategy;
  side: "BUY" | "SELL";
  price: number;
  executionId?: string;      // only for exits — updates existing execution
  exitReason?: ExitReason;
  aiConfidence?: number;
  aiModel?: string;
}

export async function executeOrder({ strategy, side, price, executionId, exitReason, aiConfidence, aiModel }: ExecuteParams) {
  const supabase = await createClient();

  if (side === "BUY") {
    // Create new execution record
    const { data: exec } = await supabase
      .from("auto_trade_executions")
      .insert({
        strategy_id: strategy.id,
        user_id: strategy.user_id,
        symbol: strategy.symbol,
        exchange: strategy.exchange,
        side: "BUY",
        quantity: strategy.quantity,
        entry_price: price,
        status: "OPEN",
        mode: strategy.mode,
        ai_signal_confidence: aiConfidence,
        ai_model_type: aiModel,
      })
      .select()
      .single();

    if (isRealTradingEnabled(strategy) && exec) {
      // Place real Kite order
      const token = await redis.get(`kite:token:${strategy.user_id}`);
      if (token) {
        try {
          const kite = getAuthorizedKiteClient(token);
          const order = await kite.placeOrder("regular", {
            tradingsymbol: strategy.symbol,
            exchange: strategy.exchange,
            transaction_type: "BUY",
            quantity: strategy.quantity,
            product: "MIS",
            order_type: "MARKET",
          });
          await supabase
            .from("auto_trade_executions")
            .update({ broker_order_id: order.order_id })
            .eq("id", exec.id);
        } catch (e) {
          console.error("[auto-trade] Kite BUY failed:", e);
        }
      }
    }

    // Also record in trades table
    await supabase.from("trades").insert({
      user_id: strategy.user_id,
      symbol: strategy.symbol,
      exchange: strategy.exchange,
      type: "BUY",
      quantity: strategy.quantity,
      price,
      mode: strategy.mode,
      strategy_id: strategy.id,
    });

  } else if (side === "SELL" && executionId) {
    // Fetch entry price
    const { data: exec } = await supabase
      .from("auto_trade_executions")
      .select("entry_price, quantity")
      .eq("id", executionId)
      .single();

    const entryPrice = exec?.entry_price ?? price;
    const pl = (price - entryPrice) * strategy.quantity;
    const plPct = ((price - entryPrice) / entryPrice) * 100;

    await supabase
      .from("auto_trade_executions")
      .update({
        exit_price: price,
        profit_loss: pl,
        profit_loss_pct: plPct,
        exit_reason: exitReason,
        status: "CLOSED",
        exited_at: new Date().toISOString(),
      })
      .eq("id", executionId);

    if (isRealTradingEnabled(strategy)) {
      const token = await redis.get(`kite:token:${strategy.user_id}`);
      if (token) {
        try {
          const kite = getAuthorizedKiteClient(token);
          await kite.placeOrder("regular", {
            tradingsymbol: strategy.symbol,
            exchange: strategy.exchange,
            transaction_type: "SELL",
            quantity: strategy.quantity,
            product: "MIS",
            order_type: "MARKET",
          });
        } catch (e) {
          console.error("[auto-trade] Kite SELL failed:", e);
        }
      }
    }

    await supabase.from("trades").insert({
      user_id: strategy.user_id,
      symbol: strategy.symbol,
      exchange: strategy.exchange,
      type: "SELL",
      quantity: strategy.quantity,
      price,
      mode: strategy.mode,
      strategy_id: strategy.id,
    });
  }
}
