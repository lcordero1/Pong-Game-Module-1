import { NextResponse } from "next/server";
import { appendBriefing, latestBriefing, listProjects, listTasks } from "@/lib/store";
import { generateBriefing } from "@/lib/agent";

export async function GET() {
  const briefing = await latestBriefing();
  return NextResponse.json({ briefing });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const hour = new Date().getHours();
  const kind: "morning" | "afternoon" = body.kind ?? (hour < 13 ? "morning" : "afternoon");
  const [projects, tasks] = await Promise.all([listProjects(), listTasks()]);
  const content = await generateBriefing({ projects, tasks, kind });
  const briefing = await appendBriefing({ kind, content });
  return NextResponse.json({ briefing });
}
