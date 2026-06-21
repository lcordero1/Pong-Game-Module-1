import { NextResponse } from "next/server";
import { createTask, listTasks } from "@/lib/store";
import type { Priority, TaskStatus } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId") ?? undefined;
  const tasks = await listTasks(projectId ? { projectId } : undefined);
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.projectId || !body.title) {
    return NextResponse.json({ error: "projectId and title required" }, { status: 400 });
  }
  const task = await createTask({
    projectId: body.projectId,
    title: body.title,
    notes: body.notes ?? "",
    status: (body.status as TaskStatus) ?? "todo",
    priority: (body.priority as Priority) ?? 2,
    scheduledFor: body.scheduledFor ?? null,
    scheduledStart: body.scheduledStart ?? null,
    estimatedMinutes: body.estimatedMinutes ?? 30,
    dueDate: body.dueDate ?? null,
  });
  return NextResponse.json({ task });
}
