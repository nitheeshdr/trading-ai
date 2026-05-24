import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { AutoTradeStrategy, AutoTradeExecution } from "@/types/trade";

export function useStrategies() {
  return useQuery<AutoTradeStrategy[]>({
    queryKey: ["auto-trade-strategies"],
    queryFn: async () => {
      const { data } = await axios.get("/api/auto-trade/strategies");
      return data;
    },
  });
}

export function useToggleStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await axios.post(`/api/auto-trade/strategies/${id}/toggle`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auto-trade-strategies"] }),
  });
}

export function useExecutions(strategyId?: string) {
  return useQuery<AutoTradeExecution[]>({
    queryKey: ["auto-trade-executions", strategyId],
    queryFn: async () => {
      const params = strategyId ? `?strategy_id=${strategyId}` : "";
      const { data } = await axios.get(`/api/auto-trade/executions${params}`);
      return data;
    },
    refetchInterval: 5_000,  // poll every 5s for live P&L
  });
}

export function useCreateStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<AutoTradeStrategy, "id" | "user_id" | "enabled" | "created_at" | "updated_at">) => {
      const { data } = await axios.post("/api/auto-trade/strategies", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auto-trade-strategies"] }),
  });
}
