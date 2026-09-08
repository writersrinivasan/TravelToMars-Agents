"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BookingPanel from "./BookingPanel";
import TicketCard from "./TicketCard";
import GraphDiagram from "./GraphDiagram";
import RunInspector, { type Trace } from "./RunInspector";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
  trace?: Trace;
}

const WELCOME =
  "Welcome aboard Redstone Voyages — Earth's first travel agency for trips to Mars. \n\nI can book your seat to Olympus Base and answer questions about launch windows, fares, pre-flight training, health rules and baggage. \n\nWhere on Earth would you like to depart from, and roughly when do you want to travel?";

const SUGGESTIONS = [
  "I want to fly to Mars from Boca Chica in November 2026",
  "What are the health requirements?",
  "How much is a one-way business ticket for 2 people?",
  "What's the cancellation policy?",
];

export default function Chat() {
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Record<string, unknown>>({});
  const [ticket, setTicket] = useState<Record<string, unknown> | null>(null);
  const [openTraces, setOpenTraces] = useState<Record<number, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let id = "";
    try {
      id = localStorage.getItem("rsv_thread") ?? "";
    } catch {
      /* ignore */
    }
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      try {
        localStorage.setItem("rsv_thread", id);
      } catch {
        /* ignore */
      }
    }
    setThreadId(id);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading || !threadId) return;

    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, threadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Request failed");

      setMessages((m) => {
        const next: Message[] = [
          ...m,
          {
            role: "assistant",
            content: data.reply || "(no response)",
            trace: data.trace as Trace | undefined,
          },
        ];
        // auto-open the inspector for this newest reply
        if (data.trace) setOpenTraces((o) => ({ ...o, [next.length - 1]: true }));
        return next;
      });
      setBooking(data.booking ?? {});
      setTicket(data.ticket ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `t_${Date.now()}`;
    try {
      localStorage.setItem("rsv_thread", id);
    } catch {
      /* ignore */
    }
    setThreadId(id);
    setMessages([{ role: "assistant", content: WELCOME }]);
    setBooking({});
    setTicket(null);
    setError(null);
    setOpenTraces({});
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">▲</span>
          <div className="brand-text">
            <strong>Redstone Voyages</strong>
            <span className="tag">Mars travel booking</span>
          </div>
        </div>
        <div className="stack">
          <span className="pill">LangGraph agent</span>
          <span className="pill">RAG</span>
          <span className="pill">Groq</span>
          <button className="ghost" onClick={reset}>
            New trip
          </button>
        </div>
      </header>

      <main className="grid">
        <section className="chat">
          <div className="messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className="msg-row">
                <div className={`bubble ${m.role}`}>
                  {m.role === "assistant" ? (
                    <div className="md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    m.content.split("\n").map((line, j) => (
                      <p key={j}>{line || " "}</p>
                    ))
                  )}
                </div>

                {m.trace && (
                  <div className="trace-wrap">
                    <button
                      className="trace-toggle"
                      onClick={() =>
                        setOpenTraces((o) => ({ ...o, [i]: !o[i] }))
                      }
                    >
                      {openTraces[i] ? "▾" : "▸"} run inspector ·{" "}
                      {m.trace.cycles} cycle{m.trace.cycles === 1 ? "" : "s"},{" "}
                      {m.trace.toolCalls} tool call
                      {m.trace.toolCalls === 1 ? "" : "s"}, {m.trace.totalMs} ms
                    </button>
                    {openTraces[i] && <RunInspector trace={m.trace} />}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="bubble assistant typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} disabled={loading}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div className="composer">
            <textarea
              value={input}
              placeholder="Type your message…  (Enter to send, Shift+Enter for a new line)"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={2}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </div>
        </section>

        <aside className="side">
          <GraphDiagram />
          <BookingPanel booking={booking} />
          {ticket ? <TicketCard ticket={ticket as never} /> : null}
          <p className="hint">
            Expand <b>run inspector</b> under any reply to see the exact graph
            path, tool calls and RAG chunks (with similarity scores) for that
            query.
          </p>
        </aside>
      </main>
    </div>
  );
}
