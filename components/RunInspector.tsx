"use client";

interface RagChunk {
  title: string;
  score: number;
  snippet: string;
}
interface RagRetrieval {
  query: string;
  chunks: RagChunk[];
}
type Step =
  | { kind: "decide"; node: string; ms: number; toolCalls: { name: string; args: unknown }[] }
  | { kind: "tool"; node: string; ms: number; name: string; chars: number; retrieval?: RagRetrieval | null }
  | { kind: "answer"; node: string; ms: number; chars: number; tokens: Record<string, number> | null };

export interface Trace {
  steps: Step[];
  totalMs: number;
  cycles: number;
  toolCalls: number;
  messageCount: number;
  model: string;
}

function argPreview(args: unknown): string {
  if (!args || typeof args !== "object") return "";
  const entries = Object.entries(args as Record<string, unknown>);
  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
    .join(", ");
}

export default function RunInspector({ trace }: { trace: Trace }) {
  return (
    <div className="inspector">
      <div className="insp-head">
        <span>
          <b>{trace.cycles}</b> agent–tool {trace.cycles === 1 ? "cycle" : "cycles"} ·{" "}
          <b>{trace.toolCalls}</b> tool {trace.toolCalls === 1 ? "call" : "calls"} ·{" "}
          <b>{trace.totalMs}</b> ms
        </span>
        <span className="insp-model">{trace.model}</span>
      </div>

      <ol className="timeline">
        {trace.steps.map((step, i) => {
          if (step.kind === "decide") {
            return (
              <li key={i} className="tl-step agent">
                <span className="tl-dot" />
                <div className="tl-body">
                  <div className="tl-title">
                    <span className="tl-node">agent</span> decided to call
                    <span className="tl-ms">{step.ms} ms</span>
                  </div>
                  <div className="chips">
                    {step.toolCalls.map((c, j) => (
                      <span key={j} className="chip">
                        {c.name}
                        {argPreview(c.args) && (
                          <em>({argPreview(c.args)})</em>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            );
          }

          if (step.kind === "tool") {
            return (
              <li key={i} className="tl-step tool">
                <span className="tl-dot" />
                <div className="tl-body">
                  <div className="tl-title">
                    <span className="tl-node">tools</span> ran{" "}
                    <code>{step.name}</code>
                    <span className="tl-ms">{step.chars} chars · {step.ms} ms</span>
                  </div>

                  {step.retrieval && (
                    <div className="rag">
                      <div className="rag-q">
                        RAG query: <span>&ldquo;{step.retrieval.query}&rdquo;</span>
                      </div>
                      {step.retrieval.chunks.map((c, j) => (
                        <div key={j} className="rag-chunk">
                          <div className="rag-chunk-h">
                            <span className="rag-title">{c.title}</span>
                            <span className="rag-score">{c.score.toFixed(3)}</span>
                          </div>
                          <div className="score-bar">
                            <span
                              style={{
                                width: `${Math.max(4, Math.min(100, c.score * 100))}%`,
                              }}
                            />
                          </div>
                          <p className="rag-snip">{c.snippet}…</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          }

          return (
            <li key={i} className="tl-step answer">
              <span className="tl-dot" />
              <div className="tl-body">
                <div className="tl-title">
                  <span className="tl-node">{step.node}</span> produced the answer
                  <span className="tl-ms">
                    {step.chars} chars
                    {step.tokens?.total_tokens
                      ? ` · ${step.tokens.total_tokens} tok`
                      : ""}{" "}
                    · {step.ms} ms
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
