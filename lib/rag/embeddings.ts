import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings";

/**
 * A dependency-free, offline embedding: a hashed bag-of-words (plus bigram)
 * vector, L2-normalised so cosine similarity in MemoryVectorStore behaves like
 * lexical relevance. Good enough for a demo knowledge base and needs no second
 * API key.
 *
 * To use real semantic embeddings, swap this class for e.g.
 *   import { OpenAIEmbeddings } from "@langchain/openai";
 *   import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
 * and update lib/rag/store.ts.
 */
export class HashingEmbeddings extends Embeddings {
  private readonly dims: number;

  constructor(params?: EmbeddingsParams & { dims?: number }) {
    super(params ?? {});
    this.dims = params?.dims ?? 768;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    return texts.map((t) => this.vectorize(t));
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.vectorize(text);
  }

  private vectorize(text: string): number[] {
    const vec = new Array<number>(this.dims).fill(0);
    const tokens = text.toLowerCase().match(/[a-z0-9]{2,}/g) ?? [];

    for (const token of tokens) {
      vec[this.hash(token) % this.dims] += 1;
    }
    for (let i = 0; i < tokens.length - 1; i++) {
      vec[this.hash(`${tokens[i]}_${tokens[i + 1]}`) % this.dims] += 0.5;
    }

    const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0)) || 1;
    return vec.map((x) => x / norm);
  }

  // FNV-1a
  private hash(str: string): number {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
}
