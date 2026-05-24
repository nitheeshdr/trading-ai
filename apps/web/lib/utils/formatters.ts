const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const PCT = new Intl.NumberFormat("en-IN", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatCurrency(value: number): string {
  return INR.format(value);
}

export function formatPercent(value: number): string {
  return PCT.format(value / 100);
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: decimals });
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatCurrency(value)}`;
}

export function formatChangePct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatPercent(value)}`;
}

export function colorForChange(value: number): string {
  if (value > 0) return "text-bull";
  if (value < 0) return "text-bear";
  return "text-muted-foreground";
}
