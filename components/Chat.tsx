"use client";

import { useEffect, useRef, useState } from "react";
import BookingPanel from "./BookingPanel";
import TicketCard from "./TicketCard";

type Role = "user" | "assistant";
interface Message {
  role: Role;
  content: string;
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

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply || "(no response)" },
      ]);
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
              <div key={i} className={`bubble ${m.role}`}>
                {m.content.split("\n").map((line, j) => (
                  <p key={j}>{line || " "}</p>
                ))}
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
          <BookingPanel booking={booking} />
          {ticket ? <TicketCard ticket={ticket as never} /> : null}
          <p className="hint">
            The agent fills this panel as your conversation progresses. Once every
            required detail is set and you confirm, it issues a boarding pass.
          </p>
        </aside>
      </main>
    </div>
  );
}
