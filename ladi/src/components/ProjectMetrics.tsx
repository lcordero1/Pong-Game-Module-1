import type { ProjectMetrics } from "@/lib/metrics";
import { daysSince } from "@/lib/metrics";

export default function ProjectMetricsCard({ metrics, color }: { metrics: ProjectMetrics; color: string }) {
  const max = Math.max(1, ...metrics.weeks.map((w) => Math.max(w.completed, w.created)));
  const since = daysSince(metrics.lastActivity);
  return (
    <section className="rounded-2xl border border-stone-300/70 bg-white/60 p-5 dark:border-stone-700/70 dark:bg-stone-900/60">
      <h2 className="mb-3 text-lg italic">This month</h2>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Completed" value={metrics.monthCompleted} />
        <Stat label="Added" value={metrics.monthCreated} />
        <Stat label="Open" value={metrics.open} accent={metrics.open > 0 ? undefined : "muted"} />
        <Stat
          label={since === null ? "Idle" : "Last active"}
          value={since === null ? "never" : since === 0 ? "today" : `${since}d ago`}
          accent={since !== null && since > 14 ? "warn" : undefined}
        />
      </div>
      {metrics.overdue > 0 && (
        <p className="mb-3 font-sans-ui text-xs text-rose-700 dark:text-rose-400">
          ⚠ {metrics.overdue} overdue {metrics.overdue === 1 ? "task" : "tasks"}
        </p>
      )}
      <h3 className="mb-2 font-sans-ui text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400">
        Weekly trend (last {metrics.weeks.length} weeks)
      </h3>
      <div className="flex items-end justify-between gap-2 h-24">
        {metrics.weeks.map((w) => {
          const completedH = (w.completed / max) * 100;
          const createdH = (w.created / max) * 100;
          return (
            <div key={w.weekStart} className="flex flex-1 flex-col items-center gap-1" title={`${w.label}: ${w.completed} done / ${w.created} added`}>
              <div className="flex h-20 w-full items-end gap-0.5">
                <div
                  className="flex-1 rounded-t"
                  style={{ height: `${completedH}%`, backgroundColor: color, minHeight: w.completed > 0 ? "2px" : "0" }}
                />
                <div
                  className="flex-1 rounded-t bg-stone-300 dark:bg-stone-600"
                  style={{ height: `${createdH}%`, minHeight: w.created > 0 ? "2px" : "0" }}
                />
              </div>
              <span className="font-sans-ui text-[10px] text-stone-500 dark:text-stone-400">{w.label.split(" ")[1]}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-4 font-sans-ui text-[10px] text-stone-500 dark:text-stone-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: color }} /> completed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-stone-300 dark:bg-stone-600" /> added
        </span>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "warn" | "muted";
}) {
  const color =
    accent === "warn"
      ? "text-amber-700 dark:text-amber-400"
      : accent === "muted"
        ? "text-stone-400 dark:text-stone-500"
        : "text-stone-900 dark:text-stone-100";
  return (
    <div className="rounded-lg border border-stone-200 bg-white/50 px-3 py-2 dark:border-stone-700 dark:bg-stone-900/50">
      <p className="font-sans-ui text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400">{label}</p>
      <p className={`font-sans-ui text-2xl ${color}`}>{value}</p>
    </div>
  );
}
