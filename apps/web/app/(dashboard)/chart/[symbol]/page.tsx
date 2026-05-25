import type { Metadata } from "next";
import { TradingViewChartClient } from "@/components/charts/TradingViewChartClient";
import { SignalBadge } from "@/components/ai/SignalBadge";
import { SymbolSidebarClient } from "@/components/charts/SymbolSidebarClient";

// Next.js 15: params is a Promise
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${decodeURIComponent(symbol).toUpperCase()} Chart` };
}

export default async function ChartPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol).toUpperCase();

  return (
    <div className="flex h-full gap-0 overflow-hidden -m-4 lg:-m-6">

      {/* ── Symbol search sidebar (client-only, no SSR) ── */}
      <SymbolSidebarClient currentSymbol={symbol} />

      {/* ── Chart area ── */}
      <div className="flex flex-col flex-1 min-w-0 p-4 lg:p-6">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h1 className="text-xl font-bold">{symbol}</h1>
          <SignalBadge symbol={symbol} />
        </div>

        <div className="flex-1 rounded-lg border overflow-hidden min-h-0">
          <TradingViewChartClient symbol={symbol} exchange="NSE" interval="5" />
        </div>
      </div>

    </div>
  );
}
