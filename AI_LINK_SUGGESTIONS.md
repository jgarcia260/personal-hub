# AI-Powered Note Link Suggestions - Design Document

## Overview

Add intelligent note link suggestions to Personal Hub using semantic similarity. When creating/editing a note, suggest related notes the user might want to link based on content similarity, not just keyword matching.

## Current State

✅ **Wiki-link functionality exists:**
- `[[title]]` syntax parsing in `src/db/links.ts`
- Link storage in `note_links` table
- Auto-linking on note save via `updateLinksForNote()`
- UI displays outgoing links and backlinks

## Vector Storage Research

### Option 1: SQLite with sqlite-vec Extension
**Pros:**
- Local-first, no external dependencies
- Zero latency for queries
- No API costs for storage/retrieval
- Works offline
- Simple deployment (single database file)
- sqlite-vec supports native vector operations

**Cons:**
- Need to compile/include native extension in React Native
- Expo may not support custom SQLite extensions easily
- Would need to eject from Expo or use custom dev client
- Embedding generation still requires OpenAI API

**Verdict:** ❌ **Not feasible for now** - Expo/React Native limitations with native SQLite extensions.

### Option 2: Pinecone
**Pros:**
- Cloud-hosted, managed service
- Purpose-built for vector search
- Fast similarity queries
- Scales automatically
- Works with Expo out of the box (HTTP API)
- Metadata filtering support

**Cons:**
- External dependency (network required)
- API costs (free tier: 1M vectors, 100K queries/month)
- Latency for queries
- Data stored externally

**Verdict:** ✅ **Recommended for MVP** - Works with current Expo setup, proven solution.

### Option 3: Hybrid (SQLite + In-Memory Vectors)
**Pros:**
- Store embeddings as JSON in SQLite
- Compute cosine similarity in JavaScript
- No external dependencies for search

**Cons:**
- Slow for large datasets (O(n) search)
- Memory-intensive
- No native vector operations
- Poor performance beyond ~1000 notes

**Verdict:** ⚠️ **Fallback option** - Works but doesn't scale well.

## Recommended Implementation: Pinecone + OpenAI

### Tech Stack
1. **OpenAI text-embedding-3-small** - Generate embeddings (1536 dimensions)
2. **Pinecone** - Vector storage and similarity search
3. **SQLite** - Store embedding metadata (note_id → pinecone_id mapping)

### Architecture

```
┌─────────────────┐
│  Note Save      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Generate Embedding          │
│ (OpenAI API)                │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Upsert to Pinecone          │
│ {id, values, metadata}      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Store mapping in SQLite     │
│ embeddings table            │
└─────────────────────────────┘

┌─────────────────┐
│ On Content Edit │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Generate temp embedding     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Query Pinecone (top 5)      │
│ cosine similarity > 0.7     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Show suggestions UI         │
│ "Tap to add [[link]]"       │
└─────────────────────────────┘
```

### Database Schema Changes

```sql
-- Track embeddings sync status
CREATE TABLE embeddings (
  note_id TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  pinecone_id TEXT NOT NULL,
  embedding_model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  synced_at TEXT NOT NULL,
  content_hash TEXT NOT NULL  -- Detect if content changed
);

CREATE INDEX idx_embeddings_synced ON embeddings(synced_at);
```

### API Integration

**Environment Variables:**
```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_PINECONE_API_KEY=...
EXPO_PUBLIC_PINECONE_INDEX_URL=https://...
```

**New Files:**
```
src/
  services/
    embeddings.ts      # OpenAI API wrapper
    vectorStore.ts     # Pinecone API wrapper
  db/
    embeddings.ts      # SQLite embeddings table
  hooks/
    useLinkSuggestions.ts  # React hook for suggestions
  components/
    LinkSuggestions.tsx    # UI component
```

### Smart Suggestions Features

1. **Semantic Matching**
   - "workout" → finds "nutrition", "lifting", "recovery"
   - Not just keyword search

2. **Learn from Manual Links**
   - Track which suggestions get accepted
   - Boost similar patterns in future suggestions
   - Store in `link_suggestions_feedback` table

3. **Unexpected Connections**
   - Surface notes with >0.7 similarity but no existing link
   - "You wrote about X in Feb and Y in Oct - they seem related!"

4. **Smart Filtering**
   - Exclude already-linked notes
   - Exclude self-links
   - Require minimum content length (~50 chars)
   - Debounce queries (only after typing pauses)

### UI/UX Design

**Location:** Below content TextInput, above Tags section

```
┌────────────────────────────────────┐
│ [Content TextInput]                │
│                                    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 💡 Related notes you might link:   │
│                                    │
│ → "Morning Routine Ideas" (0.83)   │
│   [Add [[link]]]                   │
│                                    │
│ → "Productivity Tips" (0.76)       │
│   [Add [[link]]]                   │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Tags: [productivity] [morning]     │
└────────────────────────────────────┘
```

**Interaction:**
- Show only when content length > 50 chars
- Update on content change (debounced 1s)
- Tap "Add [[link]]" → inserts `[[Note Title]]` at cursor
- Show top 3-5 suggestions
- Display similarity score (for debugging/transparency)

### Implementation Plan

**Phase 1: Infrastructure** (~2 hours)
1. Set up Pinecone account and index
2. Add API keys to env
3. Create `services/embeddings.ts` and `services/vectorStore.ts`
4. Add `embeddings` table to schema
5. Test basic embedding generation + storage

**Phase 2: Background Sync** (~2 hours)
1. Create `src/db/embeddings.ts` with sync logic
2. Hook into `updateNote()` to trigger embedding generation
3. Implement content hashing to skip unchanged notes
4. Add background sync for existing notes (one-time migration)

**Phase 3: Suggestions Hook** (~2 hours)
1. Create `useLinkSuggestions` hook
2. Implement debounced embedding generation
3. Query Pinecone for similar notes
4. Filter out existing links and self-references
5. Return top suggestions with scores

**Phase 4: UI Component** (~2 hours)
1. Create `LinkSuggestions.tsx` component
2. Integrate into `NoteDetailScreen`
3. Implement "Add [[link]]" tap handler
4. Add loading/error states
5. Style to match existing design

**Phase 5: Polish** (~1 hour)
1. Add feedback tracking (optional)
2. Optimize query performance
3. Handle edge cases (network errors, empty content, etc.)
4. Add analytics/logging
5. Documentation

**Total Estimate:** ~9 hours

### Testing Strategy

1. **Unit Tests:**
   - Embedding generation
   - Similarity calculation
   - Content hashing
   - Link insertion logic

2. **Integration Tests:**
   - End-to-end: create note → generate embedding → get suggestions
   - Test with various content types
   - Test network failure handling

3. **Manual Testing:**
   - Create 10+ diverse notes
   - Test suggestions quality
   - Verify link insertion works
   - Test offline behavior

### Future Enhancements

1. **Smarter ranking:**
   - Boost recent notes
   - Boost notes with manual links from user
   - Boost notes in same tags
   - Time-decay similarity scores

2. **Batch operations:**
   - Regenerate all embeddings when model changes
   - Bulk delete when notes removed

3. **Offline support:**
   - Queue embedding generation when offline
   - Sync when back online

4. **Learning:**
   - Track accepted vs rejected suggestions
   - Adjust similarity threshold per user
   - A/B test different models

5. **Performance:**
   - Cache embeddings locally
   - Use vector quantization for faster search
   - Implement pagination for large result sets

## Cost Analysis

**OpenAI (text-embedding-3-small):**
- $0.020 / 1M tokens
- Average note: ~500 tokens
- 1000 notes: ~$0.01
- Negligible cost

**Pinecone (Free Tier):**
- 1M vectors free
- 100K queries/month free
- Sufficient for personal use
- Upgrade if needed: $70/month for 10M vectors

**Verdict:** ✅ Free tier handles personal use easily.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | Medium | Implement retry logic, queue requests |
| Network latency | Low | Show loading states, debounce queries |
| Pinecone quota exceeded | Medium | Track usage, alert before limit |
| Embedding model changes | Low | Store model version, allow migration |
| Poor suggestion quality | Medium | Tune similarity threshold, add filters |

## Success Metrics

- **Engagement:** % of suggestions that get clicked
- **Quality:** User feedback on suggestion relevance
- **Performance:** Query latency < 500ms p95
- **Coverage:** % of notes with embeddings synced

## Open Questions

1. Should we generate embeddings for title + content, or just content?
   → **Decision:** Both, weighted concatenation: `title + "\n\n" + content`

2. What's the minimum similarity threshold?
   → **Decision:** 0.70 (70% similarity) - adjustable per user

3. How often to re-embed notes?
   → **Decision:** Only when content changes (content hash comparison)

4. Should we show similarity scores to users?
   → **Decision:** Yes for MVP (transparency), hide later if confusing

## Conclusion

**Recommended approach:** Pinecone + OpenAI for MVP

This design balances:
- ✅ Quick implementation (works with current Expo setup)
- ✅ Scalability (Pinecone handles growth)
- ✅ Cost-effectiveness (free tier sufficient)
- ✅ User experience (fast, accurate suggestions)

Estimated delivery: **1 week** for full implementation and testing.
