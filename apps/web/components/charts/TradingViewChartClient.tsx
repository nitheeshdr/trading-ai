"use client";

/**
 * TradingViewChartClient.tsx
 * --------------------------
 * Client-only wrapper that dynamically imports TradingViewChart with ssr:false.
 * Next.js 15 requires `ssr: false` to live inside a Client Component,
 * so the Server-Component chart page imports this wrapper instead.
 */

import dynamic from "next/dynamic";

const TradingViewChart = dynamic(
  () =>
    import("./TradingViewChart").then((m) => ({ default: m.TradingViewChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-muted/10 animate-pulse rounded-lg">
        <span className="text-muted-foreground text-sm">Loading chart…</span>
      </div>
    ),
  }
);

interface Props {
  symbol: string;
  exchange?: string;
  interval?: string;
}

export function TradingViewChartClient({ symbol, exchange, interval }: Props) {
  return <TradingViewChart symbol={symbol} exchange={exchange} interval={interval} />;
}
