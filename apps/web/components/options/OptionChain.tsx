"use client";

import { useOptionChain } from "@/hooks/useOptionChain";
import { OptionChainRow } from "./OptionChainRow";
import { formatCurrency } from "@/lib/utils/formatters";

interface Props { symbol: string }

export function OptionChain({ symbol }: Props) {
  const chain = useOptionChain(symbol);

  if (!chain) {
    return <div className="text-muted-foreground text-sm animate-pulse">Waiting for option chain data…</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <p className="text-sm text-muted-foreground">Spot: <span className="font-mono font-semibold text-foreground">{formatCurrency(chain.spotPrice)}</span></p>
        <p className="text-sm text-muted-foreground">Expiry: <span className="font-semibold text-foreground">{chain.expiry}</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-2 px-2">OI</th>
              <th className="text-left py-2 px-2">IV</th>
              <th className="text-left py-2 px-2">LTP</th>
              <th className="text-center py-2 px-4 bg-muted font-bold text-foreground">Strike</th>
              <th className="text-right py-2 px-2">LTP</th>
              <th className="text-right py-2 px-2">IV</th>
              <th className="text-right py-2 px-2">OI</th>
            </tr>
          </thead>
          <tbody>
            {chain.chain.map((row) => (
              <OptionChainRow key={row.strikePrice} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
