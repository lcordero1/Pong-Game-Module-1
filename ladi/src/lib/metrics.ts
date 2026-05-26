import type { Task } from "./types";

export interface WeekBucket {
  weekStart: string; // YYYY-MM-DD (Monday)
  label: string; // "May 12"
  completed: number;
  created: number;
}

export interface ProjectMetrics {
  monthCompleted: number;
  monthCreated: number;
  open: number;
  overdue: number;
  lastActivity: string | null; // ISO timestamp or null
  weeks: WeekBucket[]; // most recent N weeks, oldest → newest
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shortLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", day: "numeric" });
}

export function computeMetrics(tasks: Task[], weeks = 8): ProjectMetrics {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = new Date(thisWeekStart);
    ws.setDate(ws.getDate() - i * 7);
    buckets.push({ weekStart: ymd(ws), label: shortLabel(ws), completed: 0, created: 0 });
  }
  const bucketByKey = new Map(buckets.map((b) => [b.weekStart, b]));

  let monthCompleted = 0;
  let monthCreated = 0;
  let open = 0;
  let overdue = 0;
  let lastActivity: Date | null = null;

  for (const task of tasks) {
    const created = new Date(task.createdAt);
    if (created >= monthStart) monthCreated++;
    const cwk = ymd(startOfWeek(created));
    const cb = bucketByKey.get(cwk);
    if (cb) cb.created++;
    if (!lastActivity || created > lastActivity) lastActivity = created;

    if (task.completedAt) {
      const completed = new Date(task.completedAt);
      if (completed >= monthStart) monthCompleted++;
      const wk = ymd(startOfWeek(completed));
      const b = bucketByKey.get(wk);
      if (b) b.completed++;
      if (!lastActivity || completed > lastActivity) lastActivity = completed;
    } else {
      open++;
      if (task.dueDate && new Date(task.dueDate) < now) overdue++;
    }
  }

  return {
    monthCompleted,
    monthCreated,
    open,
    overdue,
    lastActivity: lastActivity ? lastActivity.toISOString() : null,
    weeks: buckets,
  };
}

export function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
