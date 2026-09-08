import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";

import { tools } from "./tools";
import { SYSTEM_PROMPT } from "./prompt";

type CompiledGraph = ReturnType<typeof buildGraph>;

const g = globalThis as unknown as { __rsvGraph?: CompiledGraph };

// Max agent→tools round-trips per user turn before we force a plain answer.
const MAX_TOOL_ROUNDS = 4;
// Only send the tail of the conversation to the model (keeps tokens bounded).
const HISTORY_WINDOW = 14;

function windowed(messages: BaseMessage[]): BaseMessage[] {
  return messages.length <= HISTORY_WINDOW
    ? messages
    : messages.slice(-HISTORY_WINDOW);
}

/** Count agent tool-call rounds since the last human message. */
function toolRoundsThisTurn(messages: BaseMessage[]): number {
  let rounds = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m instanceof HumanMessage) break;
    if (m instanceof AIMessage && (m.tool_calls?.length ?? 0) > 0) rounds++;
  }
  return rounds;
}

function buildGraph() {
  const modelName = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
  const base = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: modelName,
    temperature: 0.2,
    maxTokens: 1400,
    // Groq's free tier has a low tokens-per-minute ceiling; it returns 429 with
    // a short retry-after that the client honours. Give it room to back off.
    maxRetries: 6,
  });
  const model = base.bindTools(tools);
  const toolNode = new ToolNode(tools);

  async function callModel(state: typeof MessagesAnnotation.State) {
    const response = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      ...windowed(state.messages),
    ]);
    return { messages: [response] };
  }

  // Called once the tool budget is spent: no tools bound, so it must answer.
  async function finalize(state: typeof MessagesAnnotation.State) {
    const response = await base.invoke([
      new SystemMessage(
        `${SYSTEM_PROMPT}\n\nYou have gathered enough tool results. Answer the traveller now in plain prose. Do not ask to call more tools.`,
      ),
      ...windowed(state.messages),
    ]);
    return { messages: [response] };
  }

  function route(state: typeof MessagesAnnotation.State) {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    const wantsTools = (last?.tool_calls?.length ?? 0) > 0;
    if (!wantsTools) return END;
    return toolRoundsThisTurn(state.messages) > MAX_TOOL_ROUNDS ? "finalize" : "tools";
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addNode("finalize", finalize)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", route, ["tools", "finalize", END])
    .addEdge("tools", "agent")
    .addEdge("finalize", END);

  // MemorySaver keeps per-thread conversation state in memory for this process.
  // Swap for a SqliteSaver / PostgresSaver checkpointer in production.
  return workflow.compile({ checkpointer: new MemorySaver() });
}

/** The agentic LangGraph booking agent, compiled once per server process. */
export function getGraph(): CompiledGraph {
  if (!g.__rsvGraph) {
    g.__rsvGraph = buildGraph();
  }
  return g.__rsvGraph;
}
