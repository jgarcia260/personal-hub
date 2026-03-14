import { useState, useEffect, useRef } from "react";
import { getDatabase } from "../db/database";
import type { Note } from "../db/notes";

interface RelatedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  score: number; // Relevance score
}

/**
 * Hook to find related notes based on text content and tags
 * Uses debouncing to avoid excessive database queries
 */
export function useRelatedNotes(text: string, tags: string[], debounceMs = 300) {
  const [relatedNotes, setRelatedNotes] = useState<RelatedNote[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search if text is too short
    const trimmedText = text.trim();
    if (trimmedText.length < 3 && tags.length === 0) {
      setRelatedNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Debounce the search
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await findRelatedNotes(trimmedText, tags);
        setRelatedNotes(results);
      } catch (error) {
        console.error("Failed to find related notes:", error);
        setRelatedNotes([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [text, tags, debounceMs]);

  return { relatedNotes, loading };
}

async function findRelatedNotes(text: string, tags: string[]): Promise<RelatedNote[]> {
  const db = await getDatabase();
  const notesMap = new Map<string, RelatedNote>();

  // Extract keywords from text (simple tokenization)
  const keywords = extractKeywords(text);

  // Strategy 1: Tag matching (highest priority)
  if (tags.length > 0) {
    const rows = await db.getAllAsync<{
      id: string;
      title: string;
      content: string;
      tags: string;
    }>(
      "SELECT id, title, content, tags FROM notes ORDER BY updated_at DESC LIMIT 50"
    );

    for (const row of rows) {
      let noteTags: string[] = [];
      try {
        noteTags = JSON.parse(row.tags || "[]");
      } catch (e) {
        noteTags = [];
      }

      // Count matching tags
      const matchingTags = tags.filter((tag) => noteTags.includes(tag));
      if (matchingTags.length > 0) {
        const score = matchingTags.length * 10; // 10 points per matching tag
        notesMap.set(row.id, {
          id: row.id,
          title: row.title,
          content: row.content,
          tags: noteTags,
          score,
        });
      }
    }
  }

  // Strategy 2: Keyword matching in title/content
  if (keywords.length > 0) {
    for (const keyword of keywords) {
      if (keyword.length < 3) continue; // Skip very short keywords

      try {
        // Use FTS5 for efficient full-text search
        const rows = await db.getAllAsync<{
          id: string;
          title: string;
          content: string;
          tags: string;
        }>(
          `SELECT n.id, n.title, n.content, n.tags
           FROM notes n
           JOIN notes_fts fts ON n.rowid = fts.rowid
           WHERE notes_fts MATCH ?
           ORDER BY n.updated_at DESC
           LIMIT 20`,
          [keyword]
        );

        for (const row of rows) {
          let noteTags: string[] = [];
          try {
            noteTags = JSON.parse(row.tags || "[]");
          } catch (e) {
            noteTags = [];
          }

          const existing = notesMap.get(row.id);
          const keywordScore = 3; // 3 points per keyword match

          if (existing) {
            existing.score += keywordScore;
          } else {
            notesMap.set(row.id, {
              id: row.id,
              title: row.title,
              content: row.content,
              tags: noteTags,
              score: keywordScore,
            });
          }
        }
      } catch (error) {
        console.warn(`FTS search failed for keyword "${keyword}":`, error);
      }
    }
  }

  // Sort by score (highest first) and return top 5
  const results = Array.from(notesMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return results;
}

/**
 * Extract meaningful keywords from text
 * Simple tokenization - split by whitespace and remove common stop words
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for",
    "if", "in", "into", "is", "it", "no", "not", "of", "on", "or",
    "such", "that", "the", "their", "then", "there", "these", "they",
    "this", "to", "was", "will", "with", "i", "me", "my", "we", "you"
  ]);

  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, "")) // Remove punctuation
    .filter((word) => word.length >= 3 && !stopWords.has(word))
    .slice(0, 10); // Limit to 10 keywords max to avoid over-querying
}
