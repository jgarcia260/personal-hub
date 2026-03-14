/**
 * OpenAI Embeddings Service
 * Generates vector embeddings for note content using text-embedding-3-small
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate embedding for text content
 * Combines title and content for better semantic representation
 */
export async function generateEmbedding(
  title: string,
  content: string
): Promise<EmbeddingResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("EXPO_PUBLIC_OPENAI_API_KEY not configured");
  }

  // Combine title and content with weights
  // Title is more important for matching, so repeat it
  const text = `${title}\n\n${title}\n\n${content}`.trim();

  if (!text) {
    throw new Error("Cannot generate embedding for empty text");
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      embedding: data.data[0].embedding,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        totalTokens: data.usage.total_tokens,
      },
    };
  } catch (error) {
    console.error("Failed to generate embedding:", error);
    throw error;
  }
}

/**
 * Generate content hash for change detection
 * Only re-embed when content actually changes
 */
export function generateContentHash(title: string, content: string): string {
  const text = `${title}::${content}`;
  // Simple hash function (FNV-1a)
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Calculate cosine similarity between two vectors
 * Used for in-memory similarity when needed
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
