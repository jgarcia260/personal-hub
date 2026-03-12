import { getDatabase } from "./database";
import { getAllNotes } from "./notes";

export interface NoteLink {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Parse [[title]] syntax from note content
 * Returns array of linked note titles
 */
export function parseLinks(content: string): string[] {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const matches = content.matchAll(linkPattern);
  return Array.from(matches).map((m) => m[1].trim().toLowerCase());
}

/**
 * Find notes by title (case-insensitive, partial match)
 */
export async function findNoteByTitle(title: string): Promise<{ id: string; title: string } | null> {
  const notes = await getAllNotes();
  const normalized = title.toLowerCase();
  const exact = notes.find((n) => n.title.toLowerCase() === normalized);
  if (exact) return { id: exact.id, title: exact.title };
  
  // Partial match fallback
  const partial = notes.find((n) => n.title.toLowerCase().includes(normalized));
  return partial ? { id: partial.id, title: partial.title } : null;
}

/**
 * Update links for a note based on its content
 * Removes old links and creates new ones
 */
export async function updateLinksForNote(noteId: string, content: string): Promise<void> {
  const db = await getDatabase();
  
  // Remove existing links from this note
  await db.runAsync("DELETE FROM note_links WHERE source_id = ?", [noteId]);
  
  // Parse new links from content
  const linkedTitles = parseLinks(content);
  if (linkedTitles.length === 0) return;
  
  // Find target notes and create links
  for (const title of linkedTitles) {
    const target = await findNoteByTitle(title);
    if (!target || target.id === noteId) continue; // Skip self-links
    
    const linkId = generateId();
    const now = new Date().toISOString();
    
    try {
      await db.runAsync(
        "INSERT INTO note_links (id, source_id, target_id, created_at) VALUES (?, ?, ?, ?)",
        [linkId, noteId, target.id, now]
      );
    } catch (error) {
      // Link might already exist (UNIQUE constraint)
      console.warn("Link already exists:", error);
    }
  }
}

/**
 * Get all links FROM a note (outgoing)
 */
export async function getOutgoingLinks(noteId: string): Promise<{ id: string; title: string }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT n.id, n.title
     FROM note_links l
     JOIN notes n ON l.target_id = n.id
     WHERE l.source_id = ?
     ORDER BY l.created_at DESC`,
    [noteId]
  );
  return rows as { id: string; title: string }[];
}

/**
 * Get all links TO a note (incoming/backlinks)
 */
export async function getBacklinks(noteId: string): Promise<{ id: string; title: string }[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    `SELECT n.id, n.title
     FROM note_links l
     JOIN notes n ON l.source_id = n.id
     WHERE l.target_id = ?
     ORDER BY l.created_at DESC`,
    [noteId]
  );
  return rows as { id: string; title: string }[];
}
