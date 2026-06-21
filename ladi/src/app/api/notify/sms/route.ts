import { NextResponse } from "next/server";
import { sendSms } from "@/lib/sms";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.text !== "string" || !body.text.trim()) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  const result = await sendSms(body.text, body.to);
  return NextResponse.json(result);
}
