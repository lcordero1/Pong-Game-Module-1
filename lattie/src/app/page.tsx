import BriefingCard from "@/components/BriefingCard";
import TodayView from "@/components/TodayView";
import { listProjects, listTasks } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl italic">
          Lattie&rsquo;s <span className="text-[color:var(--color-accent)]">busy</span>-body schedule
        </h1>
        <p className="mt-1 font-sans-ui text-sm text-stone-600">
          One loop for everything you&rsquo;re juggling.
        </p>
      </header>
      <TodayView projects={projects} tasks={tasks} />
      <BriefingCard />
    </div>
  );
}
