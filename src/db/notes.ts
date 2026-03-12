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
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function rowToNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: JSON.parse(row.tags || "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createNote(content: string, title?: string, tags?: string[]): Promise<Note> {
  const db = await getDatabase();
  const id = generateId();
  const noteTitle = title || content.split("\n")[0].slice(0, 100) || "Untitled";
  const now = new Date().toISOString();
  const noteTags = tags || [];

  await db.runAsync(
    "INSERT INTO notes (id, title, content, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    [id, noteTitle, content, JSON.stringify(noteTags), now, now]
  );

  return { id, title: noteTitle, content, tags: noteTags, createdAt: now, updatedAt: now };
}

export async function updateNote(
  id: string,
  updates: { title?: string; content?: string; tags?: string[] }
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const sets: string[] = ["updated_at = ?"];
  const values: any[] = [now];

  if (updates.title !== undefined) {
    sets.push("title = ?");
    values.push(updates.title);
  }
  if (updates.content !== undefined) {
    sets.push("content = ?");
    values.push(updates.content);
  }
  if (updates.tags !== undefined) {
    sets.push("tags = ?");
    values.push(JSON.stringify(updates.tags));
  }

  values.push(id);
  await db.runAsync(`UPDATE notes SET ${sets.join(", ")} WHERE id = ?`, values);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM notes WHERE id = ?", [id]);
}

export async function getNote(id: string): Promise<Note | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync("SELECT * FROM notes WHERE id = ?", [id]);
  return row ? rowToNote(row) : null;
}

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync("SELECT * FROM notes ORDER BY updated_at DESC");
  return rows.map(rowToNote);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const db = await getDatabase();
  const pattern = `%${query}%`;
  const rows = await db.getAllAsync(
    "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updated_at DESC",
    [pattern, pattern]
  );
  return rows.map(rowToNote);
}
