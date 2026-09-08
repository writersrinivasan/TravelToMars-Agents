import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { HumanMessage } from "@langchain/core/messages";

import { getGraph } from "@/lib/agent/graph";
import { bookingStore, ticketStore } from "@/lib/bookings/store";
import { resetRagTrace, drainRagTrace, type RagRetrieval } from "@/lib/agent/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Step =
  | { kind: "decide"; node: string; ms: number; toolCalls: { name: string; args: unknown }[] }
  | { kind: "tool"; node: string; ms: number; name: string; chars: number; retrieval?: RagRetrieval | null }
  | { kind: "answer"; node: string; ms: number; chars: number; tokens: Record<string, number> | null };

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
    resetRagTrace(threadId);

    const t0 = Date.now();
    let lastTs = t0;
    const steps: Step[] = [];

    // streamMode "updates" yields one object per graph super-step:
    //   { <nodeName>: { messages: [...] } }
    const stream = await graph.stream(
      { messages: [new HumanMessage(message)] },
      { configurable: { thread_id: threadId }, recursionLimit: 24, streamMode: "updates" },
    );

    for await (const update of stream as AsyncIterable<Record<string, { messages?: unknown[] }>>) {
      for (const [node, payload] of Object.entries(update)) {
        const now = Date.now();
        const msgs = (payload?.messages ?? []) as any[];
        for (const m of msgs) {
          const type = typeof m?._getType === "function" ? m._getType() : "";
          if (type === "ai") {
            const toolCalls = (m.tool_calls ?? []).map((c: any) => ({
              name: c.name,
              args: c.args,
            }));
            if (toolCalls.length > 0) {
              steps.push({ kind: "decide", node, ms: now - lastTs, toolCalls });
            } else {
              const content =
                typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? "");
              steps.push({
                kind: "answer",
                node,
                ms: now - lastTs,
                chars: content.length,
                tokens: m.usage_metadata ?? null,
              });
            }
          } else if (type === "tool") {
            steps.push({
              kind: "tool",
              node,
              ms: now - lastTs,
              name: String(m.name ?? "tool"),
              chars: String(m.content ?? "").length,
            });
          }
        }
        lastTs = now;
      }
    }

    // Zip recorded RAG retrievals onto their matching search_knowledge_base steps.
    const retrievals = drainRagTrace(threadId);
    let ri = 0;
    for (const step of steps) {
      if (step.kind === "tool" && step.name === "search_knowledge_base") {
        step.retrieval = retrievals[ri++] ?? null;
      }
    }

    // The final reply comes from the checkpointed thread state (authoritative).
    const state = await graph.getState({ configurable: { thread_id: threadId } });
    const last = state.values.messages.at(-1);
    const reply =
      typeof last?.content === "string" ? last.content : JSON.stringify(last?.content ?? "");

    return NextResponse.json({
      reply,
      threadId,
      booking: bookingStore.get(threadId) ?? {},
      ticket: ticketStore.get(threadId) ?? null,
      trace: {
        steps,
        totalMs: Date.now() - t0,
        cycles: steps.filter((s) => s.kind === "decide").length,
        toolCalls: steps.filter((s) => s.kind === "tool").length,
        messageCount: state.values.messages.length,
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
      },
    });
  } catch (err) {
    console.error("[/api/chat] agent error:", err);
    const messageText = err instanceof Error ? err.message : "Agent error.";
    return NextResponse.json({ error: messageText }, { status: 500 });
  }
}
