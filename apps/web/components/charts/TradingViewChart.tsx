"use client";

/**
 * TradingViewChart.tsx
 * --------------------
 * Full TradingView Advanced Chart widget using the Charting Library.
 *
 * Requirements:
 *   1. Copy the charting_library folder into public/charting_library/
 *      Download from: https://github.com/tradingview/charting_library
 *   2. Files needed:
 *      public/charting_library/charting_library.esm.js
 *      public/charting_library/charting_library.js
 *      public/charting_library/datafeeds/udf/dist/bundle.js
 *
 * The widget is loaded dynamically (client-only, no SSR).
 */

import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useMarketStore } from "@/store/useMarketStore";
import { datafeed } from "@/lib/tradingview/datafeed";
import type { IChartingLibraryWidget, ChartingLibraryWidgetOptions } from "@/lib/tradingview/charting_library";

interface Props {
  symbol: string;
  exchange?: string;
  interval?: string;
  /** Called when the chart is ready — gives access to the widget API */
  onReady?: (widget: IChartingLibraryWidget) => void;
}

// ─── Theme overrides ─────────────────────────────────────────────────────────

function getDarkOverrides() {
  return {
    "paneProperties.background": "#0f172a",
    "paneProperties.backgroundType": "solid",
    "paneProperties.vertGridProperties.color": "#1e293b",
    "paneProperties.horzGridProperties.color": "#1e293b",
    "symbolWatermarkProperties.transparency": 90,
    "scalesProperties.textColor": "#94a3b8",
    "mainSeriesProperties.candleStyle.upColor": "#22c55e",
    "mainSeriesProperties.candleStyle.downColor": "#ef4444",
    "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
    "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
    "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
    "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
  };
}

function getLightOverrides() {
  return {
    "paneProperties.background": "#ffffff",
    "paneProperties.backgroundType": "solid",
    "paneProperties.vertGridProperties.color": "#e2e8f0",
    "paneProperties.horzGridProperties.color": "#e2e8f0",
    "scalesProperties.textColor": "#475569",
    "mainSeriesProperties.candleStyle.upColor": "#22c55e",
    "mainSeriesProperties.candleStyle.downColor": "#ef4444",
    "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
    "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
    "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
    "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TradingViewChart({
  symbol,
  exchange = "NSE",
  interval = "5",
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<IChartingLibraryWidget | null>(null);
  const { resolvedTheme } = useTheme();
  const ticks = useMarketStore((s) => s.ticks);

  // Forward live ticks from Zustand → datafeed → TradingView
  useEffect(() => {
    const tick = ticks[symbol];
    if (!tick) return;
    datafeed.handleTick(symbol, tick.ltp, tick.volume, tick.timestamp);
  }, [symbol, ticks]);

  const initWidget = useCallback(async () => {
    if (!containerRef.current) return;

    // ── Dynamic import — library lives in public/, not node_modules ──────────
    // The library sets window.TradingView when loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).TradingView) {
      await loadScript("/charting_library/charting_library.js");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const TV = (window as any).TradingView;
    if (!TV?.widget) {
      console.error("[TradingViewChart] charting_library not found in public/charting_library/");
      return;
    }

    // Clean up previous instance
    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    const isDark = resolvedTheme === "dark";

    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: `${exchange}:${symbol}`,
      datafeed,
      interval: interval as ChartingLibraryWidgetOptions["interval"],
      container: containerRef.current,
      library_path: "/charting_library/",
      locale: "en",
      theme: isDark ? "dark" : "light",
      autosize: true,
      timezone: "Asia/Kolkata",

      // Disabled features (clean minimal UI)
      disabled_features: [
        "header_symbol_search",       // we control symbol via props
        "header_compare",
        "header_undo_redo",
        "use_localstorage_for_settings",
        "volume_force_overlay",
        "create_volume_indicator_by_default",
      ],

      // Enabled features
      enabled_features: [
        "study_templates",
        "side_toolbar_in_fullscreen_mode",
        "header_in_fullscreen_mode",
        "move_logo_to_main_pane",
        "hide_last_na_study_output",
      ],

      overrides: isDark ? getDarkOverrides() : getLightOverrides(),

      // Loading screen matches app background
      loading_screen: {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        foregroundColor: "#3b82f6",
      },

      // Time frames shown in the bottom bar
      time_frames: [
        { text: "1D",  resolution: "5",  description: "1 Day" },
        { text: "1W",  resolution: "30", description: "1 Week" },
        { text: "1M",  resolution: "60", description: "1 Month" },
        { text: "3M",  resolution: "D",  description: "3 Months" },
        { text: "1Y",  resolution: "W",  description: "1 Year" },
        { text: "ALL", resolution: "W",  description: "All Time" },
      ],
    };

    const tvWidget = new TV.widget(widgetOptions) as IChartingLibraryWidget;
    widgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      onReady?.(tvWidget);

      // Add default studies
      const chart = tvWidget.activeChart();
      chart.createStudy("Volume", false, false);
      chart.createStudy("Relative Strength Index", false, false, [14]);
      chart.createStudy("MACD", false, false, [12, 26, "close", 9]);
    });
  }, [symbol, exchange, interval, resolvedTheme, onReady]);

  // Init on mount + re-init when symbol/theme changes
  useEffect(() => {
    initWidget();
    return () => {
      widgetRef.current?.remove();
      widgetRef.current = null;
    };
  }, [initWidget]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full tv-chart-container"
      style={{ minHeight: "500px" }}
    />
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}
