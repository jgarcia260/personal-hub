/**
 * Embeddings Database Layer
 * Tracks sync status between notes and vector store
 */

import { getDatabase } from "./database";
import { getAllNotes, getNote } from "./notes";
import { generateEmbedding, generateContentHash } from "../services/embeddings";
import {
  upsertVectors,
  deleteVectors,
  getPineconeId,
  type VectorMetadata,
} from "../services/vectorStore";

export interface EmbeddingRecord {
  noteId: string;
  pineconeId: string;
  embeddingModel: string;
  syncedAt: string;
  contentHash: string;
}

/**
 * Initialize embeddings table
 * Called during database setup
 */
export async function initEmbeddingsTable(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS embeddings (
      note_id TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
      pinecone_id TEXT NOT NULL,
      embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
      synced_at TEXT NOT NULL,
      content_hash TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_embeddings_synced ON embeddings(synced_at);
  `);
}

/**
 * Check if note needs embedding update
 * Compares content hash to detect changes
 */
export async function needsEmbeddingUpdate(
  noteId: string,
  title: string,
  content: string
): Promise<boolean> {
  const db = await getDatabase();
  const record = await db.getFirstAsync(
    "SELECT content_hash FROM embeddings WHERE note_id = ?",
    [noteId]
  ) as { content_hash: string } | null;

  if (!record) return true; // Not synced yet

  const currentHash = generateContentHash(title, content);
  return record.content_hash !== currentHash;
}

/**
 * Sync note embedding to vector store
 * Generates embedding and upserts to Pinecone
 */
export async function syncNoteEmbedding(noteId: string): Promise<void> {
  const note = await getNote(noteId);
  if (!note) {
    throw new Error(`Note ${noteId} not found`);
  }

  // Skip very short notes (not enough content for meaningful embeddings)
  if (note.content.length < 50) {
    console.log(`Skipping embedding for short note ${noteId}`);
    return;
  }

  // Check if update needed
  const needsUpdate = await needsEmbeddingUpdate(
    noteId,
    note.title,
    note.content
  );

  if (!needsUpdate) {
    console.log(`Note ${noteId} embedding already up to date`);
    return;
  }

  try {
    // Generate embedding
    const { embedding, model } = await generateEmbedding(
      note.title,
      note.content
    );

    // Upsert to Pinecone
    const pineconeId = getPineconeId(noteId);
    const metadata: VectorMetadata = {
      noteId,
      title: note.title,
      updatedAt: note.updatedAt,
    };

    await upsertVectors([
      {
        id: pineconeId,
        values: embedding,
        metadata,
      },
    ]);

    // Update local tracking
    const db = await getDatabase();
    const now = new Date().toISOString();
    const contentHash = generateContentHash(note.title, note.content);

    await db.runAsync(
      `INSERT OR REPLACE INTO embeddings 
       (note_id, pinecone_id, embedding_model, synced_at, content_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [noteId, pineconeId, model, now, contentHash]
    );

    console.log(`Synced embedding for note ${noteId} (${note.title})`);
  } catch (error) {
    console.error(`Failed to sync embedding for note ${noteId}:`, error);
    throw error;
  }
}

/**
 * Delete note embedding from vector store
 * Called when note is deleted
 */
export async function deleteNoteEmbedding(noteId: string): Promise<void> {
  try {
    const db = await getDatabase();
    const record = await db.getFirstAsync(
      "SELECT pinecone_id FROM embeddings WHERE note_id = ?",
      [noteId]
    ) as { pinecone_id: string } | null;

    if (record) {
      await deleteVectors([record.pinecone_id]);
      await db.runAsync("DELETE FROM embeddings WHERE note_id = ?", [noteId]);
      console.log(`Deleted embedding for note ${noteId}`);
    }
  } catch (error) {
    console.error(`Failed to delete embedding for note ${noteId}:`, error);
    // Don't throw - note deletion should succeed even if vector cleanup fails
  }
}

/**
 * Bulk sync all notes
 * Useful for initial setup or re-indexing
 */
export async function syncAllNotes(
  onProgress?: (current: number, total: number) => void
): Promise<{ synced: number; skipped: number; failed: number }> {
  const notes = await getAllNotes();
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    onProgress?.(i + 1, notes.length);

    try {
      if (note.content.length < 50) {
        skipped++;
        continue;
      }

      await syncNoteEmbedding(note.id);
      synced++;
    } catch (error) {
      console.error(`Failed to sync note ${note.id}:`, error);
      failed++;
    }
  }

  return { synced, skipped, failed };
}

/**
 * Get sync statistics
 */
export async function getEmbeddingStats(): Promise<{
  totalNotes: number;
  syncedNotes: number;
  pendingNotes: number;
}> {
  const db = await getDatabase();

  const totalNotes = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM notes"
  ) as { count: number }).count;

  const syncedNotes = (await db.getFirstAsync(
    "SELECT COUNT(*) as count FROM embeddings"
  ) as { count: number }).count;

  return {
    totalNotes,
    syncedNotes,
    pendingNotes: totalNotes - syncedNotes,
  };
}
