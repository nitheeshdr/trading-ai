"use client";

import { useEffect } from "react";

export default function ChartError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ChartPage error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-lg font-semibold">Chart failed to load</h2>
      <pre className="text-xs text-muted-foreground bg-muted rounded p-3 max-w-xl whitespace-pre-wrap text-left">
        {error.message}
        {error.digest ? `\ndigest: ${error.digest}` : ""}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
