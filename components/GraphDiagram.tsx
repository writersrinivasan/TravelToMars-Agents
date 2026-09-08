"use client";

/**
 * Static picture of the LangGraph orchestration:
 *   START → agent → (tool_calls?) → tools → agent → … → END
 * The per-query detail (which path each super-step took) is in <RunInspector>.
 */

const TOOLS = [
  "search_knowledge_base  (RAG)",
  "check_launch_windows",
  "quote_price",
  "update_booking_details",
  "create_booking",
  "get_booking",
];

export default function GraphDiagram({
  active,
}: {
  active?: "agent" | "tools" | null;
}) {
  return (
    <div className="card diagram">
      <div className="card-h">
        <h3>Agent graph</h3>
        <span className="status">LangGraph</span>
      </div>

      <svg viewBox="0 0 280 190" role="img" aria-label="LangGraph state graph">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
          </marker>
        </defs>

        {/* START -> agent */}
        <line x1="120" y1="26" x2="120" y2="46" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arrow)" />
        {/* agent -> tools  (left, "tool_calls") */}
        <path d="M84,70 C40,74 40,120 84,124" fill="none" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arrow)" />
        {/* tools -> agent  (inner right, "result") */}
        <path d="M156,124 C196,120 196,74 156,70" fill="none" stroke="var(--muted)" strokeWidth="1.5" markerEnd="url(#arrow)" />
        {/* agent -> END  (outer right, "done") */}
        <path d="M156,58 C244,60 244,168 140,170" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />

        <text x="34" y="99" fontSize="7.5" fill="var(--muted)" textAnchor="middle">tool_calls</text>
        <text x="202" y="99" fontSize="7.5" fill="var(--muted)" textAnchor="middle">result</text>
        <text x="250" y="116" fontSize="7.5" fill="var(--muted)" textAnchor="middle">done</text>

        {/* nodes */}
        <rect x="96" y="12" width="48" height="16" rx="8" fill="rgba(255,255,255,0.06)" stroke="var(--panel-border)" />
        <text x="120" y="23" fontSize="8" fill="var(--text)" textAnchor="middle">START</text>

        <rect x="84" y="48" width="72" height="22" rx="6"
          fill={active === "agent" ? "var(--accent)" : "rgba(124,92,255,0.18)"}
          stroke={active === "agent" ? "var(--accent)" : "var(--panel-border)"} />
        <text x="120" y="62" fontSize="9" fill="var(--text)" textAnchor="middle" fontWeight="600">agent</text>

        <rect x="84" y="112" width="72" height="22" rx="6"
          fill={active === "tools" ? "var(--accent-2)" : "rgba(255,107,74,0.16)"}
          stroke={active === "tools" ? "var(--accent-2)" : "var(--panel-border)"} />
        <text x="120" y="126" fontSize="9" fill="var(--text)" textAnchor="middle" fontWeight="600">tools</text>

        <rect x="100" y="162" width="40" height="16" rx="8" fill="rgba(255,255,255,0.06)" stroke="var(--panel-border)" />
        <text x="120" y="173" fontSize="8" fill="var(--text)" textAnchor="middle">END</text>
      </svg>

      <ul className="tool-legend">
        {TOOLS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="hint">
        <code>ChatGroq</code> on the <b>agent</b> node picks tools; the{" "}
        <code>ToolNode</code> runs them; a conditional edge loops back until the
        model answers. State is checkpointed per <code>thread_id</code>.
      </p>
    </div>
  );
}
