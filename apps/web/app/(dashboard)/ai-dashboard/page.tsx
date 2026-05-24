import type { Metadata } from "next";
import { AIDashboard } from "@/components/ai/AIDashboard";

export const metadata: Metadata = { title: "AI Dashboard" };

export default function AIDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Dashboard</h1>
      <AIDashboard />
    </div>
  );
}
