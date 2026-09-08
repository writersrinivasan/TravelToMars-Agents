import {
  StateGraph,
  MessagesAnnotation,
  MemorySaver,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, SystemMessage } from "@langchain/core/messages";

import { tools } from "./tools";
import { SYSTEM_PROMPT } from "./prompt";

type CompiledGraph = ReturnType<typeof buildGraph>;

const g = globalThis as unknown as { __rsvGraph?: CompiledGraph };

function buildGraph() {
  const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    temperature: 0.2,
    maxRetries: 2,
  }).bindTools(tools);

  const toolNode = new ToolNode(tools);

  async function callModel(state: typeof MessagesAnnotation.State) {
    const response = await model.invoke([
      new SystemMessage(SYSTEM_PROMPT),
      ...state.messages,
    ]);
    return { messages: [response] };
  }

  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    if (last?.tool_calls && last.tool_calls.length > 0) return "tools";
    return END;
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue, ["tools", END])
    .addEdge("tools", "agent");

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
