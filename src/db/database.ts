import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync("personal-hub.db");
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS note_links (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      target_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source_id, target_id)
    );

    -- Performance indexes
    CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_links_source ON note_links(source_id);
    CREATE INDEX IF NOT EXISTS idx_links_target ON note_links(target_id);

    -- Full-text search virtual table
    CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
      title, 
      content,
      content=notes,
      content_rowid=rowid
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
      INSERT INTO notes_fts(rowid, title, content) VALUES (new.rowid, new.title, new.content);
    END;

    CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
      DELETE FROM notes_fts WHERE rowid = old.rowid;
    END;

    CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
      UPDATE notes_fts SET title = new.title, content = new.content WHERE rowid = new.rowid;
    END;
  `);
}
