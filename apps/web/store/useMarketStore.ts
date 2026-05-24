import { create } from "zustand";
import type { Tick } from "@/types/market";

interface MarketState {
  ticks: Record<string, Tick>;
  subscribedSymbols: Set<string>;
  setTick: (symbol: string, tick: Tick) => void;
  setTicks: (ticks: Record<string, Tick>) => void;
  addSubscription: (symbol: string) => void;
  removeSubscription: (symbol: string) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  ticks: {},
  subscribedSymbols: new Set(),

  setTick: (symbol, tick) =>
    set((state) => ({ ticks: { ...state.ticks, [symbol]: tick } })),

  setTicks: (ticks) => set({ ticks }),

  addSubscription: (symbol) =>
    set((state) => ({ subscribedSymbols: new Set([...state.subscribedSymbols, symbol]) })),

  removeSubscription: (symbol) =>
    set((state) => {
      const next = new Set(state.subscribedSymbols);
      next.delete(symbol);
      return { subscribedSymbols: next };
    }),
}));
