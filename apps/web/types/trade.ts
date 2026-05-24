export type TradeType = "BUY" | "SELL";
export type TradeMode = "real" | "paper";

export interface Trade {
  id: string;
  user_id: string;
  symbol: string;
  exchange: string;
  type: TradeType;
  quantity: number;
  price: number;
  mode: TradeMode;
  broker_order_id?: string;
  strategy_id?: string;
  executed_at: string;
}

export interface Position {
  symbol: string;
  exchange: string;
  quantity: number;       // positive = long, negative = short
  avg_price: number;
  ltp: number;
  pnl: number;
  pnl_pct: number;
  mode: TradeMode;
}

export interface Holding {
  symbol: string;
  exchange: string;
  quantity: number;
  avg_price: number;
  ltp: number;
  pnl: number;
  pnl_pct: number;
}

export interface OrderRequest {
  symbol: string;
  exchange: string;
  type: TradeType;
  quantity: number;
  price?: number;         // undefined = market order
  mode: TradeMode;
}

export interface AutoTradeStrategy {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  exchange: string;
  enabled: boolean;
  mode: TradeMode;
  entry_signal: "AI_BUY" | "PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT";
  entry_price_level?: number;
  min_confidence: number;
  quantity: number;
  profit_target_pct: number;
  stop_loss_pct: number;
  trailing_stop: boolean;
  trailing_stop_pct?: number;
  max_hold_minutes: number;
  max_daily_trades: number;
  max_daily_loss_pct: number;
  created_at: string;
  updated_at: string;
}

export type ExitReason = "PROFIT_TARGET" | "STOP_LOSS" | "TRAILING_STOP" | "TIME_EXIT" | "MANUAL" | "AI_REVERSAL";

export interface AutoTradeExecution {
  id: string;
  strategy_id: string;
  user_id: string;
  symbol: string;
  exchange: string;
  side: TradeType;
  quantity: number;
  entry_price?: number;
  exit_price?: number;
  profit_loss?: number;
  profit_loss_pct?: number;
  exit_reason?: ExitReason;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  broker_order_id?: string;
  mode: TradeMode;
  ai_signal_confidence?: number;
  entered_at: string;
  exited_at?: string;
}
