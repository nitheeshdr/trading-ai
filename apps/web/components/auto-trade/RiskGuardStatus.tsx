"use client";

import { useAutoTradeStore } from "@/store/useAutoTradeStore";
import { formatCurrency } from "@/lib/utils/formatters";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export function RiskGuardStatus() {
  const { dailyPL } = useAutoTradeStore();
  const safe = dailyPL >= -500;  // example threshold display

  return (
    <div className="flex items-center gap-2 text-sm">
      {safe
        ? <ShieldCheck size={14} className="text-bull" />
        : <ShieldAlert size={14} className="text-bear" />
      }
      <span className={safe ? "text-bull" : "text-bear"}>
        Daily P&amp;L: {dailyPL >= 0 ? "+" : ""}{formatCurrency(dailyPL)}
      </span>
    </div>
  );
}
