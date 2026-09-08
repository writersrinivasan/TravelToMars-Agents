# Redstone Voyages — Agentic Mars Travel Booking

A Next.js web app that books passenger trips to **Mars** through an **agentic AI** concierge.
The agent is built with **LangGraph**, grounded with **RAG** over a space-travel knowledge base,
and runs on the **Groq API** for fast LLM inference.

The scenario: SpaceX, Roscosmos and others are building Mars-capable spaceships — this is the
"MakeMyTrip / Uber / Ola for space", a travel agency that sells the seat.

---

## Stack

| Concern            | Choice                                                            |
| ------------------ | --------------------------------------------------------------- |
| Framework          | Next.js 14 (App Router, TypeScript)                            |
| Agent framework    | `@langchain/langgraph` — a `StateGraph` agent ⇄ tools loop     |
| LLM                | Groq via `@langchain/groq` (`llama-3.3-70b-versatile`)         |
| RAG                | `MemoryVectorStore` + a dependency-free hashed-embedding class |
| State / memory     | LangGraph `MemorySaver` checkpointer, keyed by `thread_id`     |

---

## Quick start

```bash
npm install
cp .env.local.example .env.local     # then paste your Groq key
npm run dev                          # http://localhost:3000
```

Get a free Groq key at <https://console.groq.com/keys>.

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile   # optional; any tool-calling Groq model
```

---

## How it works

### 1. The agent graph — `lib/agent/graph.ts`

```
START → agent ──(tool calls?)──► tools ──► agent ──► END
```

- **agent** node: `ChatGroq` bound to the tools, prompted by `lib/agent/prompt.ts`.
- **tools** node: LangGraph `ToolNode` executes whatever the model called.
- A conditional edge loops back to `agent` while the model keeps calling tools,
  and ends when it produces a plain answer.
- `MemorySaver` + a per-browser `thread_id` (stored in `localStorage`) give the
  agent conversational memory across requests.

### 2. The tools — `lib/agent/tools.ts`

| Tool                     | Purpose                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `search_knowledge_base`  | **RAG** retrieval over the knowledge base (policies, fleet, …)  |
| `check_launch_windows`   | Is the date inside a Hohmann window, or is fast-transit needed? |
| `quote_price`            | Deterministic itemised fare calculation                         |
| `update_booking_details` | Persists each slot (origin, date, pax, class, name, email, …)   |
| `create_booking`         | Validates all required slots + explicit confirmation → ticket   |
| `get_booking`            | Look up a confirmed booking by reference                        |

### 3. RAG — `lib/rag/` + `lib/knowledge/data.ts`

The knowledge base (fleet, launch windows, fares, health rules, training, baggage,
Mars accommodation, cancellation policy, spaceports, safety) is chunked with
`RecursiveCharacterTextSplitter`, embedded, and stored in an in-memory vector store
built once per server process.

Embeddings use a small **offline hashed bag-of-words** class (`lib/rag/embeddings.ts`)
so the demo needs **only the Groq key**. To go fully semantic, swap that class for
`OpenAIEmbeddings` or `HuggingFaceInferenceEmbeddings` in `lib/rag/store.ts`.

### 4. The booking flow

1. User chats: departure spaceport, travel date, destination (**MARS**), passengers, name, email, cabin class.
2. The agent calls `update_booking_details` as it learns each detail — the right-hand panel fills in live.
3. It uses `check_launch_windows` + `quote_price` and cites policy from `search_knowledge_base`.
4. When every required field is set, it summarises the trip and asks you to confirm.
5. On an explicit "yes", `create_booking` issues a **boarding pass** with a `RSV-MARS-XXXXXX` reference.

---

## Routes

- `POST /api/chat` — `{ message, threadId }` → `{ reply, threadId, booking, ticket }`
- `GET /api/bookings` — every confirmed booking in the current server process

---

## Project layout

```
app/
  page.tsx                 UI entry
  layout.tsx  globals.css
  api/chat/route.ts        runs the LangGraph agent
  api/bookings/route.ts    admin list
components/
  Chat.tsx  BookingPanel.tsx  TicketCard.tsx
lib/
  agent/graph.ts           LangGraph StateGraph (agent ⇄ tools)
  agent/tools.ts           the 6 tools (incl. RAG + booking)
  agent/prompt.ts  pricing.ts  launch.ts
  rag/store.ts  rag/embeddings.ts
  knowledge/data.ts        the RAG corpus
  bookings/store.ts        in-memory booking + ticket stores
```

---

## Notes / limitations

- **In-memory state**: `MemorySaver`, `bookingStore` and the vector store live in
  the server process. Fine for local dev and a single instance; use a real
  checkpointer + database for production and multi-instance deploys.
- All spacecraft, prices, launch windows and policies are **fictional** world-building.
- The agent is instructed never to invent prices, policies or windows — they come from tools.
