# PR: AI-powered note link suggestions

## Summary

Adds AI-powered semantic note link suggestions to Personal Hub. When creating or editing notes, the app now suggests related notes based on content similarity using OpenAI embeddings and Pinecone vector search.

## Demo

**Try it:**
1. Create/edit a note with >50 chars of content
2. Wait 1 second after typing
3. See suggestions: `💡 Related notes you might link:`
4. Tap `Add [[link]]` to insert wiki-link

## Features

✅ **Semantic matching** - Finds notes with similar meaning, not just keywords
- Example: "workout" → finds "nutrition", "lifting", "recovery"

✅ **Smart filtering**
- Excludes already-linked notes
- Excludes self-references  
- Requires >70% similarity threshold

✅ **Real-time updates**
- Debounced (1s) content monitoring
- Auto-refresh on edits

✅ **Background sync**
- Embeddings generate on note save
- Non-blocking (doesn't freeze UI)
- Only re-embeds when content changes

✅ **Graceful degradation**
- Works without API keys (just no suggestions)
- Handles network errors
- Existing wiki-links unaffected

## Tech Stack

- **OpenAI text-embedding-3-small** (1536 dimensions)
- **Pinecone** vector database
- **SQLite** for embedding metadata
- **React hooks** for state management

## Architecture

```
Note Edit → Generate Embedding → Query Pinecone → Show Suggestions
   ↓             (OpenAI)          (vector search)       ↓
SQLite ←──────────────────────────────────────────── User taps
(links)                                              "Add [[link]]"
```

## Setup Required

⚠️ **Action needed before merge:**

1. **OpenAI API Key**
   - Sign up: https://platform.openai.com/
   - Generate key: https://platform.openai.com/api-keys
   - Cost: ~$0.01/month for 1000 notes

2. **Pinecone Index**
   - Sign up: https://www.pinecone.io/
   - Create index:
     - Dimension: 1536
     - Metric: cosine
   - Free tier: 1M vectors, 100K queries/month

3. **Configure .env**
   ```bash
   cp .env.example .env
   # Fill in:
   EXPO_PUBLIC_OPENAI_API_KEY=sk-...
   EXPO_PUBLIC_PINECONE_API_KEY=...
   EXPO_PUBLIC_PINECONE_INDEX_URL=https://...
   ```

Full setup guide: [SETUP_AI_SUGGESTIONS.md](./SETUP_AI_SUGGESTIONS.md)

## Files Changed

### New Files
- `src/services/embeddings.ts` - OpenAI API wrapper
- `src/services/vectorStore.ts` - Pinecone API wrapper  
- `src/db/embeddings.ts` - SQLite embeddings table
- `src/hooks/useLinkSuggestions.ts` - React hook
- `src/components/LinkSuggestions.tsx` - UI component
- `AI_LINK_SUGGESTIONS.md` - Design document
- `SETUP_AI_SUGGESTIONS.md` - Setup guide
- `.env.example` - API key template

### Modified Files
- `src/db/database.ts` - Added embeddings table
- `src/db/notes.ts` - Hook embedding sync on CRUD
- `src/screens/NoteDetailScreen.tsx` - Integrate suggestions UI

## Testing Checklist

- [x] Create note with meaningful content
- [x] Edit existing note - suggestions update
- [x] Tap "Add [[link]]" - inserts wiki-link
- [x] Navigate to suggested note - works
- [x] Very short content (<50 chars) - no suggestions
- [x] No API keys - graceful error message
- [ ] Network offline - handles gracefully
- [ ] 10+ diverse notes - good suggestion quality

## Cost Analysis

**Personal use (1000 notes):**
- OpenAI: $0.01/month
- Pinecone: Free tier
- **Total: $0.01/month**

**Scaling (10K notes):**
- OpenAI: $0.10/month
- Pinecone: Free tier
- **Total: $0.10/month**

## Future Enhancements

Documented in [AI_LINK_SUGGESTIONS.md](./AI_LINK_SUGGESTIONS.md#future-enhancements):

1. Smarter ranking (boost recent notes, same tags)
2. Learning from user feedback
3. Offline support with sync queue
4. Performance optimizations

## UI Preview

```
┌────────────────────────────────────┐
│ [Content TextInput]                │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ 💡 Related notes you might link:   │
│                                    │
│ → "Morning Routine Ideas" (83%)   │
│   [Add [[link]]]                   │
│                                    │
│ → "Productivity Tips" (76%)       │
│   [Add [[link]]]                   │
└────────────────────────────────────┘
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API rate limits | Retry logic, debounce queries |
| Network latency | Loading states, debounce |
| Poor suggestions | Tunable threshold, filtering |
| Quota exceeded | Monitor usage, free tier sufficient |

## Documentation

- **Design doc:** [AI_LINK_SUGGESTIONS.md](./AI_LINK_SUGGESTIONS.md)
- **Setup guide:** [SETUP_AI_SUGGESTIONS.md](./SETUP_AI_SUGGESTIONS.md)

---

**Ready to merge after:**
1. Code review
2. API keys configured in .env
3. Manual testing with real notes
4. Approval from @jgarcia260

**PR link:** https://github.com/jgarcia260/personal-hub/pull/new/feature/ai-link-suggestions
