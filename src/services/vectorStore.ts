/**
 * Pinecone Vector Store Service
 * Handles vector storage and similarity search
 */

const PINECONE_API_KEY = process.env.EXPO_PUBLIC_PINECONE_API_KEY;
const PINECONE_INDEX_URL = process.env.EXPO_PUBLIC_PINECONE_INDEX_URL;

export interface VectorMetadata {
  noteId: string;
  title: string;
  updatedAt: string;
}

export interface SimilarNote {
  noteId: string;
  title: string;
  score: number; // Similarity score (0-1)
}

export interface UpsertRequest {
  id: string; // Pinecone vector ID
  values: number[]; // Embedding vector
  metadata: VectorMetadata;
}

/**
 * Upsert vectors to Pinecone
 * Creates or updates embeddings
 */
export async function upsertVectors(vectors: UpsertRequest[]): Promise<void> {
  if (!PINECONE_API_KEY || !PINECONE_INDEX_URL) {
    throw new Error("Pinecone credentials not configured");
  }

  if (vectors.length === 0) return;

  try {
    const response = await fetch(`${PINECONE_INDEX_URL}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PINECONE_API_KEY,
      },
      body: JSON.stringify({
        vectors,
        namespace: "", // Default namespace
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinecone upsert error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log(`Upserted ${result.upsertedCount} vectors to Pinecone`);
  } catch (error) {
    console.error("Failed to upsert vectors:", error);
    throw error;
  }
}

/**
 * Query Pinecone for similar vectors
 * Returns top-k most similar notes
 */
export async function querySimilarNotes(
  embedding: number[],
  topK: number = 5,
  minScore: number = 0.7,
  excludeIds: string[] = []
): Promise<SimilarNote[]> {
  if (!PINECONE_API_KEY || !PINECONE_INDEX_URL) {
    throw new Error("Pinecone credentials not configured");
  }

  try {
    const response = await fetch(`${PINECONE_INDEX_URL}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PINECONE_API_KEY,
      },
      body: JSON.stringify({
        vector: embedding,
        topK: topK + excludeIds.length, // Request extra to account for filtering
        includeMetadata: true,
        namespace: "",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinecone query error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Filter and transform results
    const results: SimilarNote[] = data.matches
      .filter((match: any) => {
        // Filter out low scores and excluded IDs
        return (
          match.score >= minScore &&
          !excludeIds.includes(match.metadata?.noteId)
        );
      })
      .slice(0, topK) // Limit to requested topK after filtering
      .map((match: any) => ({
        noteId: match.metadata.noteId,
        title: match.metadata.title,
        score: match.score,
      }));

    return results;
  } catch (error) {
    console.error("Failed to query similar notes:", error);
    throw error;
  }
}

/**
 * Delete vectors from Pinecone
 * Called when notes are deleted
 */
export async function deleteVectors(ids: string[]): Promise<void> {
  if (!PINECONE_API_KEY || !PINECONE_INDEX_URL) {
    throw new Error("Pinecone credentials not configured");
  }

  if (ids.length === 0) return;

  try {
    const response = await fetch(`${PINECONE_INDEX_URL}/vectors/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PINECONE_API_KEY,
      },
      body: JSON.stringify({
        ids,
        namespace: "",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinecone delete error: ${response.status} - ${error}`);
    }

    console.log(`Deleted ${ids.length} vectors from Pinecone`);
  } catch (error) {
    console.error("Failed to delete vectors:", error);
    throw error;
  }
}

/**
 * Generate Pinecone vector ID from note ID
 * Ensures consistent mapping
 */
export function getPineconeId(noteId: string): string {
  return `note-${noteId}`;
}
