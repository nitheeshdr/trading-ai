"use client";

/**
 * TradingViewChart.tsx
 * --------------------
 * Multi-pane advanced trading chart built with lightweight-charts (free, open source).
 * Replaces the paid TradingView Charting Library.
 *
 * Panes:
 *   • Main   — Candlestick + Volume overlay
 *   • RSI    — 14-period RSI with 30 / 70 lines
 *   • MACD   — MACD line, Signal line, Histogram
 *
 * Data:
 *   • Historical bars  ← /api/market/history
 *   • Live ticks       ← Zustand useMarketStore → bar update
 */

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  LineStyle,
} from "lightweight-charts";
import type { Time } from "lightweight-charts";
import { useMarketStore } from "@/store/useMarketStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const INTERVALS = [
  { label: "1m",  value: "1"  },
  { label: "5m",  value: "5"  },
  { label: "15m", value: "15" },
  { label: "30m", value: "30" },
  { label: "1h",  value: "60" },
  { label: "1D",  value: "D"  },
];

const RESOLUTION_MINUTES: Record<string, number> = {
  "1": 1, "3": 3, "5": 5, "15": 15, "30": 30,
  "60": 60, "120": 120, "240": 240, "D": 1440, "W": 10080,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface OHLCVBar { t: number; o: number; h: number; l: number; c: number; v: number; }

interface LiveBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

interface Props {
  symbol: string;
  exchange?: string;
  interval?: string;
  onReady?: () => void;
}

// ── Technical indicators ──────────────────────────────────────────────────────

function calcEMA(data: number[], period: number): (number | null)[] {
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

function calcRSI(closes: number[], period = 14): (number | null)[] {
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

function calcMACD(closes: number[]) {
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
  const macdLine: (number | null)[] = new Array(closes.length).fill(null);
  const sigLine:  (number | null)[] = new Array(closes.length).fill(null);
  const histLine: (number | null)[] = new Array(closes.length).fill(null);
  idxs.forEach((origIdx, arrIdx) => {
    macdLine[origIdx] = vals[arrIdx];
    if (sig[arrIdx] !== null) {
      sigLine[origIdx]  = sig[arrIdx];
      histLine[origIdx] = vals[arrIdx] - (sig[arrIdx] as number);
    }
  });
  return { macdLine, sigLine, histLine };
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function makeTheme(isDark: boolean) {
  return {
    layout: {
      background: { type: ColorType.Solid, color: isDark ? "#0f172a" : "#ffffff" },
      textColor: isDark ? "#94a3b8" : "#475569",
    },
    grid: {
      vertLines: { color: isDark ? "#1e293b" : "#e2e8f0" },
      horzLines: { color: isDark ? "#1e293b" : "#e2e8f0" },
    },
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TradingViewChart({ symbol, exchange = "NSE", interval = "5", onReady }: Props) {
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef  = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const charts  = useRef<any>({});          // { main, rsi, macd }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const series  = useRef<any>({});          // { candle, volume, rsiLine, macdLine, sigLine, hist }
  const lastBar = useRef<LiveBar | null>(null);

  const [activeInterval, setActiveInterval] = useState(interval);
  const [isLoading, setIsLoading]           = useState(true);

  const { resolvedTheme } = useTheme();
  const ticks = useMarketStore((s) => s.ticks);
  const isDark = resolvedTheme === "dark";

  // ── Init (mount only) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mainRef.current || !rsiRef.current || !macdRef.current) return;

    const theme = makeTheme(isDark);
    const borderColor = isDark ? "#1e293b" : "#e2e8f0";

    const base = {
      ...theme,
      rightPriceScale: { borderColor },
      timeScale: { borderColor, timeVisible: true, secondsVisible: false },
      crosshair: { mode: 1 },
    };

    // Main chart (handles user scroll / zoom)
    charts.current.main = createChart(mainRef.current, {
      ...base,
      autoSize: true,
      handleScroll: true,
      handleScale: true,
    });

    // RSI chart (time axis hidden — shares with main)
    charts.current.rsi = createChart(rsiRef.current, {
      ...base,
      autoSize: true,
      handleScroll: false,
      handleScale: false,
      timeScale: { ...base.timeScale, visible: false },
    });

    // MACD chart (time axis visible at bottom)
    charts.current.macd = createChart(macdRef.current, {
      ...base,
      autoSize: true,
      handleScroll: false,
      handleScale: false,
    });

    // ── Series ────────────────────────────────────────────────────────────────
    series.current.candle = charts.current.main.addSeries(CandlestickSeries, {
      upColor:        "#22c55e",
      downColor:      "#ef4444",
      borderUpColor:  "#22c55e",
      borderDownColor:"#ef4444",
      wickUpColor:    "#22c55e",
      wickDownColor:  "#ef4444",
    });

    series.current.volume = charts.current.main.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    charts.current.main.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    series.current.rsiLine = charts.current.rsi.addSeries(LineSeries, {
      color: "#8b5cf6",
      lineWidth: 1,
      priceFormat: { type: "price", precision: 1, minMove: 0.1 },
    });
    series.current.rsiLine.createPriceLine({ price: 70, color: "#ef4444", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true,  title: "OB" });
    series.current.rsiLine.createPriceLine({ price: 30, color: "#22c55e", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true,  title: "OS" });

    series.current.macdLine = charts.current.macd.addSeries(LineSeries, { color: "#3b82f6", lineWidth: 1 });
    series.current.sigLine  = charts.current.macd.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1 });
    series.current.hist     = charts.current.macd.addSeries(HistogramSeries, { priceScaleId: "right" });
    series.current.macdLine.createPriceLine({ price: 0, color: borderColor, lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: false, title: "" });

    // ── Sync time scales ───────────────────────────────────────────────────────
    charts.current.main.timeScale().subscribeVisibleLogicalRangeChange(
      (range: { from: number; to: number } | null) => {
        if (!range) return;
        charts.current.rsi?.timeScale().setVisibleLogicalRange(range);
        charts.current.macd?.timeScale().setVisibleLogicalRange(range);
      }
    );

    return () => {
      charts.current.main?.remove();
      charts.current.rsi?.remove();
      charts.current.macd?.remove();
      charts.current = {};
      series.current = {};
      lastBar.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply theme without reinitialising ────────────────────────────────────
  useEffect(() => {
    const theme = makeTheme(isDark);
    charts.current.main?.applyOptions(theme);
    charts.current.rsi?.applyOptions(theme);
    charts.current.macd?.applyOptions(theme);
  }, [isDark]);

  // ── Load historical data ───────────────────────────────────────────────────
  useEffect(() => {
    if (!series.current.candle) return;

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const to   = Math.floor(Date.now() / 1000);
        const mins = RESOLUTION_MINUTES[activeInterval] ?? 5;
        const from = to - 1000 * mins * 60;

        const resp = await fetch(
          `/api/market/history?symbol=${encodeURIComponent(symbol)}&exchange=${exchange}` +
          `&resolution=${activeInterval}&from=${from}&to=${to}`
        );
        const data: { bars: OHLCVBar[] } = await resp.json();
        if (cancelled || !data.bars?.length) return;

        const closes = data.bars.map(b => b.c);
        const rsiVals = calcRSI(closes);
        const { macdLine, sigLine, histLine } = calcMACD(closes);

        series.current.candle.setData(
          data.bars.map(b => ({ time: b.t as Time, open: b.o, high: b.h, low: b.l, close: b.c }))
        );
        series.current.volume.setData(
          data.bars.map(b => ({
            time: b.t as Time, value: b.v,
            color: b.c >= b.o ? "#22c55e33" : "#ef444433",
          }))
        );
        series.current.rsiLine.setData(
          data.bars
            .map((b, i) => rsiVals[i] !== null ? { time: b.t as Time, value: rsiVals[i] as number } : null)
            .filter(Boolean)
        );
        series.current.macdLine.setData(
          data.bars
            .map((b, i) => macdLine[i] !== null ? { time: b.t as Time, value: macdLine[i] as number } : null)
            .filter(Boolean)
        );
        series.current.sigLine.setData(
          data.bars
            .map((b, i) => sigLine[i] !== null ? { time: b.t as Time, value: sigLine[i] as number } : null)
            .filter(Boolean)
        );
        series.current.hist.setData(
          data.bars
            .map((b, i) => histLine[i] !== null
              ? { time: b.t as Time, value: histLine[i] as number,
                  color: (histLine[i] as number) >= 0 ? "#22c55e99" : "#ef444499" }
              : null)
            .filter(Boolean)
        );

        const last = data.bars[data.bars.length - 1];
        lastBar.current = { time: last.t, open: last.o, high: last.h, low: last.l, close: last.c, volume: last.v };
        charts.current.main?.timeScale().fitContent();
        onReady?.();
      } catch (e) {
        console.error("[AdvancedChart] loadData error:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [symbol, exchange, activeInterval, onReady]);

  // ── Live ticks ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = ticks[symbol];
    if (!tick || !series.current.candle) return;

    const mins      = RESOLUTION_MINUTES[activeInterval] ?? 5;
    const msPerBar  = mins * 60 * 1000;
    const barTimeSec = Math.floor(tick.timestamp / msPerBar) * msPerBar / 1000;

    if (!lastBar.current || barTimeSec > lastBar.current.time) {
      lastBar.current = {
        time: barTimeSec,
        open: tick.ltp, high: tick.ltp, low: tick.ltp, close: tick.ltp,
        volume: tick.volume,
      };
    } else {
      lastBar.current.high   = Math.max(lastBar.current.high, tick.ltp);
      lastBar.current.low    = Math.min(lastBar.current.low,  tick.ltp);
      lastBar.current.close  = tick.ltp;
      lastBar.current.volume = (lastBar.current.volume ?? 0) + tick.volume;
    }

    const bar = lastBar.current;
    series.current.candle.update({ time: bar.time as Time, open: bar.open, high: bar.high, low: bar.low, close: bar.close });
    series.current.volume.update({ time: bar.time as Time, value: bar.volume, color: bar.close >= bar.open ? "#22c55e33" : "#ef444433" });
  }, [symbol, ticks, activeInterval]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full">

      {/* ── Interval toolbar ── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b shrink-0">
        {INTERVALS.map(iv => (
          <button
            key={iv.value}
            onClick={() => setActiveInterval(iv.value)}
            className={[
              "px-2.5 py-0.5 rounded text-xs font-semibold transition-colors",
              activeInterval === iv.value
                ? "bg-blue-600 text-white"
                : "text-muted-foreground hover:bg-muted",
            ].join(" ")}
          >
            {iv.label}
          </button>
        ))}
        {isLoading && (
          <span className="ml-2 text-[11px] text-muted-foreground animate-pulse">Loading…</span>
        )}
        <span className="ml-auto text-xs font-semibold text-foreground">{symbol}</span>
      </div>

      {/* ── Main candlestick + volume pane ── */}
      <div ref={mainRef} className="flex-1 min-h-0" />

      {/* ── RSI pane ── */}
      <div className="border-t shrink-0">
        <div className="px-3 pt-1 text-[10px] font-medium text-muted-foreground">
          RSI (14) &nbsp;
          <span className="text-red-400">▸ 70 overbought</span>
          &nbsp; <span className="text-green-500">▸ 30 oversold</span>
        </div>
        <div ref={rsiRef} style={{ height: 100 }} />
      </div>

      {/* ── MACD pane ── */}
      <div className="border-t shrink-0">
        <div className="px-3 pt-1 text-[10px] font-medium text-muted-foreground">
          MACD (12,26,9) &nbsp;
          <span className="text-blue-400">▸ MACD</span>
          &nbsp;<span className="text-yellow-400">▸ Signal</span>
        </div>
        <div ref={macdRef} style={{ height: 100 }} />
      </div>
    </div>
  );
}
