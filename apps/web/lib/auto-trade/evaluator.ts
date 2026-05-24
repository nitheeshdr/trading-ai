import type { AutoTradeStrategy, AutoTradeExecution } from "@/types/trade";

interface EntryDecision {
  shouldEnter: boolean;
  reason?: string;
}

interface ExitDecision {
  shouldExit: boolean;
  reason?: "PROFIT_TARGET" | "STOP_LOSS" | "TRAILING_STOP" | "TIME_EXIT" | "AI_REVERSAL";
}

// ─── Entry Evaluation ────────────────────────────────────────────────────────

export function evaluateEntry(
  strategy: AutoTradeStrategy,
  currentPrice: number,
  aiSignal: { action: string; confidence: number }
): EntryDecision {
  // Confidence gate — hard minimum 0.60
  if (aiSignal.confidence < Math.max(strategy.min_confidence, 0.60)) {
    return { shouldEnter: false, reason: `Confidence ${(aiSignal.confidence * 100).toFixed(0)}% below threshold` };
  }

  switch (strategy.entry_signal) {
    case "AI_BUY":
      if (aiSignal.action !== "BUY") return { shouldEnter: false, reason: "AI signal not BUY" };
      break;
    case "PRICE_ABOVE":
      if (!strategy.entry_price_level || currentPrice <= strategy.entry_price_level)
        return { shouldEnter: false, reason: `Price ${currentPrice} not above ${strategy.entry_price_level}` };
      break;
    case "PRICE_BELOW":
      if (!strategy.entry_price_level || currentPrice >= strategy.entry_price_level)
        return { shouldEnter: false, reason: `Price ${currentPrice} not below ${strategy.entry_price_level}` };
      break;
    // RSI_OVERSOLD / RSI_OVERBOUGHT: RSI computed by AI backend, treated as AI signal here
    case "RSI_OVERSOLD":
      if (aiSignal.action !== "BUY") return { shouldEnter: false, reason: "Not RSI oversold signal" };
      break;
    case "RSI_OVERBOUGHT":
      if (aiSignal.action !== "SELL") return { shouldEnter: false, reason: "Not RSI overbought signal" };
      break;
  }

  return { shouldEnter: true };
}

// ─── Exit Evaluation ─────────────────────────────────────────────────────────

export function evaluateExit(
  strategy: AutoTradeStrategy,
  execution: AutoTradeExecution,
  currentPrice: number
): ExitDecision {
  const entryPrice = execution.entry_price ?? currentPrice;
  const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;

  // Profit target
  if (pnlPct >= strategy.profit_target_pct) {
    return { shouldExit: true, reason: "PROFIT_TARGET" };
  }

  // Stop loss
  if (pnlPct <= -strategy.stop_loss_pct) {
    return { shouldExit: true, reason: "STOP_LOSS" };
  }

  // Trailing stop
  if (strategy.trailing_stop && strategy.trailing_stop_pct) {
    const highWatermark = (execution.metadata as { hwm?: number } | null)?.hwm ?? entryPrice;
    const drawdownFromHWM = ((highWatermark - currentPrice) / highWatermark) * 100;
    if (drawdownFromHWM >= strategy.trailing_stop_pct) {
      return { shouldExit: true, reason: "TRAILING_STOP" };
    }
  }

  // Time exit
  const enteredAt = new Date(execution.entered_at).getTime();
  const elapsedMinutes = (Date.now() - enteredAt) / 60_000;
  if (elapsedMinutes >= strategy.max_hold_minutes) {
    return { shouldExit: true, reason: "TIME_EXIT" };
  }

  return { shouldExit: false };
}
