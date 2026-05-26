"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project, Task } from "@/lib/types";
import { buildTodaySchedule, getWorkday, minutesToHm, todayKey } from "@/lib/schedule";

interface Props {
  projects: Project[];
  tasks: Task[];
}

export default function TodayView({ projects, tasks: initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const workday = useMemo(() => getWorkday(), []);
  const schedule = useMemo(() => buildTodaySchedule(tasks, projects), [tasks, projects]);

  useEffect(() => setTasks(initialTasks), [initialTasks]);

  // Browser-side reminders: when wall clock matches a scheduled slot start, fire a notification.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const fired = new Set<string>();
    const tick = () => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      for (const slot of schedule) {
        const key = `${todayKey()}-${slot.task.id}`;
        if (fired.has(key)) continue;
        if (nowMin === slot.startMinutes) {
          fired.add(key);
          new Notification(`${slot.project?.name ?? "Ladi"}: ${slot.task.title}`, {
            body: `${minutesToHm(slot.startMinutes)}–${minutesToHm(slot.endMinutes)}`,
            tag: key,
          });
        }
      }
    };
    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
  }, [schedule]);

  async function toggle(task: Task) {
    const next = task.status === "done" ? "todo" : "done";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json();
    if (data.task) {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
    }
  }

  return (
    <div className="rounded-2xl border border-stone-300/70 bg-white/60 p-6 dark:border-stone-700/70 dark:bg-stone-900/60">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl italic">Today</h2>
        <p className="font-sans-ui text-xs text-stone-500 dark:text-stone-400">
          Workday {minutesToHm(workday.startMinutes)}–{minutesToHm(workday.endMinutes)}
        </p>
      </div>
      {schedule.length === 0 ? (
        <p className="font-sans-ui text-sm text-stone-500 dark:text-stone-400">
          Nothing scheduled for today. Pick a project and add a task with today&rsquo;s date.
        </p>
      ) : (
        <ol className="space-y-2">
          {schedule.map((slot) => {
            const inWork =
              slot.startMinutes >= workday.startMinutes && slot.startMinutes < workday.endMinutes;
            return (
              <li
                key={slot.task.id}
                className="flex items-center gap-3 rounded-xl border border-stone-200/80 bg-white/50 px-4 py-2 dark:border-stone-700/80 dark:bg-stone-900/50"
              >
                <input
                  type="checkbox"
                  checked={slot.task.status === "done"}
                  onChange={() => toggle(slot.task)}
                  className="h-4 w-4 accent-stone-700"
                />
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: slot.project?.color ?? "#999" }}
                />
                <div className="flex-1">
                  <p className={`font-sans-ui text-sm ${slot.task.status === "done" ? "line-through text-stone-400 dark:text-stone-500" : ""}`}>
                    {slot.task.title}
                  </p>
                  <p className="font-sans-ui text-xs text-stone-500 dark:text-stone-400">
                    {slot.project?.name} {inWork ? "· work block" : "· personal time"}
                  </p>
                </div>
                <p className="font-sans-ui text-xs text-stone-600 tabular-nums dark:text-stone-300">
                  {minutesToHm(slot.startMinutes)}–{minutesToHm(slot.endMinutes)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
