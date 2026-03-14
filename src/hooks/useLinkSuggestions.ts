/**
 * React Hook for AI-Powered Link Suggestions
 * Provides real-time suggestions based on note content
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { generateEmbedding } from "../services/embeddings";
import { querySimilarNotes, type SimilarNote } from "../services/vectorStore";
import { getOutgoingLinks } from "../db/links";

export interface LinkSuggestion {
  noteId: string;
  title: string;
  score: number;
}

export interface UseLinkSuggestionsResult {
  suggestions: LinkSuggestion[];
  loading: boolean;
  error: string | null;
}

const MIN_CONTENT_LENGTH = 50;
const DEBOUNCE_MS = 1000;
const TOP_K = 5;
const MIN_SCORE = 0.7;

/**
 * Hook to get AI-powered link suggestions
 * Automatically debounces content changes and queries similar notes
 */
export function useLinkSuggestions(
  noteId: string | null,
  title: string,
  content: string
): UseLinkSuggestionsResult {
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  const fetchSuggestions = useCallback(async () => {
    // Skip if content too short
    if (content.length < MIN_CONTENT_LENGTH) {
      setSuggestions([]);
      return;
    }

    // Skip if no API keys configured
    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY || !process.env.EXPO_PUBLIC_PINECONE_API_KEY) {
      setError("API keys not configured");
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Generate embedding for current content
      const { embedding } = await generateEmbedding(title, content);

      // Get already-linked notes to exclude
      const linkedNotes = noteId ? await getOutgoingLinks(noteId) : [];
      const excludeIds = noteId 
        ? [noteId, ...linkedNotes.map((n) => n.id)]
        : [];

      // Query similar notes
      const similar = await querySimilarNotes(
        embedding,
        TOP_K,
        MIN_SCORE,
        excludeIds
      );

      setSuggestions(similar);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }
      console.error("Failed to fetch link suggestions:", err);
      setError(err instanceof Error ? err.message : "Failed to load suggestions");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [noteId, title, content]);

  // Debounce content changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset state immediately for very short content
    if (content.length < MIN_CONTENT_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions();
    }, DEBOUNCE_MS);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [title, content, fetchSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { suggestions, loading, error };
}
