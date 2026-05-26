"use client";

import { useState } from "react";
import type { Task } from "@/lib/types";
import TaskForm from "./TaskForm";

interface Props {
  projectId: string;
  initialTasks: Task[];
}

export default function TaskList({ projectId, initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function add(input: Partial<Task>) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, projectId }),
    });
    const data = await res.json();
    if (data.task) setTasks((prev) => [...prev, data.task]);
  }

  async function update(id: string, patch: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (data.task) setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
  }

  async function remove(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const open = tasks.filter((t) => t.status !== "done");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      <TaskForm onSubmit={add} />

      <section>
        <h3 className="mb-2 text-sm font-sans-ui uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Open ({open.length})
        </h3>
        <ul className="space-y-1.5">
          {open.length === 0 && (
            <li className="font-sans-ui text-sm text-stone-400 dark:text-stone-500">Nothing open. Add one above.</li>
          )}
          {open.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              editing={editingId === task.id}
              onEdit={() => setEditingId(task.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(patch) => {
                update(task.id, patch);
                setEditingId(null);
              }}
              onToggle={() => update(task.id, { status: "done" })}
              onDelete={() => remove(task.id)}
            />
          ))}
        </ul>
      </section>

      {done.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-sans-ui uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Done ({done.length})
          </h3>
          <ul className="space-y-1">
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                editing={false}
                onEdit={() => {}}
                onCancelEdit={() => {}}
                onUpdate={() => {}}
                onToggle={() => update(task.id, { status: "todo" })}
                onDelete={() => remove(task.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function TaskRow({
  task,
  editing,
  onEdit,
  onCancelEdit,
  onUpdate,
  onToggle,
  onDelete,
}: {
  task: Task;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  if (editing) {
    return (
      <li className="rounded-xl border border-stone-300 bg-white/80 p-3 dark:border-stone-700 dark:bg-stone-900/80">
        <TaskForm
          initial={task}
          onSubmit={(patch) => onUpdate(patch)}
          onCancel={onCancelEdit}
        />
      </li>
    );
  }
  const isDone = task.status === "done";
  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-white/60 dark:hover:bg-stone-900/60">
      <input
        type="checkbox"
        checked={isDone}
        onChange={onToggle}
        className="h-4 w-4 accent-stone-700"
      />
      <div className="flex-1">
        <p className={`font-sans-ui text-sm ${isDone ? "text-stone-400 line-through dark:text-stone-500" : ""}`}>
          {task.title}
        </p>
        {(task.scheduledFor || task.dueDate || task.notes) && (
          <p className="font-sans-ui text-xs text-stone-500 dark:text-stone-400">
            {task.scheduledFor && <span>scheduled {task.scheduledFor} · </span>}
            {task.dueDate && <span>due {task.dueDate.slice(0, 10)} · </span>}
            {task.notes && <span className="italic">{task.notes}</span>}
          </p>
        )}
      </div>
      <button
        onClick={onEdit}
        className="font-sans-ui text-xs text-stone-500 opacity-0 transition group-hover:opacity-100 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
      >
        edit
      </button>
      <button
        onClick={onDelete}
        className="font-sans-ui text-xs text-stone-400 opacity-0 transition group-hover:opacity-100 hover:text-rose-600 dark:text-stone-500 dark:hover:text-rose-400"
      >
        delete
      </button>
    </li>
  );
}
