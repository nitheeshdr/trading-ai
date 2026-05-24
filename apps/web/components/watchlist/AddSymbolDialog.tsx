"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAddSymbol } from "@/hooks/useWatchlist";
import { toast } from "sonner";

interface Props { watchlistId: string }

export function AddSymbolDialog({ watchlistId }: Props) {
  const [open, setOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const add = useAddSymbol();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!symbol.trim()) return;
    add.mutate({ id: watchlistId, symbol: symbol.trim().toUpperCase() }, {
      onSuccess: () => { setSymbol(""); setOpen(false); toast.success(`${symbol.toUpperCase()} added`); },
      onError: () => toast.error("Failed to add symbol"),
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-muted-foreground hover:text-foreground">
        <Plus size={16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-card rounded-lg border p-5 w-72 space-y-3 shadow-lg">
            <h4 className="font-semibold text-sm">Add Symbol</h4>
            <input autoFocus value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="e.g. RELIANCE" className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-md border px-3 py-1.5 text-sm">Cancel</button>
              <button type="submit" disabled={add.isPending} className="flex-1 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm disabled:opacity-50">Add</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
