"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useStrategies } from "@/hooks/useAutoTrade";
import { StrategyCard } from "./StrategyCard";

export function StrategyList() {
  const { data: strategies, isLoading } = useStrategies();

  if (isLoading) return <div className="text-muted-foreground text-sm animate-pulse">Loading strategies…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{strategies?.length ?? 0} strategies</p>
        <Link href="/auto-trade/new" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90">
          <Plus size={14} /> New Strategy
        </Link>
      </div>
      {!strategies?.length && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          No strategies yet. Create one to start automated trading.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {strategies?.map((s) => <StrategyCard key={s.id} strategy={s} />)}
      </div>
    </div>
  );
}
