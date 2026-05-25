import { NextResponse } from "next/server";
import {
  appendCoachMessage,
  clearCoachMessages,
  listCoachMessages,
  listProjects,
  listTasks,
} from "@/lib/store";
import { streamCoachReply } from "@/lib/agent";

export async function GET() {
  const messages = await listCoachMessages();
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 400 });
  }
  const body = await req.json();
  const userText: string = body.message;
  if (!userText?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const [projects, tasks, history] = await Promise.all([
    listProjects(),
    listTasks(),
    listCoachMessages(20),
  ]);

  await appendCoachMessage({ role: "user", content: userText });

  const stream = await streamCoachReply({ projects, tasks, history, userMessage: userText });

  // Tee the stream so we can collect for persistence while streaming to the client.
  let collected = "";
  const [forClient, forPersist] = stream.tee();
  (async () => {
    const reader = forPersist.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        collected += decoder.decode(value, { stream: true });
      }
      collected += decoder.decode();
      if (collected.trim()) {
        await appendCoachMessage({ role: "assistant", content: collected });
      }
    } catch {
      // ignore — client side gets the error
    }
  })();

  return new Response(forClient, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE() {
  await clearCoachMessages();
  return NextResponse.json({ ok: true });
}
