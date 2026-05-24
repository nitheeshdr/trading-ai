import type { OptionData } from "@/types/market";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";

interface Props { row: OptionData }

export function OptionChainRow({ row }: Props) {
  return (
    <tr className={cn("border-b", row.isATM && "bg-primary/10 font-semibold")}>
      <td className="py-1.5 px-2 text-bull">{formatNumber(row.callOI, 0)}</td>
      <td className="py-1.5 px-2">{row.callIV.toFixed(1)}%</td>
      <td className="py-1.5 px-2 font-mono">{formatCurrency(row.callLTP)}</td>
      <td className={cn("py-1.5 px-4 text-center bg-muted", row.isATM && "text-primary")}>
        {formatNumber(row.strikePrice, 0)}
      </td>
      <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(row.putLTP)}</td>
      <td className="py-1.5 px-2 text-right">{row.putIV.toFixed(1)}%</td>
      <td className="py-1.5 px-2 text-right text-bear">{formatNumber(row.putOI, 0)}</td>
    </tr>
  );
}
