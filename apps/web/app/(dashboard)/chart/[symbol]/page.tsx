import type { Metadata } from "next";
import { LightweightChart } from "@/components/charts/LightweightChart";
import { AIOverlay } from "@/components/charts/AIOverlay";
import { SignalBadge } from "@/components/ai/SignalBadge";

export function generateMetadata({ params }: { params: { symbol: string } }): Metadata {
  return { title: `${params.symbol} Chart` };
}

export default function ChartPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params.symbol).toUpperCase();
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
