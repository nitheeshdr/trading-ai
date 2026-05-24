import type { Metadata } from "next";
import { OptionChain } from "@/components/options/OptionChain";

// Next.js 15: params is a Promise
export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `${symbol} Option Chain` };
}

export default async function OptionChainPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol).toUpperCase();
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{symbol} — Option Chain</h1>
      <OptionChain symbol={symbol} />
    </div>
  );
}
