"use client";

/**
 * PaperTradingClient.tsx
 * ----------------------
 * Advanced paper trading page with:
 *   • Real-time lightweight-charts chart for any symbol
 *   • AI analysis panel (RSI + MACD → BUY/SELL/HOLD signal)
 *   • Manual order form with live price auto-fill
 *   • 🤖 AI Auto-Trade mode — automatically places paper orders when
 *     signal confidence exceeds the threshold (paper mode only, safe)
 *   • Open positions P&L table
 */

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Bot, RefreshCw, AlertTriangle, Zap } from "lucide-react";
import { useMarketStore } from "@/store/useMarketStore";
import { useLiveQuotes } from "@/hooks/useLiveQuote";
import { deriveSignal } from "@/lib/indicators";
import type { AISignalResult } from "@/lib/indicators";
import { formatCurrency, formatChangePct, colorForChange } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

// ── Dynamic chart (no SSR) ────────────────────────────────────────────────────

const TradingViewChart = dynamic(
  () => import("@/components/charts/TradingViewChart").then((m) => ({ default: m.TradingViewChart })),
  { ssr: false, loading: () => <div className="w-full h-full bg-muted animate-pulse" /> }
);

// ── Top symbols for the dropdown ──────────────────────────────────────────────

const TOP_SYMBOLS = [
  "NIFTY 50", "BANKNIFTY", "RELIANCE", "TCS", "HDFCBANK",
  "INFY", "ICICIBANK", "SBIN", "BHARTIARTL", "HINDUNILVR",
  "BAJFINANCE", "LT", "AXISBANK", "KOTAKBANK", "MARUTI",
  "HCLTECH", "WIPRO", "TITAN", "ONGC", "SUNPHARMA",
];

const AUTO_CONFIDENCE_THRESHOLD = 0.65;

// ── Holding type ──────────────────────────────────────────────────────────────

interface Holding {
  id?: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  mode?: string;
  ltp?: number;
}

// ── Fetch AI signal for a symbol ──────────────────────────────────────────────

async function fetchAISignal(symbol: string): Promise<AISignalResult> {
  const to   = Math.floor(Date.now() / 1000);
  const from = to - 200 * 5 * 60;          // ~200 5-min bars
  const resp = await fetch(
    `/api/market/history?symbol=${encodeURIComponent(symbol)}&resolution=5&from=${from}&to=${to}`
  );
  const data: { bars: { c: number }[] } = await resp.json();
  if (!data.bars?.length) return { signal: "HOLD", confidence: 0.5, rsi: null, macd: null, macdSignal: null, reason: "No data" };
  return deriveSignal(data.bars.map(b => b.c));
}

// ── Place paper trade ─────────────────────────────────────────────────────────

interface PlaceTradeInput {
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
}

async function placeTrade(input: PlaceTradeInput): Promise<void> {
  const resp = await fetch("/api/paper-trades", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, exchange: "NSE", mode: "paper" }),
  });
  if (!resp.ok) {
    const err: { error?: string } = await resp.json().catch(() => ({}));
    throw new Error(err.error ?? "Trade failed");
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function PaperTradingClient() {
  const [symbol,    setSymbol]    = useState("INFY");
  const [chartInterval, setChartInterval] = useState("5");
  const [qty,       setQty]       = useState(1);
  const [autoTrade, setAutoTrade] = useState(false);
  const autoTradeRef = useRef(false);      // stable ref for interval callbacks
  const lastAutoSig  = useRef<string>(""); // prevent duplicate auto-trades

  const qc = useQueryClient();
  const ticks  = useMarketStore(s => s.ticks);
  const ltp    = ticks[symbol]?.ltp ?? 0;
  const change = ticks[symbol]?.changePct ?? 0;

  // Keep symbol live
  useLiveQuotes([symbol]);

  // ── AI signal ─────────────────────────────────────────────────────────────
  const { data: aiSig, isFetching: sigLoading, refetch: refetchSig } = useQuery<AISignalResult>({
    queryKey: ["ai-signal", symbol],
    queryFn:  () => fetchAISignal(symbol),
    refetchInterval: 30_000,
    staleTime:       25_000,
  });

  // ── Holdings ──────────────────────────────────────────────────────────────
  const { data: holdings = [] } = useQuery<Holding[]>({
    queryKey: ["paper-holdings"],
    queryFn:  async () => {
      const r = await fetch("/api/portfolio?mode=paper");
      if (!r.ok) return [];
      return r.json();
    },
    refetchInterval: 15_000,
  });

  // ── Place trade mutation ──────────────────────────────────────────────────
  const tradeMut = useMutation({
    mutationFn: placeTrade,
    onSuccess: (_, vars) => {
      toast.success(`✅ Paper ${vars.type} — ${vars.symbol} × ${vars.quantity} @ ₹${vars.price.toFixed(2)}`);
      qc.invalidateQueries({ queryKey: ["paper-holdings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleTrade(type: "BUY" | "SELL") {
    if (!ltp) return toast.warning("Price not loaded yet");
    if (qty <= 0)  return toast.warning("Quantity must be > 0");
    tradeMut.mutate({ symbol, type, quantity: qty, price: ltp });
  }

  // ── Auto-trade loop ────────────────────────────────────────────────────────
  const runAutoTrade = useCallback(async () => {
    if (!autoTradeRef.current) return;
    const sig = await fetchAISignal(symbol).catch(() => null);
    if (!sig || sig.signal === "HOLD") return;
    if (sig.confidence < AUTO_CONFIDENCE_THRESHOLD) return;
    const key = `${symbol}-${sig.signal}-${new Date().toDateString()}`;
    if (lastAutoSig.current === key) return;   // already acted today

    const price = ticks[symbol]?.ltp ?? 0;
    if (!price) return;

    const openPos = holdings.find(h => h.symbol === symbol);
    if (sig.signal === "BUY"  && !openPos) {
      lastAutoSig.current = key;
      tradeMut.mutate({ symbol, type: "BUY",  quantity: qty, price });
      toast.info(`🤖 Auto-BUY ${symbol} — ${sig.reason}`);
    } else if (sig.signal === "SELL" && openPos) {
      lastAutoSig.current = key;
      tradeMut.mutate({ symbol, type: "SELL", quantity: openPos.quantity, price });
      toast.info(`🤖 Auto-SELL ${symbol} — ${sig.reason}`);
    }
  }, [symbol, qty, holdings, tradeMut, ticks]);

  useEffect(() => {
    autoTradeRef.current = autoTrade;
    if (!autoTrade) return;
    runAutoTrade();
    const id = setInterval(runAutoTrade, 30_000);
    return () => clearInterval(id);
  }, [autoTrade, runAutoTrade]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const sigColor = {
    BUY:  "bg-green-500/15 text-green-500 border-green-500/30",
    SELL: "bg-red-500/15 text-red-500 border-red-500/30",
    HOLD: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  };

  const totalPnl = holdings.reduce((sum, h) => {
    const cur = ticks[h.symbol]?.ltp ?? h.ltp ?? h.avg_price;
    return sum + (cur - h.avg_price) * h.quantity;
  }, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-4 -m-4 lg:-m-6 p-4 lg:p-6">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <h1 className="text-xl font-bold">📄 Paper Trading</h1>

        {/* Symbol selector */}
        <select
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TOP_SYMBOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Live price */}
        {ltp > 0 && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold">{formatCurrency(ltp)}</span>
            <span className={cn("text-sm font-medium flex items-center gap-1", change >= 0 ? "text-green-500" : "text-red-500")}>
              {change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {formatChangePct(change)}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">P&amp;L:</span>
          <span className={cn("text-sm font-mono font-bold", colorForChange(totalPnl))}>
            {formatCurrency(totalPnl)}
          </span>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">

        {/* ── Chart ── */}
        <div className="flex-1 min-h-0 rounded-lg border overflow-hidden" style={{ minHeight: 400 }}>
          <TradingViewChart symbol={symbol} interval={chartInterval} />
        </div>

        {/* ── Right panel ── */}
        <div className="lg:w-72 xl:w-80 shrink-0 flex flex-col gap-3">

          {/* AI Analysis */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Bot size={14} className="text-blue-500" /> AI Analysis
              </h3>
              <button onClick={() => refetchSig()} disabled={sigLoading} className="text-muted-foreground hover:text-foreground">
                <RefreshCw size={13} className={sigLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {aiSig ? (
              <>
                {/* Signal badge */}
                <div className={cn("flex items-center justify-between rounded-lg border px-3 py-2 mb-3", sigColor[aiSig.signal])}>
                  <span className="font-bold text-sm">{aiSig.signal}</span>
                  <span className="text-xs font-semibold">{(aiSig.confidence * 100).toFixed(0)}% confidence</span>
                </div>

                {/* Reason */}
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{aiSig.reason}</p>

                {/* Indicator pills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border px-2 py-1.5 bg-muted/30">
                    <p className="text-muted-foreground">RSI (14)</p>
                    <p className={cn("font-mono font-semibold",
                      aiSig.rsi !== null && aiSig.rsi < 30 ? "text-green-500" :
                      aiSig.rsi !== null && aiSig.rsi > 70 ? "text-red-500" : ""
                    )}>
                      {aiSig.rsi?.toFixed(1) ?? "—"}
                      {aiSig.rsi !== null && (aiSig.rsi < 30 ? " ↑ Oversold" : aiSig.rsi > 70 ? " ↓ Overbought" : "")}
                    </p>
                  </div>
                  <div className="rounded border px-2 py-1.5 bg-muted/30">
                    <p className="text-muted-foreground">MACD</p>
                    <p className={cn("font-mono font-semibold",
                      aiSig.macd !== null && aiSig.macdSignal !== null && aiSig.macd > aiSig.macdSignal ? "text-green-500" : "text-red-500"
                    )}>
                      {aiSig.macd?.toFixed(2) ?? "—"}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-20 bg-muted animate-pulse rounded" />
            )}
          </div>

          {/* Order form */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Place Order</h3>

            {/* Qty */}
            <div className="mb-3">
              <label className="block text-xs text-muted-foreground mb-1">Quantity</label>
              <input
                type="number" min={1} value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Price preview */}
            {ltp > 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                Approx value: <span className="font-mono font-semibold text-foreground">{formatCurrency(ltp * qty)}</span>
              </p>
            )}

            {/* BUY / SELL buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTrade("BUY")}
                disabled={tradeMut.isPending}
                className="rounded-md bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {tradeMut.isPending && tradeMut.variables?.type === "BUY" ? "…" : "▲ BUY"}
              </button>
              <button
                onClick={() => handleTrade("SELL")}
                disabled={tradeMut.isPending}
                className="rounded-md bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {tradeMut.isPending && tradeMut.variables?.type === "SELL" ? "…" : "▼ SELL"}
              </button>
            </div>
          </div>

          {/* AI Auto-Trade */}
          <div className={cn(
            "rounded-lg border p-4 transition-colors",
            autoTrade ? "border-blue-500/50 bg-blue-500/5" : "bg-card"
          )}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-1.5">
                <Zap size={14} className={autoTrade ? "text-blue-500" : "text-muted-foreground"} />
                AI Auto-Trade
              </h3>
              <button
                onClick={() => {
                  const next = !autoTrade;
                  setAutoTrade(next);
                  autoTradeRef.current = next;
                  toast.info(next ? "🤖 Auto-trade enabled — AI will place paper orders" : "Auto-trade disabled");
                }}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                  autoTrade ? "bg-blue-600" : "bg-muted-foreground/40"
                )}
              >
                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", autoTrade ? "translate-x-4" : "translate-x-0.5")} />
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {autoTrade
                ? `🟢 Active — checks every 30s. Buys when RSI &lt; 35 + MACD bullish (≥${(AUTO_CONFIDENCE_THRESHOLD * 100).toFixed(0)}% confidence).`
                : "When ON, the AI automatically places paper trades based on RSI + MACD signals. Paper mode only — no real money."}
            </p>
            {autoTrade && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-blue-500">
                <AlertTriangle size={11} />
                Paper trades only — never real money
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Open Positions ── */}
      <div className="shrink-0">
        <h2 className="text-sm font-semibold mb-2">Open Positions ({holdings.length})</h2>
        {holdings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No paper positions. Place a trade above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="text-left py-2 pr-4 font-medium">Symbol</th>
                  <th className="text-right py-2 pr-4 font-medium">Qty</th>
                  <th className="text-right py-2 pr-4 font-medium">Avg Price</th>
                  <th className="text-right py-2 pr-4 font-medium">LTP</th>
                  <th className="text-right py-2 pr-4 font-medium">P&amp;L</th>
                  <th className="text-right py-2 font-medium">P&amp;L %</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => {
                  const cur  = ticks[h.symbol]?.ltp ?? h.ltp ?? h.avg_price;
                  const pnl  = (cur - h.avg_price) * h.quantity;
                  const pnlPct = h.avg_price ? ((cur - h.avg_price) / h.avg_price) * 100 : 0;
                  return (
                    <tr key={h.id ?? h.symbol} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2 pr-4 font-semibold">{h.symbol}</td>
                      <td className="py-2 pr-4 text-right font-mono">{h.quantity}</td>
                      <td className="py-2 pr-4 text-right font-mono">{formatCurrency(h.avg_price)}</td>
                      <td className="py-2 pr-4 text-right font-mono">{formatCurrency(cur)}</td>
                      <td className={cn("py-2 pr-4 text-right font-mono font-semibold", colorForChange(pnl))}>
                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl)}
                      </td>
                      <td className={cn("py-2 text-right font-mono font-semibold", colorForChange(pnlPct))}>
                        {pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
