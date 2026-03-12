import { useState, useEffect, useCallback } from "react";
import { getAllNotes, createNote, updateNote, deleteNote, searchNotes, type Note } from "../db/notes";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      let results = searchQuery
        ? await searchNotes(searchQuery)
        : await getAllNotes();
      
      // Filter by tag if selected
      if (selectedTag) {
        results = results.filter((note) => note.tags.includes(selectedTag));
      }
      
      setNotes(results);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedTag]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = useCallback(async (content: string, title?: string, tags?: string[]) => {
    const note = await createNote(content, title, tags);
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
    selectedTag,
    setSelectedTag,
    addNote,
    editNote,
    removeNote,
    refresh,
  };
}
