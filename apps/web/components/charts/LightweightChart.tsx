"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  ColorType,
} from "lightweight-charts";
import type { OHLCV } from "@/types/market";

interface Props {
  symbol: string;
  data?: OHLCV[];
}

// lightweight-charts v5 expects time as UTCTimestamp (seconds since epoch)
// Our OHLCV.time is already a Unix timestamp in seconds — cast via unknown
type LWCCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export function LightweightChart({ symbol: _symbol, data = [] }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "hsl(215.4 16.3% 46.9%)",
      },
      grid: {
        vertLines: { color: "hsl(217.2 32.6% 17.5%)" },
        horzLines: { color: "hsl(217.2 32.6% 17.5%)" },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    // v5 API: addSeries(SeriesDefinition, options)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && data.length) {
      const candles: LWCCandle[] = data.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      seriesRef.current.setData(candles as any);
    }
  }, [data]);

  return <div ref={containerRef} className="w-full h-full" />;
}
