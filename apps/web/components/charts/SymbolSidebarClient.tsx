"use client";

/**
 * SymbolSidebarClient
 * -------------------
 * Client-only wrapper that lazy-loads SymbolSearch with ssr:false.
 * This prevents any potential SSR rendering issues from the
 * router/query hooks inside SymbolSearch.
 */

import dynamic from "next/dynamic";

const SymbolSearch = dynamic(
  () => import("./SymbolSearch").then((m) => ({ default: m.SymbolSearch })),
  {
    ssr: false,
    loading: () => (
      <div className="w-52 xl:w-60 shrink-0 border-r bg-card max-md:hidden flex flex-col">
        <div className="p-2 border-b">
          <div className="h-8 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 rounded bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    ),
  }
);

interface Props {
  currentSymbol: string;
}

export function SymbolSidebarClient({ currentSymbol }: Props) {
  return <SymbolSearch currentSymbol={currentSymbol} />;
}
