export interface KiteHolding {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  day_change: number;
  day_change_percentage: number;
}

export interface KitePosition {
  tradingsymbol: string;
  exchange: string;
  product: string;
  quantity: number;
  average_price: number;
  last_price: number;
  pnl: number;
  unrealised: number;
  realised: number;
}

export interface KiteOrder {
  order_id: string;
  tradingsymbol: string;
  transaction_type: "BUY" | "SELL";
  quantity: number;
  price: number;
  status: string;
  order_timestamp: string;
}

export interface KiteTick {
  instrument_token: number;
  last_price: number;
  volume_traded: number;
  last_trade_time: Date;
  change: number;
  ohlc: { open: number; high: number; low: number; close: number };
}
