import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export function useWatchlists() {
  return useQuery({
    queryKey: ["watchlists"],
    queryFn: async () => {
      const { data } = await axios.get("/api/watchlist");
      return data;
    },
  });
}

export function useAddSymbol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, symbol }: { id: string; symbol: string }) => {
      const { data: list } = await axios.get(`/api/watchlist/${id}`).catch(() => ({ data: null }));
      const symbols = [...(list?.symbols ?? []), symbol];
      const { data } = await axios.put(`/api/watchlist/${id}`, { symbols });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}

export function useRemoveSymbol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, symbol }: { id: string; symbol: string }) => {
      const { data: list } = await axios.get(`/api/watchlist/${id}`).catch(() => ({ data: null }));
      const symbols = (list?.symbols ?? []).filter((s: string) => s !== symbol);
      const { data } = await axios.put(`/api/watchlist/${id}`, { symbols });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlists"] }),
  });
}
