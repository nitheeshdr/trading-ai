/**
 * lib/indicators.ts
 * -----------------
 * Pure technical-indicator functions shared by the chart and AI analysis.
 * All functions accept a number[] of closing prices and return aligned arrays.
 */

// ── EMA ──────────────────────────────────────────────────────────────────────

export function calcEMA(data: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i];
  out[period - 1] = sum / period;
  for (let i = period; i < data.length; i++) {
    out[i] = data[i] * k + (out[i - 1] as number) * (1 - k);
  }
  return out;
}

// ── RSI ──────────────────────────────────────────────────────────────────────

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

// ── MACD ─────────────────────────────────────────────────────────────────────

export function calcMACD(closes: number[]) {
  const fast = calcEMA(closes, 12);
  const slow = calcEMA(closes, 26);
  const vals: number[] = [], idxs: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fast[i] !== null && slow[i] !== null) {
      vals.push((fast[i] as number) - (slow[i] as number));
      idxs.push(i);
    }
  }
  const sig = calcEMA(vals, 9);
  const macdLine:  (number | null)[] = new Array(closes.length).fill(null);
  const sigLine:   (number | null)[] = new Array(closes.length).fill(null);
  const histLine:  (number | null)[] = new Array(closes.length).fill(null);
  idxs.forEach((origIdx, arrIdx) => {
    macdLine[origIdx] = vals[arrIdx];
    if (sig[arrIdx] !== null) {
      sigLine[origIdx]  = sig[arrIdx];
      histLine[origIdx] = vals[arrIdx] - (sig[arrIdx] as number);
    }
  });
  return { macdLine, sigLine, histLine };
}

// ── AI Signal from indicators ─────────────────────────────────────────────────

export interface AISignalResult {
  signal:     "BUY" | "SELL" | "HOLD";
  confidence: number;   // 0 – 1
  rsi:        number | null;
  macd:       number | null;
  macdSignal: number | null;
  reason:     string;
}

export function deriveSignal(closes: number[]): AISignalResult {
  const rsiArr   = calcRSI(closes);
  const { macdLine, sigLine } = calcMACD(closes);

  const rsi   = rsiArr[rsiArr.length - 1] ?? null;
  const macd  = macdLine[macdLine.length - 1] ?? null;
  const msig  = sigLine[sigLine.length - 1] ?? null;

  const prevMacd  = macdLine[macdLine.length - 2] ?? null;
  const prevMsig  = sigLine[sigLine.length - 2] ?? null;

  // Bullish MACD crossover: MACD crossed above Signal in last candle
  const macdBull = prevMacd !== null && prevMsig !== null && macd !== null && msig !== null
    && prevMacd < prevMsig && macd >= msig;

  // Bearish MACD crossover
  const macdBear = prevMacd !== null && prevMsig !== null && macd !== null && msig !== null
    && prevMacd > prevMsig && macd <= msig;

  if (rsi !== null && rsi < 30 && (macdBull || (macd !== null && msig !== null && macd > msig))) {
    return { signal: "BUY", confidence: 0.82, rsi, macd, macdSignal: msig, reason: `RSI oversold (${rsi.toFixed(1)}) + MACD bullish` };
  }
  if (rsi !== null && rsi < 35 && macdBull) {
    return { signal: "BUY", confidence: 0.68, rsi, macd, macdSignal: msig, reason: `RSI low (${rsi.toFixed(1)}) + MACD crossover up` };
  }
  if (rsi !== null && rsi > 70 && (macdBear || (macd !== null && msig !== null && macd < msig))) {
    return { signal: "SELL", confidence: 0.82, rsi, macd, macdSignal: msig, reason: `RSI overbought (${rsi.toFixed(1)}) + MACD bearish` };
  }
  if (rsi !== null && rsi > 65 && macdBear) {
    return { signal: "SELL", confidence: 0.68, rsi, macd, macdSignal: msig, reason: `RSI high (${rsi.toFixed(1)}) + MACD crossover down` };
  }
  if (rsi !== null && rsi < 40 && macd !== null && msig !== null && macd > msig) {
    return { signal: "BUY", confidence: 0.55, rsi, macd, macdSignal: msig, reason: `RSI low-moderate (${rsi.toFixed(1)}) + MACD positive` };
  }
  if (rsi !== null && rsi > 60 && macd !== null && msig !== null && macd < msig) {
    return { signal: "SELL", confidence: 0.55, rsi, macd, macdSignal: msig, reason: `RSI high-moderate (${rsi.toFixed(1)}) + MACD negative` };
  }

  return { signal: "HOLD", confidence: 0.5, rsi, macd, macdSignal: msig, reason: "No clear signal" };
}
