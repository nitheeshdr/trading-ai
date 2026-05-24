import { create } from "zustand";
import type { Position } from "@/types/trade";

interface TradeState {
  paperPositions: Position[];
  setPaperPositions: (positions: Position[]) => void;
  upsertPosition: (position: Position) => void;
  removePosition: (symbol: string) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  paperPositions: [],

  setPaperPositions: (positions) => set({ paperPositions: positions }),

  upsertPosition: (position) =>
    set((state) => {
      const idx = state.paperPositions.findIndex(
        (p) => p.symbol === position.symbol && p.mode === position.mode
      );
      if (idx >= 0) {
        const next = [...state.paperPositions];
        next[idx] = position;
        return { paperPositions: next };
      }
      return { paperPositions: [...state.paperPositions, position] };
    }),

  removePosition: (symbol) =>
    set((state) => ({
      paperPositions: state.paperPositions.filter((p) => p.symbol !== symbol),
    })),
}));
