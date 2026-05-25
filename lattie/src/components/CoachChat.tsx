"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachMessage } from "@/lib/types";

export default function CoachChat() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setBusy(true);
    setInput("");
    const optimistic: CoachMessage = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error ?? "request failed");
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setStreaming(acc);
      }
      acc += decoder.decode();
      const assistant: CoachMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: acc,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistant]);
      setStreaming("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    await fetch("/api/chat", { method: "DELETE" });
    setMessages([]);
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-stone-300/70 bg-white/60">
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3">
        <h2 className="text-lg italic">Coach</h2>
        <button
          onClick={clear}
          className="font-sans-ui text-xs text-stone-500 hover:text-stone-800"
        >
          Clear chat
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="font-sans-ui text-sm text-stone-500">
            Ask what to focus on, or just say hi — the coach knows your projects and today's schedule.
          </p>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} />
        ))}
        {streaming && <Bubble role="assistant" content={streaming} />}
        {error && (
          <p className="font-sans-ui text-sm text-rose-600">Error: {error}</p>
        )}
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-stone-200 px-5 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to your coach…"
          disabled={busy}
          className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-2 font-sans-ui text-sm focus:border-stone-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-full bg-stone-900 px-5 py-2 font-sans-ui text-sm text-stone-50 hover:bg-stone-800 disabled:opacity-50"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 font-sans-ui text-sm ${
          isUser ? "bg-stone-900 text-stone-50" : "bg-stone-200 text-stone-900"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
