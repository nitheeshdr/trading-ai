import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

type SubscriptionTier = "free" | "pro" | "elite";

interface UserState {
  user: User | null;
  tier: SubscriptionTier;
  brokerConnected: boolean;
  setUser: (user: User | null) => void;
  setTier: (tier: SubscriptionTier) => void;
  setBrokerConnected: (v: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  tier: "free",
  brokerConnected: false,
  setUser: (user) => set({ user }),
  setTier: (tier) => set({ tier }),
  setBrokerConnected: (brokerConnected) => set({ brokerConnected }),
}));
