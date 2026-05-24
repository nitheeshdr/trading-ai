// ─── Client → Server ──────────────────────────────────────────────────────────
export const SUBSCRIBE_TICKS   = "subscribe:ticks";    // payload: { symbols: string[] }
export const UNSUBSCRIBE_TICKS = "unsubscribe:ticks";  // payload: { symbols: string[] }
export const SUBSCRIBE_OPTIONS = "subscribe:options";  // payload: { symbol: string }
export const SUBSCRIBE_SIGNALS = "subscribe:signals";  // payload: { symbol: string }

// ─── Server → Client ──────────────────────────────────────────────────────────
export const TICK_UPDATE      = "tick:update";         // payload: Tick
export const OPTION_UPDATE    = "option:update";       // payload: { symbol, chain: OptionData[] }
export const SIGNAL_UPDATE    = "signal:update";       // payload: AISignal

// ─── Auto-Trade events (Server → Client) ─────────────────────────────────────
export const AUTO_TRADE_ENTRY   = "autotrade:entry";   // payload: { strategyId, symbol, price, qty }
export const AUTO_TRADE_EXIT    = "autotrade:exit";    // payload: { strategyId, pl, plPct, reason }
export const AUTO_TRADE_BLOCKED = "autotrade:blocked"; // payload: { reason: string }
