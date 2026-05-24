import { create } from "zustand";
import type { AutoTradeStrategy, AutoTradeExecution } from "@/types/trade";

interface AutoTradeState {
  strategies: AutoTradeStrategy[];
  activeExecutions: AutoTradeExecution[];
  dailyPL: number;
  setStrategies: (s: AutoTradeStrategy[]) => void;
  toggleStrategy: (id: string, enabled: boolean) => void;
  addExecution: (e: AutoTradeExecution) => void;
  updateExecution: (id: string, patch: Partial<AutoTradeExecution>) => void;
  setDailyPL: (pl: number) => void;
}

export const useAutoTradeStore = create<AutoTradeState>((set) => ({
  strategies: [],
  activeExecutions: [],
  dailyPL: 0,

  setStrategies: (strategies) => set({ strategies }),

  toggleStrategy: (id, enabled) =>
    set((state) => ({
      strategies: state.strategies.map((s) => (s.id === id ? { ...s, enabled } : s)),
    })),

  addExecution: (e) =>
    set((state) => ({ activeExecutions: [e, ...state.activeExecutions] })),

  updateExecution: (id, patch) =>
    set((state) => ({
      activeExecutions: state.activeExecutions.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      ),
    })),

  setDailyPL: (dailyPL) => set({ dailyPL }),
}));
