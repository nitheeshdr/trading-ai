"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, Eye, Activity, Bot, TrendingUp, Briefcase, Zap, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const NAV = [
  { href: "/",             icon: LayoutDashboard, label: "Dashboard" },
  { href: "/watchlist",    icon: Eye,             label: "Watchlist" },
  { href: "/chart/NIFTY",  icon: BarChart2,        label: "Charts" },
  { href: "/options/NIFTY",icon: Activity,         label: "Options" },
  { href: "/portfolio",    icon: Briefcase,        label: "Portfolio" },
  { href: "/paper-trading",icon: TrendingUp,       label: "Paper Trade" },
  { href: "/ai-signals",   icon: Bot,              label: "AI Signals" },
  { href: "/ai-dashboard", icon: Activity,         label: "AI Dashboard" },
  { href: "/auto-trade",   icon: Zap,              label: "Auto-Trade" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 border-r bg-card h-screen">
      <div className="px-4 py-5 border-b">
        <span className="text-lg font-bold tracking-tight">📈 TradeView</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
