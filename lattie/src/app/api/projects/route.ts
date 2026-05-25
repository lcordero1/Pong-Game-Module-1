import { NextResponse } from "next/server";
import { createProject, listProjects } from "@/lib/store";

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  const project = await createProject({
    name: body.name,
    description: body.description ?? "",
    color: body.color ?? "#64748b",
    kind: body.kind ?? "personal",
  });
  return NextResponse.json({ project });
}
