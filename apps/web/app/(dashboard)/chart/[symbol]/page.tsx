import type { Metadata } from "next";
import { LightweightChart } from "@/components/charts/LightweightChart";
import { AIOverlay } from "@/components/charts/AIOverlay";
import { SignalBadge } from "@/components/ai/SignalBadge";

// Next.js 15: params is a Promise
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol} Chart` };
}

export default async function ChartPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol).toUpperCase();
  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{symbol}</h1>
        <SignalBadge symbol={symbol} />
      </div>
      <div className="flex-1 relative rounded-lg border overflow-hidden">
        <LightweightChart symbol={symbol} />
        <AIOverlay symbol={symbol} />
      </div>
    </div>
  );
}
