import type { Task, Project } from "./types";

export interface Workday {
  startMinutes: number;
  endMinutes: number;
}

export function getWorkday(): Workday {
  const start = process.env.LADI_WORK_START ?? "10:00";
  const end = process.env.LADI_WORK_END ?? "18:30";
  return { startMinutes: hmToMinutes(start), endMinutes: hmToMinutes(end) };
}

export function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToHm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export interface ScheduleSlot {
  task: Task;
  project: Project | undefined;
  startMinutes: number;
  endMinutes: number;
}

/**
 * Slot today's tasks around the workday window. Work-project tasks go inside
 * the workday block; personal-project tasks go before (morning) or after
 * (evening) — whichever has room. Tasks with an explicit scheduledStart keep it.
 */
export function buildTodaySchedule(tasks: Task[], projects: Project[], date = new Date()): ScheduleSlot[] {
  const key = todayKey(date);
  const today = tasks.filter((t) => t.scheduledFor === key && t.status !== "done");
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const workday = getWorkday();

  const fixed: ScheduleSlot[] = [];
  const flexible: Task[] = [];
  for (const t of today) {
    if (t.scheduledStart) {
      const m = hmToMinutes(t.scheduledStart);
      fixed.push({
        task: t,
        project: projectMap.get(t.projectId),
        startMinutes: m,
        endMinutes: m + (t.estimatedMinutes || 30),
      });
    } else {
      flexible.push(t);
    }
  }

  flexible.sort((a, b) => a.priority - b.priority);

  // Personal first into the morning slot before work, work into the workday, leftover personal after work.
  const morningCursor = { value: Math.max(7 * 60, workday.startMinutes - 120) };
  const workCursor = { value: workday.startMinutes };
  const eveningCursor = { value: workday.endMinutes };

  const placed: ScheduleSlot[] = [...fixed];

  function fits(start: number, duration: number, limit: number): boolean {
    return start + duration <= limit;
  }

  for (const task of flexible) {
    const duration = task.estimatedMinutes || 30;
    const project = projectMap.get(task.projectId);
    const isWork = project?.kind === "work";
    let start: number | null = null;

    if (isWork) {
      if (fits(workCursor.value, duration, workday.endMinutes)) {
        start = workCursor.value;
        workCursor.value += duration + 10;
      }
    } else {
      if (fits(morningCursor.value, duration, workday.startMinutes)) {
        start = morningCursor.value;
        morningCursor.value += duration + 10;
      } else if (fits(eveningCursor.value, duration, 22 * 60)) {
        start = eveningCursor.value;
        eveningCursor.value += duration + 10;
      }
    }

    if (start === null) {
      // Fallback — pile remaining at end of day.
      start = eveningCursor.value;
      eveningCursor.value += duration + 10;
    }

    placed.push({ task, project, startMinutes: start, endMinutes: start + duration });
  }

  placed.sort((a, b) => a.startMinutes - b.startMinutes);
  return placed;
}

export function summarizeWorkload(tasks: Task[]): {
  todo: number;
  doing: number;
  done: number;
  overdue: number;
  dueSoon: number;
} {
  const now = new Date();
  const soonThreshold = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3);
  let todo = 0;
  let doing = 0;
  let done = 0;
  let overdue = 0;
  let dueSoon = 0;
  for (const t of tasks) {
    if (t.status === "todo") todo++;
    else if (t.status === "doing") doing++;
    else if (t.status === "done") done++;
    if (t.dueDate && t.status !== "done") {
      const due = new Date(t.dueDate);
      if (due < now) overdue++;
      else if (due < soonThreshold) dueSoon++;
    }
  }
  return { todo, doing, done, overdue, dueSoon };
}
