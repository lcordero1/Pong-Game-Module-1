"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachMessage, StoredContentBlock } from "@/lib/types";

interface Resolution {
  tool_use_id: string;
  result: "approve" | "deny";
  reason?: string;
}

export default function CoachChat() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingResolutions, setPendingResolutions] = useState<Record<string, Resolution>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    await postChat({ message: text });
    setInput("");
  }

  async function postChat(body: { message?: string; resolutions?: Resolution[] }) {
    setBusy(true);
    setError(null);
    if (body.message) {
      const optimistic: CoachMessage = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: body.message,
        pending: null,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
    }
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "request failed");
      const fresh = await fetch("/api/chat").then((r) => r.json());
      setMessages(fresh.messages ?? []);
      setPendingResolutions({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    await fetch("/api/chat", { method: "DELETE" });
    setMessages([]);
    setPendingResolutions({});
  }

  async function submitResolutions(toolUseIds: string[]) {
    const resolutions = toolUseIds.map(
      (id) => pendingResolutions[id] ?? { tool_use_id: id, result: "deny" as const, reason: "no decision" },
    );
    await postChat({ resolutions });
  }

  function setResolution(id: string, result: "approve" | "deny") {
    setPendingResolutions((prev) => ({ ...prev, [id]: { tool_use_id: id, result } }));
  }

  const lastPending = [...messages].reverse().find(
    (m) => m.role === "assistant" && m.pending && m.pending.length > 0,
  );
  const allResolved =
    lastPending && lastPending.pending
      ? lastPending.pending.every((id) => pendingResolutions[id])
      : false;

  return (
    <div className="flex h-[75vh] flex-col rounded-2xl border border-stone-300/70 bg-white/60 dark:border-stone-700/70 dark:bg-stone-900/60">
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-3 dark:border-stone-700">
        <h2 className="text-lg italic">Coach</h2>
        <button
          onClick={clear}
          className="font-sans-ui text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
        >
          Clear chat
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="font-sans-ui text-sm text-stone-500 dark:text-stone-400">
            Ask what to focus on, or tell the coach what to add — e.g. &ldquo;Schedule podcast prep tomorrow at 9am.&rdquo;
          </p>
        )}
        {messages.map((m) => (
          <MessageRow
            key={m.id}
            message={m}
            resolutions={pendingResolutions}
            onResolve={setResolution}
          />
        ))}
        {busy && (
          <p className="font-sans-ui text-xs text-stone-400 italic dark:text-stone-500">Coach is thinking…</p>
        )}
        {error && <p className="font-sans-ui text-sm text-rose-600 dark:text-rose-400">Error: {error}</p>}
      </div>

      {lastPending && lastPending.pending && (
        <div className="border-t border-amber-200 bg-amber-50/80 px-5 py-3 dark:border-amber-700/50 dark:bg-amber-900/30">
          <p className="mb-2 font-sans-ui text-xs text-amber-800 dark:text-amber-200">
            {allResolved
              ? "All proposals decided. Send to coach?"
              : `${lastPending.pending.length} proposal${lastPending.pending.length > 1 ? "s" : ""} pending — approve or deny each.`}
          </p>
          <button
            onClick={() => submitResolutions(lastPending.pending!)}
            disabled={!allResolved || busy}
            className="rounded-full bg-stone-900 px-4 py-1.5 font-sans-ui text-xs text-stone-50 hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            {busy ? "…" : "Send decisions"}
          </button>
        </div>
      )}

      <form onSubmit={send} className="flex gap-2 border-t border-stone-200 px-5 py-3 dark:border-stone-700">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to your coach…"
          disabled={busy || !!lastPending}
          className="flex-1 rounded-full border border-stone-300 bg-white px-4 py-2 font-sans-ui text-sm focus:border-stone-500 focus:outline-none disabled:opacity-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
        />
        <button
          type="submit"
          disabled={busy || !input.trim() || !!lastPending}
          className="rounded-full bg-stone-900 px-5 py-2 font-sans-ui text-sm text-stone-50 hover:bg-stone-800 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          {busy ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

function MessageRow({
  message,
  resolutions,
  onResolve,
}: {
  message: CoachMessage;
  resolutions: Record<string, Resolution>;
  onResolve: (id: string, result: "approve" | "deny") => void;
}) {
  const blocks: StoredContentBlock[] =
    typeof message.content === "string"
      ? [{ type: "text", text: message.content }]
      : message.content;

  const isToolResultTurn =
    message.role === "user" &&
    Array.isArray(message.content) &&
    message.content.every((b) => b.type === "tool_result");
  if (isToolResultTurn) {
    return (
      <div className="space-y-1">
        {blocks.map((b, i) =>
          b.type === "tool_result" ? (
            <div
              key={`${message.id}-${i}`}
              className={`mx-auto max-w-[80%] rounded-md border px-3 py-1.5 font-sans-ui text-xs ${
                b.is_error
                  ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                  : "border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
              }`}
            >
              {b.content}
            </div>
          ) : null,
        )}
      </div>
    );
  }

  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] space-y-2 ${
          isUser
            ? "rounded-2xl bg-stone-900 px-4 py-2 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
            : ""
        }`}
      >
        {blocks.map((b, i) => {
          if (b.type === "text") {
            return (
              <div
                key={`${message.id}-${i}`}
                className={`whitespace-pre-wrap font-sans-ui text-sm ${
                  isUser
                    ? ""
                    : "rounded-2xl bg-stone-200 px-4 py-2 text-stone-900 dark:bg-stone-800 dark:text-stone-100"
                }`}
              >
                {b.text}
              </div>
            );
          }
          if (b.type === "tool_use") {
            const decision = resolutions[b.id];
            return (
              <ProposalCard
                key={`${message.id}-${i}`}
                toolUseId={b.id}
                name={b.name}
                input={b.input}
                isPending={Array.isArray(message.pending) && message.pending.includes(b.id)}
                decision={decision?.result}
                onResolve={onResolve}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

function ProposalCard({
  toolUseId,
  name,
  input,
  isPending,
  decision,
  onResolve,
}: {
  toolUseId: string;
  name: string;
  input: Record<string, unknown>;
  isPending: boolean;
  decision?: "approve" | "deny";
  onResolve: (id: string, result: "approve" | "deny") => void;
}) {
  const verb =
    name === "create_task"
      ? "Create task"
      : name === "update_task"
        ? "Update task"
        : name === "delete_task"
          ? "Delete task"
          : name;
  return (
    <div
      className={`rounded-xl border px-3 py-2 font-sans-ui text-xs ${
        decision === "approve"
          ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
          : decision === "deny"
            ? "border-stone-300 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/60"
            : isPending
              ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
              : "border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-stone-800/60"
      }`}
    >
      <p className="mb-1 font-medium text-stone-800 dark:text-stone-100">
        <span className="mr-1">
          {decision === "approve" ? "✓" : decision === "deny" ? "✗" : "?"}
        </span>
        Proposal: {verb}
      </p>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-stone-700 dark:text-stone-200">
        {Object.entries(input)
          .filter(([, v]) => v !== "" && v != null)
          .map(([k, v]) => (
            <span key={k} className="contents">
              <dt className="text-stone-500 dark:text-stone-400">{k}</dt>
              <dd className="font-mono break-words">{String(v)}</dd>
            </span>
          ))}
      </dl>
      {isPending && !decision && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => onResolve(toolUseId, "approve")}
            className="rounded-full bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            Approve
          </button>
          <button
            onClick={() => onResolve(toolUseId, "deny")}
            className="rounded-full border border-stone-400 px-3 py-1 text-xs text-stone-700 hover:bg-stone-100 dark:border-stone-600 dark:text-stone-200 dark:hover:bg-stone-800"
          >
            Deny
          </button>
        </div>
      )}
      {isPending && decision && (
        <p className="mt-1 text-stone-500 italic dark:text-stone-400">
          {decision === "approve" ? "Will be approved." : "Will be denied."}
        </p>
      )}
    </div>
  );
}
