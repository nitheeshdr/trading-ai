import axios from "axios";

export const aiClient = axios.create({
  baseURL: process.env.AI_API_URL ?? process.env.NEXT_PUBLIC_AI_API_URL ?? "http://localhost:8000",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Typed request helpers ───────────────────────────────────────────────────

export async function predictSignal(payload: {
  symbol: string;
  ohlcv: number[][];
  timeframe: string;
}) {
  const { data } = await aiClient.post("/signals/predict", payload);
  return data as { signal: "BUY" | "SELL" | "HOLD"; confidence: number; model: string };
}

export async function evaluateAutoSignal(payload: {
  symbol: string;
  ohlcv: number[][];
  current_price: number;
  open_position: boolean;
}) {
  const { data } = await aiClient.post("/auto-signal/evaluate", payload);
  return data as { action: "BUY" | "SELL" | "HOLD"; confidence: number; reason: string };
}

export async function analyzeSentiment(payload: { text?: string; symbol?: string }) {
  const { data } = await aiClient.post("/sentiment/analyze", payload);
  return data as { sentiment: "positive" | "negative" | "neutral"; score: number };
}

export async function detectPatterns(payload: { ohlcv: number[][] }) {
  const { data } = await aiClient.post("/patterns/detect", payload);
  return data as { patterns: { name: string; signal: string; confidence: number }[] };
}
