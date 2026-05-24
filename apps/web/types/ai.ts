export type SignalDirection = "BUY" | "SELL" | "HOLD";
export type ModelType = "xgboost" | "lightgbm" | "lstm" | "transformer" | "cnn" | "finbert";
export type Timeframe = "1m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

export interface AISignal {
  symbol: string;
  signal: SignalDirection;
  confidence: number;       // 0–1
  model: ModelType;
  timeframe: Timeframe;
  reason?: string;
  timestamp: number;
}

export interface AILogEntry {
  id: string;
  symbol: string;
  model_type: ModelType;
  signal: SignalDirection;
  confidence: number;
  timeframe?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SentimentResult {
  symbol: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  sources?: string[];
  timestamp: number;
}

export interface CandlestickPattern {
  name: string;
  signal: SignalDirection;
  confidence: number;
  description?: string;
}

export interface PortfolioScore {
  score: number;           // 0–100
  risk_level: "low" | "medium" | "high";
  recommendations: string[];
}
