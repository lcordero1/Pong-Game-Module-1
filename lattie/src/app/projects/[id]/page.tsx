import Link from "next/link";
import { notFound } from "next/navigation";
import TaskList from "@/components/TaskList";
import { getProject, listTasks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  const tasks = await listTasks({ projectId: id });

  return (
    <div className="space-y-5">
      <Link href="/projects" className="font-sans-ui text-xs text-stone-500 hover:text-stone-800">
        ← All projects
      </Link>
      <header>
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-4 w-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-3xl italic">{project.name}</h1>
          <span className="font-sans-ui text-[10px] uppercase tracking-wider text-stone-400">
            {project.kind}
          </span>
        </div>
        {project.description && (
          <p className="mt-2 font-sans-ui text-sm text-stone-600">{project.description}</p>
        )}
      </header>
      <TaskList projectId={project.id} initialTasks={tasks} />
    </div>
  );
}
