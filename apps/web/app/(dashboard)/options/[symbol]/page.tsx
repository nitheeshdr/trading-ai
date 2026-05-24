import type { Metadata } from "next";
import { OptionChain } from "@/components/options/OptionChain";

export function generateMetadata({ params }: { params: { symbol: string } }): Metadata {
  return { title: `${params.symbol} Option Chain` };
}

export default function OptionChainPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params.symbol).toUpperCase();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{symbol} — Option Chain</h1>
      <OptionChain symbol={symbol} />
    </div>
  );
}
