import Link from "next/link";
import type { Project, Task } from "@/lib/types";
import { summarizeWorkload } from "@/lib/schedule";

export default function ProjectCard({ project, tasks }: { project: Project; tasks: Task[] }) {
  const summary = summarizeWorkload(tasks);
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-2xl border border-stone-300/70 bg-white/50 p-5 transition hover:border-stone-400/80 hover:bg-white/80 dark:border-stone-700/70 dark:bg-stone-900/50 dark:hover:border-stone-600/80 dark:hover:bg-stone-900/80"
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: project.color }}
        />
        <h3 className="text-lg italic">{project.name}</h3>
        <span className="ml-auto font-sans-ui text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {project.kind}
        </span>
      </div>
      {project.description && (
        <p className="mb-3 font-sans-ui text-xs text-stone-600 dark:text-stone-300">{project.description}</p>
      )}
      <div className="flex gap-4 font-sans-ui text-xs text-stone-500 dark:text-stone-400">
        <span>
          <strong className="text-stone-800 dark:text-stone-100">{summary.todo + summary.doing}</strong> open
        </span>
        <span>
          <strong className="text-stone-800 dark:text-stone-100">{summary.done}</strong> done
        </span>
        {summary.overdue > 0 && (
          <span className="text-rose-700 dark:text-rose-400">
            <strong>{summary.overdue}</strong> overdue
          </span>
        )}
        {summary.dueSoon > 0 && (
          <span className="text-amber-700 dark:text-amber-400">
            <strong>{summary.dueSoon}</strong> due soon
          </span>
        )}
      </div>
    </Link>
  );
}
