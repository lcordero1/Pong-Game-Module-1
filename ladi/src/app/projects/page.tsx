import ProjectCard from "@/components/ProjectCard";
import { listProjects, listTasks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl italic">Projects</h1>
        <p className="mt-1 font-sans-ui text-sm text-stone-600 dark:text-stone-300">
          Everything in motion. Click in to manage tasks.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            project={p}
            tasks={tasks.filter((t) => t.projectId === p.id)}
          />
        ))}
      </div>
    </div>
  );
}
