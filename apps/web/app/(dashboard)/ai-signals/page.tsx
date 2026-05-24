import type { Metadata } from "next";
import { AiSignalsFeed } from "@/components/ai/AiSignalsFeed";

export const metadata: Metadata = { title: "AI Signals" };

export default function AISignalsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Signals</h1>
      <AiSignalsFeed />
    </div>
  );
}
