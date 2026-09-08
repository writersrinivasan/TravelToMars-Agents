/**
 * Per-query execution trace collector.
 *
 * The RAG tool records what it retrieved (query + chunks + similarity scores)
 * here, keyed by thread_id. The /api/chat route resets it before a run and
 * drains it afterwards, zipping each retrieval onto its matching graph step so
 * the UI can visualise every query.
 */

export interface RagChunk {
  title: string;
  score: number;
  snippet: string;
}

export interface RagRetrieval {
  query: string;
  at: number;
  chunks: RagChunk[];
}

const g = globalThis as unknown as {
  __rsvRagTrace?: Map<string, RagRetrieval[]>;
};

const store: Map<string, RagRetrieval[]> =
  g.__rsvRagTrace ?? (g.__rsvRagTrace = new Map());

export function resetRagTrace(threadId: string): void {
  store.set(threadId, []);
}

export function recordRetrieval(threadId: string, retrieval: RagRetrieval): void {
  const list = store.get(threadId) ?? [];
  list.push(retrieval);
  store.set(threadId, list);
}

/** Returns the retrievals recorded since the last reset and clears them. */
export function drainRagTrace(threadId: string): RagRetrieval[] {
  const list = store.get(threadId) ?? [];
  store.set(threadId, []);
  return list;
}
