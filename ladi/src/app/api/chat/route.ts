import { NextResponse } from "next/server";
import {
  appendCoachMessage,
  clearCoachMessages,
  clearCoachPending,
  createTask,
  deleteTask,
  findPendingAssistant,
  listCoachMessages,
  listProjects,
  listTasks,
  updateTask,
} from "@/lib/store";
import { runCoachTurn } from "@/lib/agent";
import type { Priority, StoredContentBlock, Task, TaskStatus } from "@/lib/types";

interface Resolution {
  tool_use_id: string;
  result: "approve" | "deny";
  reason?: string;
}

export async function GET() {
  const messages = await listCoachMessages();
  return NextResponse.json({ messages });
}

export async function DELETE() {
  await clearCoachMessages();
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const userText: string | undefined = body.message;
  const resolutions: Resolution[] | undefined = body.resolutions;

  if (!userText && (!resolutions || resolutions.length === 0)) {
    return NextResponse.json({ error: "message or resolutions required" }, { status: 400 });
  }

  // 1. Handle a resolution batch (approve/deny on the pending assistant turn).
  if (resolutions && resolutions.length > 0) {
    const pendingMsg = await findPendingAssistant();
    if (!pendingMsg || !Array.isArray(pendingMsg.content)) {
      return NextResponse.json({ error: "no pending tool calls" }, { status: 400 });
    }
    const toolUses = pendingMsg.content.filter(
      (b): b is Extract<StoredContentBlock, { type: "tool_use" }> => b.type === "tool_use",
    );
    const resolvedIds = new Set(resolutions.map((r) => r.tool_use_id));
    for (const tu of toolUses) {
      if (!resolvedIds.has(tu.id)) {
        return NextResponse.json(
          { error: `missing resolution for ${tu.id}` },
          { status: 400 },
        );
      }
    }

    const toolResults: StoredContentBlock[] = [];
    for (const tu of toolUses) {
      const resolution = resolutions.find((r) => r.tool_use_id === tu.id)!;
      if (resolution.result === "deny") {
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: `Ladi denied this proposal.${resolution.reason ? ` Reason: ${resolution.reason}` : ""} Do not retry the same action.`,
        });
        continue;
      }
      try {
        const summary = await executeTool(tu.name, tu.input);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: summary });
      } catch (err) {
        const reason = err instanceof Error ? err.message : "unknown error";
        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: `Error: ${reason}`,
          is_error: true,
        });
      }
    }

    await appendCoachMessage({ role: "user", content: toolResults, pending: null });
    await clearCoachPending(pendingMsg.id);
  }

  // 2. Append a new user text message if provided.
  if (userText && userText.trim()) {
    await appendCoachMessage({ role: "user", content: userText, pending: null });
  }

  // 3. Run one model turn.
  const [projects, tasks, history] = await Promise.all([
    listProjects(),
    listTasks(),
    listCoachMessages(40),
  ]);

  const reply = await runCoachTurn({ projects, tasks, history });
  const assistantMsg = await appendCoachMessage({
    role: "assistant",
    content: reply.assistantContent,
    pending: reply.pendingToolUseIds.length > 0 ? reply.pendingToolUseIds : null,
  });

  return NextResponse.json({ message: assistantMsg });
}

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  if (name === "create_task") {
    const projectId = requireString(input, "project_id");
    const title = requireString(input, "title");
    const task = await createTask({
      projectId,
      title,
      notes: optString(input, "notes") ?? "",
      status: "todo",
      priority: ((input.priority as Priority) ?? 2) as Priority,
      scheduledFor: optString(input, "scheduled_for") || null,
      scheduledStart: optString(input, "scheduled_start") || null,
      estimatedMinutes: typeof input.estimated_minutes === "number" ? input.estimated_minutes : 30,
      dueDate: optString(input, "due_date") || null,
    });
    return `Created task ${task.id}: "${task.title}"${task.scheduledFor ? ` for ${task.scheduledFor}` : ""}.`;
  }

  if (name === "update_task") {
    const taskId = requireString(input, "task_id");
    const patch: Partial<Task> = {};
    if (typeof input.title === "string") patch.title = input.title;
    if (typeof input.notes === "string") patch.notes = input.notes;
    if (typeof input.status === "string") patch.status = input.status as TaskStatus;
    if (typeof input.priority === "number") patch.priority = input.priority as Priority;
    if (typeof input.estimated_minutes === "number") patch.estimatedMinutes = input.estimated_minutes;
    if (typeof input.scheduled_for === "string") patch.scheduledFor = input.scheduled_for || null;
    if (typeof input.scheduled_start === "string") patch.scheduledStart = input.scheduled_start || null;
    if (typeof input.due_date === "string") patch.dueDate = input.due_date || null;
    const task = await updateTask(taskId, patch);
    if (!task) throw new Error(`task ${taskId} not found`);
    return `Updated task ${task.id}: "${task.title}" (status=${task.status}).`;
  }

  if (name === "delete_task") {
    const taskId = requireString(input, "task_id");
    await deleteTask(taskId);
    return `Deleted task ${taskId}.`;
  }

  throw new Error(`unknown tool: ${name}`);
}

function requireString(input: Record<string, unknown>, key: string): string {
  const v = input[key];
  if (typeof v !== "string" || !v) throw new Error(`missing required string: ${key}`);
  return v;
}

function optString(input: Record<string, unknown>, key: string): string | undefined {
  const v = input[key];
  return typeof v === "string" ? v : undefined;
}
