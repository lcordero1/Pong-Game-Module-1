import Anthropic from "@anthropic-ai/sdk";
import type { CoachMessage, Project, Task } from "./types";
import { buildTodaySchedule, getWorkday, minutesToHm, summarizeWorkload, todayKey } from "./schedule";

const MODEL = "claude-opus-4-7";

function client(): Anthropic {
  return new Anthropic();
}

function projectsBlock(projects: Project[], tasks: Task[]): string {
  const lines: string[] = [];
  for (const p of projects) {
    const projectTasks = tasks.filter((t) => t.projectId === p.id);
    const summary = summarizeWorkload(projectTasks);
    lines.push(
      `- ${p.name} (${p.kind})${p.description ? ` — ${p.description}` : ""}\n` +
        `    open: ${summary.todo + summary.doing}, done: ${summary.done}, overdue: ${summary.overdue}, due soon: ${summary.dueSoon}`,
    );
  }
  return lines.join("\n");
}

function todayBlock(tasks: Task[], projects: Project[]): string {
  const schedule = buildTodaySchedule(tasks, projects);
  if (schedule.length === 0) return "No tasks scheduled for today.";
  return schedule
    .map(
      (s) =>
        `  ${minutesToHm(s.startMinutes)}–${minutesToHm(s.endMinutes)} · ${s.project?.name ?? "?"} · ${s.task.title}`,
    )
    .join("\n");
}

function openTasksBlock(tasks: Task[], projects: Project[]): string {
  const open = tasks.filter((t) => t.status !== "done");
  if (open.length === 0) return "No open tasks.";
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  return open
    .slice(0, 40)
    .map((t) => {
      const p = projectMap.get(t.projectId);
      const due = t.dueDate ? ` (due ${t.dueDate.slice(0, 10)})` : "";
      const sched = t.scheduledFor ? ` [scheduled ${t.scheduledFor}]` : "";
      return `  · [${p?.name ?? "?"}] ${t.title}${due}${sched}`;
    })
    .join("\n");
}

function systemPrompt(projects: Project[], tasks: Task[]): string {
  const workday = getWorkday();
  const today = todayKey();
  return `You are Lattie's project coach. Lattie juggles multiple things: a newsletter, a podcast, speaker engagements, building AI and video production skills, and a work AI integration initiative. You help her stay organized, prioritized, and unstuck.

Be proactive: when she opens a chat with no specific question, suggest what to focus on next based on her workday, open tasks, and any neglected projects. When she asks for help, be concrete — name specific tasks and projects.

Be brief and direct. No hedging or "I'm just an AI" disclaimers. No filler.

# Lattie's context

Workday window: ${minutesToHm(workday.startMinutes)}–${minutesToHm(workday.endMinutes)}.
Today's date: ${today}.

# Projects
${projectsBlock(projects, tasks)}

# Today's schedule
${todayBlock(tasks, projects)}

# All open tasks
${openTasksBlock(tasks, projects)}
`;
}

export async function streamCoachReply(opts: {
  projects: Project[];
  tasks: Task[];
  history: CoachMessage[];
  userMessage: string;
}): Promise<ReadableStream<Uint8Array>> {
  const anthropic = client();
  const system = systemPrompt(opts.projects, opts.tasks);
  const messages = [
    ...opts.history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: opts.userMessage },
  ];

  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    cache_control: { type: "ephemeral" },
    system,
    messages,
  });

  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      stream.on("text", (delta: string) => {
        controller.enqueue(encoder.encode(delta));
      });
      try {
        await stream.finalMessage();
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function generateBriefing(opts: {
  projects: Project[];
  tasks: Task[];
  kind: "morning" | "afternoon";
}): Promise<string> {
  const anthropic = client();
  const system = systemPrompt(opts.projects, opts.tasks);
  const ask =
    opts.kind === "morning"
      ? "Write Lattie's morning briefing. 4–6 short bullet points. Lead with the most important thing today, then call out anything overdue or due soon, then one focus suggestion for personal-project time (before 10am or after 6:30pm)."
      : "Write a midday check-in. 3–5 short bullets. What's likely left for the work block, what's queued for the evening, and any neglected project that deserves a few minutes today.";

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    cache_control: { type: "ephemeral" },
    system,
    messages: [{ role: "user", content: ask }],
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
