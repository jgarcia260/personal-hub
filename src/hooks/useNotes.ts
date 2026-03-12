import { useState, useEffect, useCallback } from "react";
import { getAllNotes, createNote, updateNote, deleteNote, searchNotes, type Note } from "../db/notes";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const refresh = useCallback(async () => {
    try {
      const results = searchQuery
        ? await searchNotes(searchQuery)
        : await getAllNotes();
      setNotes(results);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = useCallback(async (content: string, title?: string) => {
    const note = await createNote(content, title);
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const editNote = useCallback(
    async (id: string, updates: { title?: string; content?: string; tags?: string[] }) => {
      await updateNote(id, updates);
      await refresh();
    },
    [refresh]
  );

  const removeNote = useCallback(
    async (id: string) => {
      await deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    []
  );

  return {
    notes,
    loading,
    searchQuery,
    setSearchQuery,
    addNote,
    editNote,
    removeNote,
    refresh,
  };
}
