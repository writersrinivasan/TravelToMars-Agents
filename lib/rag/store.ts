import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HashingEmbeddings } from "./embeddings";
import { KNOWLEDGE_BASE } from "../knowledge/data";

const g = globalThis as unknown as {
  __rsvVectorStore?: Promise<MemoryVectorStore>;
};

async function buildVectorStore(): Promise<MemoryVectorStore> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 700,
    chunkOverlap: 120,
  });

  // Prepend the document title to every chunk ("contextual chunk header") so
  // title terms are part of what gets embedded and retrieved.
  const docs = await splitter.createDocuments(
    KNOWLEDGE_BASE.map((d) => `# ${d.title}\n${d.content}`),
    KNOWLEDGE_BASE.map((d) => ({ title: d.title })),
  );

  return MemoryVectorStore.fromDocuments(docs, new HashingEmbeddings());
}

/** Lazily builds the RAG index once per server process. */
export function getVectorStore(): Promise<MemoryVectorStore> {
  if (!g.__rsvVectorStore) {
    g.__rsvVectorStore = buildVectorStore();
  }
  return g.__rsvVectorStore;
}
