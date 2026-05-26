import Anthropic from "@anthropic-ai/sdk";
import type { CoachMessage, Project, StoredContentBlock, Task } from "./types";
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
      `- ${p.name} (id: ${p.id}, ${p.kind})${p.description ? ` — ${p.description}` : ""}\n` +
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
        `  ${minutesToHm(s.startMinutes)}–${minutesToHm(s.endMinutes)} · ${s.project?.name ?? "?"} · ${s.task.title} (id: ${s.task.id})`,
    )
    .join("\n");
}

function openTasksBlock(tasks: Task[], projects: Project[]): string {
  const open = tasks.filter((t) => t.status !== "done");
  if (open.length === 0) return "No open tasks.";
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  return open
    .slice(0, 50)
    .map((t) => {
      const p = projectMap.get(t.projectId);
      const due = t.dueDate ? ` (due ${t.dueDate.slice(0, 10)})` : "";
      const sched = t.scheduledFor ? ` [scheduled ${t.scheduledFor}]` : "";
      return `  · [${p?.name ?? "?"}] ${t.title} (id: ${t.id})${due}${sched}`;
    })
    .join("\n");
}

function systemPrompt(projects: Project[], tasks: Task[]): string {
  const workday = getWorkday();
  const today = todayKey();
  return `You are Ladi's project coach. Ladi juggles multiple things: a newsletter, a podcast, speaker engagements, building AI and video production skills, and a work AI integration initiative. You help her stay organized, prioritized, and unstuck.

Be proactive: when she opens a chat with no specific question, suggest what to focus on next based on her workday, open tasks, and any neglected projects. When she asks for help, be concrete — name specific tasks and projects.

Be brief and direct. No hedging or "I'm just an AI" disclaimers. No filler.

# Tools

You have three tools to propose changes to Ladi's task list: create_task, update_task, delete_task. Use them when Ladi clearly wants something added, changed, or removed — and when you can reduce her friction by doing it for her. Every proposal goes through an approve/deny gate, so she stays in control. If she denies, ask what to do instead — don't repeat the same proposal.

Before calling a tool, briefly say what you're about to propose ("I'll add a draft session to the Newsletter project for tomorrow morning") so she has context when the approval card appears. Use project_id values exactly as they appear in the project list below (e.g., proj-newsletter). Use task_id values exactly as shown in the open-task list.

For dates use YYYY-MM-DD. For times use HH:MM in 24-hour format.

# Ladi's context

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

const TOOLS: Anthropic.Tool[] = [
  {
    name: "create_task",
    description:
      "Add a new task to a project. Use when Ladi asks you to schedule or add something specific.",
    input_schema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project ID, e.g. proj-newsletter" },
        title: { type: "string", description: "Short task title" },
        notes: { type: "string", description: "Optional notes" },
        scheduled_for: { type: "string", description: "YYYY-MM-DD date to slot for. Optional." },
        scheduled_start: { type: "string", description: "HH:MM 24h start time. Optional." },
        estimated_minutes: { type: "integer", description: "Estimated duration in minutes. Default 30." },
        priority: { type: "integer", enum: [1, 2, 3], description: "1=high, 2=medium, 3=low" },
        due_date: { type: "string", description: "YYYY-MM-DD due date. Optional." },
      },
      required: ["project_id", "title"],
    },
  },
  {
    name: "update_task",
    description:
      "Modify an existing task — change title, mark complete, reschedule, change priority. Only include fields you want to change.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string", description: "Task ID, e.g. task-1a2b3c4d" },
        title: { type: "string" },
        notes: { type: "string" },
        status: { type: "string", enum: ["todo", "doing", "done"] },
        priority: { type: "integer", enum: [1, 2, 3] },
        scheduled_for: { type: "string", description: "YYYY-MM-DD; empty string clears" },
        scheduled_start: { type: "string", description: "HH:MM; empty string clears" },
        estimated_minutes: { type: "integer" },
        due_date: { type: "string", description: "YYYY-MM-DD; empty string clears" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "delete_task",
    description:
      "Permanently delete a task. Use sparingly — marking complete is usually better than deleting.",
    input_schema: {
      type: "object",
      properties: {
        task_id: { type: "string" },
      },
      required: ["task_id"],
    },
  },
];

/** Convert stored history into the shape Anthropic.messages.create expects. */
function toApiMessages(history: CoachMessage[]): Anthropic.MessageParam[] {
  return history.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : (m.content as unknown as Anthropic.ContentBlockParam[]),
  }));
}

export interface CoachReply {
  assistantContent: StoredContentBlock[];
  pendingToolUseIds: string[];
  stopReason: string;
}

export async function runCoachTurn(opts: {
  projects: Project[];
  tasks: Task[];
  history: CoachMessage[];
}): Promise<CoachReply> {
  const anthropic = client();
  const system = systemPrompt(opts.projects, opts.tasks);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    cache_control: { type: "ephemeral" },
    system,
    tools: TOOLS,
    messages: toApiMessages(opts.history),
  });

  const stored: StoredContentBlock[] = [];
  const pending: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      stored.push({ type: "text", text: block.text });
    } else if (block.type === "tool_use") {
      stored.push({
        type: "tool_use",
        id: block.id,
        name: block.name,
        input: (block.input ?? {}) as Record<string, unknown>,
      });
      pending.push(block.id);
    }
  }

  return {
    assistantContent: stored,
    pendingToolUseIds: pending,
    stopReason: response.stop_reason ?? "end_turn",
  };
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
      ? "Write Ladi's morning briefing. 4–6 short bullet points. Lead with the most important thing today, then call out anything overdue or due soon, then one focus suggestion for personal-project time (before 10am or after 6:30pm). Do not call any tools."
      : "Write a midday check-in. 3–5 short bullets. What's likely left for the work block, what's queued for the evening, and any neglected project that deserves a few minutes today. Do not call any tools.";

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
