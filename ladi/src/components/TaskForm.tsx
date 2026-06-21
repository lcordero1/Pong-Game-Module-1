"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import { todayKey } from "@/lib/schedule";

interface Props {
  initial?: Partial<Task>;
  onSubmit: (input: Partial<Task>) => void;
  onCancel?: () => void;
}

export default function TaskForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [scheduledFor, setScheduledFor] = useState(initial?.scheduledFor ?? "");
  const [scheduledStart, setScheduledStart] = useState(initial?.scheduledStart ?? "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimatedMinutes ?? 30);
  const [priority, setPriority] = useState<number>(initial?.priority ?? 2);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      notes: notes.trim(),
      scheduledFor: scheduledFor || null,
      scheduledStart: scheduledStart || null,
      estimatedMinutes: Number(estimatedMinutes) || 30,
      priority: priority as 1 | 2 | 3,
    });
    if (!initial) {
      setTitle("");
      setNotes("");
      setScheduledFor("");
      setScheduledStart("");
      setEstimatedMinutes(30);
      setPriority(2);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-stone-300/70 bg-white/40 p-3 dark:border-stone-700/70 dark:bg-stone-900/40">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-sans-ui text-sm focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500"
      />
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 font-sans-ui text-sm focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500"
      />
      <div className="flex flex-wrap gap-2 font-sans-ui text-xs">
        <label className="flex items-center gap-1">
          <span className="text-stone-500 dark:text-stone-400">Date</span>
          <input
            type="date"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="rounded border border-stone-300 bg-white px-2 py-1 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>
        <button
          type="button"
          onClick={() => setScheduledFor(todayKey())}
          className="rounded border border-stone-300 px-2 py-1 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Today
        </button>
        <label className="flex items-center gap-1">
          <span className="text-stone-500 dark:text-stone-400">Start</span>
          <input
            type="time"
            value={scheduledStart}
            onChange={(e) => setScheduledStart(e.target.value)}
            className="rounded border border-stone-300 bg-white px-2 py-1 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-stone-500 dark:text-stone-400">Min</span>
          <input
            type="number"
            min={5}
            step={5}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            className="w-16 rounded border border-stone-300 bg-white px-2 py-1 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>
        <label className="flex items-center gap-1">
          <span className="text-stone-500 dark:text-stone-400">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="rounded border border-stone-300 bg-white px-2 py-1 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value={1}>High</option>
            <option value={2}>Medium</option>
            <option value={3}>Low</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-1 font-sans-ui text-xs text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="rounded-full bg-stone-900 px-4 py-1.5 font-sans-ui text-xs text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          {initial ? "Save" : "Add task"}
        </button>
      </div>
    </form>
  );
}
