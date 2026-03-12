import { getDatabase } from "./database";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

function generateId(): string {
  // Timestamp + random for collision resistance
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 11);
  const random2 = Math.random().toString(36).slice(2, 6);
  return `${timestamp}-${random}-${random2}`;
}

interface NoteRow {
  id: string;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

function rowToNote(row: unknown): Note {
  const r = row as NoteRow;
  let tags: string[] = [];
  
  try {
    tags = JSON.parse(r.tags || "[]");
    // Validate it's actually an array of strings
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === "string")) {
      console.warn(`Invalid tags for note ${r.id}, resetting to empty`);
      tags = [];
    }
  } catch (error) {
    console.error(`Failed to parse tags for note ${r.id}:`, error);
    tags = [];
  }
  
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    tags,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function createNote(content: string, title?: string, tags?: string[]): Promise<Note> {
  if (!content || content.trim().length === 0) {
    throw new Error("Note content cannot be empty");
  }

  const db = await getDatabase();
  const id = generateId();
  const noteTitle = (title || content.split("\n")[0].slice(0, 100) || "Untitled").trim();
  const now = new Date().toISOString();
  const noteTags = tags || [];

  try {
    await db.runAsync(
      "INSERT INTO notes (id, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, noteTitle, content.trim(), JSON.stringify(noteTags), now, now]
    );
  } catch (error) {
    console.error("Failed to create note:", error);
    throw new Error("Failed to save note");
  }

  return { id, title: noteTitle, content: content.trim(), tags: noteTags, createdAt: now, updatedAt: now };
}

export async function updateNote(
  id: string,
  updates: { title?: string; content?: string; tags?: string[] }
): Promise<void> {
  if (!id) {
    throw new Error("Note ID is required");
  }

  // Validate inputs
  if (updates.title !== undefined && updates.title.trim().length === 0) {
    throw new Error("Note title cannot be empty");
  }
  if (updates.content !== undefined && updates.content.trim().length === 0) {
    throw new Error("Note content cannot be empty");
  }

  const db = await getDatabase();
  const now = new Date().toISOString();
  const sets: string[] = ["updated_at = ?"];
  const values: any[] = [now];

  if (updates.title !== undefined) {
    sets.push("title = ?");
    values.push(updates.title.trim());
  }
  if (updates.content !== undefined) {
    sets.push("content = ?");
    values.push(updates.content.trim());
  }
  if (updates.tags !== undefined) {
    sets.push("tags = ?");
    values.push(JSON.stringify(updates.tags));
  }

  values.push(id);

  try {
    const result = await db.runAsync(`UPDATE notes SET ${sets.join(", ")} WHERE id = ?`, values);
    if (result.changes === 0) {
      throw new Error("Note not found");
    }
  } catch (error) {
    console.error(`Failed to update note ${id}:`, error);
    throw new Error("Failed to update note");
  }
}

export async function deleteNote(id: string): Promise<void> {
  if (!id) {
    throw new Error("Note ID is required");
  }

  const db = await getDatabase();
  
  try {
    const result = await db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
    if (result.changes === 0) {
      throw new Error("Note not found");
    }
  } catch (error) {
    console.error(`Failed to delete note ${id}:`, error);
    throw new Error("Failed to delete note");
  }
}

export async function getNote(id: string): Promise<Note | null> {
  if (!id) {
    return null;
  }

  const db = await getDatabase();
  
  try {
    const row = await db.getFirstAsync("SELECT * FROM notes WHERE id = ?", [id]);
    return row ? rowToNote(row) : null;
  } catch (error) {
    console.error(`Failed to get note ${id}:`, error);
    return null;
  }
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDatabase();
  
  try {
    const rows = await db.getAllAsync("SELECT * FROM notes ORDER BY updated_at DESC");
    return rows.map(rowToNote);
  } catch (error) {
    console.error("Failed to get all notes:", error);
    return [];
  }
}

export async function searchNotes(query: string): Promise<Note[]> {
  if (!query || query.trim().length === 0) {
    return getAllNotes();
  }

  const db = await getDatabase();
  
  try {
    // Use FTS for fast full-text search
    const rows = await db.getAllAsync(
      `SELECT n.* FROM notes n
       JOIN notes_fts fts ON n.rowid = fts.rowid
       WHERE notes_fts MATCH ?
       ORDER BY n.updated_at DESC`,
      [query.trim()]
    );
    return rows.map(rowToNote);
  } catch (error) {
    // Fallback to LIKE if FTS fails (e.g., special characters)
    console.warn("FTS search failed, falling back to LIKE:", error);
    const pattern = `%${query.trim()}%`;
    const rows = await db.getAllAsync(
      "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC",
      [pattern, pattern]
    );
    return rows.map(rowToNote);
  }
}
