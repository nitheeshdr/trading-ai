"use client";

import { signOut } from "@/actions/auth";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, User } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export function Header() {
  const user = useUserStore((s) => s.user);
  return (
    <header className="h-14 border-b flex items-center justify-between px-4 lg:px-6 bg-card">
      <div className="text-sm text-muted-foreground lg:hidden font-bold">📈 TradeView</div>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {user && (
          <div className="flex items-center gap-2 text-sm">
            <User size={14} className="text-muted-foreground" />
            <span className="hidden sm:block text-muted-foreground">{user.email}</span>
            <button onClick={() => signOut()} title="Sign out" className="text-muted-foreground hover:text-foreground">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
