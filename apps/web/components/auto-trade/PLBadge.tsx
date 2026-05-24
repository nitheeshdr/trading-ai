import { formatCurrency } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";

interface Props {
  value: number;
  pct?: number | null;
}

export function PLBadge({ value, pct }: Props) {
  const positive = value >= 0;
  return (
    <div className={cn("text-right font-mono text-sm font-semibold", positive ? "text-bull" : "text-bear")}>
      {positive ? "+" : ""}{formatCurrency(value)}
      {pct != null && (
        <span className="ml-1 text-xs opacity-70">({positive ? "+" : ""}{pct.toFixed(2)}%)</span>
      )}
    </div>
  );
}
