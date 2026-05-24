"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { placePaperTrade } from "@/actions/portfolio";
import { toast } from "sonner";

const schema = z.object({
  symbol: z.string().min(1),
  type: z.enum(["BUY", "SELL"]),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});
type FormData = z.infer<typeof schema>;

export function PaperTradePanel() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "BUY" },
  });

  async function onSubmit(values: FormData) {
    setLoading(true);
    const result = await placePaperTrade({ ...values, exchange: "NSE", mode: "paper" });
    setLoading(false);
    if (result?.error) toast.error(result.error);
    else { toast.success(`Paper ${values.type} placed for ${values.symbol}`); reset(); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-card p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Symbol</label>
        <input {...register("symbol")} placeholder="RELIANCE" className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary uppercase" />
        {errors.symbol && <p className="text-xs text-destructive mt-1">{errors.symbol.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Side</label>
          <select {...register("type")} className="w-full rounded-md border px-3 py-2 text-sm bg-background">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Qty</label>
          <input {...register("quantity", { valueAsNumber: true })} type="number" min={1} className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
          {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity.message}</p>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Price (₹)</label>
        <input {...register("price", { valueAsNumber: true })} type="number" step="0.01" className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        {loading ? "Placing…" : "Place Paper Trade"}
      </button>
    </form>
  );
}
