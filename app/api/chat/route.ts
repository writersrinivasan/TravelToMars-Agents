import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { HumanMessage } from "@langchain/core/messages";

import { getGraph } from "@/lib/agent/graph";
import { bookingStore, ticketStore } from "@/lib/bookings/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        error:
          "GROQ_API_KEY is not set. Copy .env.local.example to .env.local, add your Groq key, and restart the dev server.",
      },
      { status: 500 },
    );
  }

  let body: { message?: unknown; threadId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = String(body?.message ?? "").trim();
  const threadId = String(body?.threadId ?? "") || randomUUID();

  if (!message) {
    return NextResponse.json({ error: "`message` is required." }, { status: 400 });
  }

  try {
    const graph = getGraph();
    const result = await graph.invoke(
      { messages: [new HumanMessage(message)] },
      { configurable: { thread_id: threadId }, recursionLimit: 24 },
    );

    const last = result.messages[result.messages.length - 1];
    const reply =
      typeof last?.content === "string"
        ? last.content
        : JSON.stringify(last?.content ?? "");

    return NextResponse.json({
      reply,
      threadId,
      booking: bookingStore.get(threadId) ?? {},
      ticket: ticketStore.get(threadId) ?? null,
    });
  } catch (err) {
    console.error("[/api/chat] agent error:", err);
    const messageText = err instanceof Error ? err.message : "Agent error.";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
