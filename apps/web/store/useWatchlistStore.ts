import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  activeWatchlistId: string | null;
  setActiveWatchlist: (id: string | null) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      activeWatchlistId: null,
      setActiveWatchlist: (id) => set({ activeWatchlistId: id }),
    }),
    { name: "tradeview-watchlist" }
  )
);
