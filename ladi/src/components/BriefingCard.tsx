"use client";

import { useEffect, useState } from "react";
import type { Briefing } from "@/lib/types";

export default function BriefingCard() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/briefing")
      .then((r) => r.json())
      .then((d) => setBriefing(d.briefing));
  }, []);

  async function regenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/briefing", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setBriefing(data.briefing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-300/70 bg-white/60 p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl italic">
          {briefing?.kind === "afternoon" ? "Midday check-in" : "Morning briefing"}
        </h2>
        <button
          onClick={regenerate}
          disabled={loading}
          className="font-sans-ui text-xs text-stone-600 underline-offset-4 hover:underline disabled:opacity-50"
        >
          {loading ? "Thinking…" : briefing ? "Regenerate" : "Generate"}
        </button>
      </div>
      {error && <p className="font-sans-ui text-sm text-rose-600">{error}</p>}
      {briefing ? (
        <div className="whitespace-pre-wrap font-sans-ui text-sm leading-relaxed text-stone-800">
          {briefing.content}
        </div>
      ) : (
        <p className="font-sans-ui text-sm text-stone-500">
          Click <em>Generate</em> to get a briefing on what to focus on.
        </p>
      )}
      {briefing && (
        <p className="mt-3 font-sans-ui text-xs text-stone-400">
          {new Date(briefing.createdAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
