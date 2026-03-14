# Setup Guide: AI-Powered Link Suggestions

This guide walks you through enabling AI-powered note link suggestions in Personal Hub.

## Prerequisites

1. **OpenAI API Account**
   - Sign up at https://platform.openai.com/
   - Generate an API key at https://platform.openai.com/api-keys
   - Pricing: ~$0.020 per 1M tokens (text-embedding-3-small)
   - Personal use cost: negligible (~$0.01 for 1000 notes)

2. **Pinecone Account**
   - Sign up at https://www.pinecone.io/
   - Create a new index with these settings:
     - **Dimension:** 1536
     - **Metric:** cosine
     - **Cloud:** AWS (or your preference)
     - **Region:** us-east-1 (or closest to you)
   - Copy your API key and index URL
   - Free tier: 1M vectors, 100K queries/month

## Step 1: Configure API Keys

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in your API keys:
   ```bash
   EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-xxx...
   EXPO_PUBLIC_PINECONE_API_KEY=xxx...
   EXPO_PUBLIC_PINECONE_INDEX_URL=https://your-index-xxxxx.svc.environment.pinecone.io
   ```

3. Verify `.env` is in your `.gitignore` (it already is)

## Step 2: Install Dependencies

All required packages are already in `package.json`. If you need to reinstall:

```bash
pnpm install
```

## Step 3: Test the Feature

1. Start the development server:
   ```bash
   pnpm start
   ```

2. Create or edit a note with meaningful content (>50 characters)

3. After typing and pausing for 1 second, you should see:
   ```
   💡 Related notes you might link:
   → "Morning Routine Ideas" (83% match)
     [Add [[link]]]
   ```

4. Tap "Add [[link]]" to insert a wiki-link to the suggested note

## Step 4: Initial Sync (Optional)

To generate embeddings for all existing notes:

1. Add a sync utility (create `src/utils/syncAllNotes.ts`):
   ```typescript
   import { syncAllNotes } from "../db/embeddings";

   export async function runInitialSync() {
     console.log("Starting initial sync...");
     const result = await syncAllNotes((current, total) => {
       console.log(`Progress: ${current}/${total}`);
     });
     console.log("Sync complete:", result);
   }
   ```

2. Call it once from your app (e.g., in a settings screen):
   ```typescript
   import { runInitialSync } from "../utils/syncAllNotes";

   // In a button handler
   await runInitialSync();
   ```

## How It Works

### Architecture

```
Note Edit → Generate Embedding → Query Pinecone → Show Suggestions
   ↓             (OpenAI)          (vector search)       ↓
SQLite ←──────────────────────────────────────────── User taps
(links)                                              "Add [[link]]"
```

### Smart Features

1. **Semantic Matching**
   - Finds notes with similar meaning, not just keywords
   - Example: "workout" finds "nutrition", "lifting", "recovery"

2. **Automatic Filtering**
   - Excludes already-linked notes
   - Excludes self-references
   - Only suggests notes with >70% similarity

3. **Real-time Updates**
   - Suggestions update as you type (debounced 1s)
   - No manual refresh needed

4. **Background Sync**
   - Embeddings generate automatically on note save
   - Doesn't block UI or navigation
   - Only re-embeds when content changes

## Troubleshooting

### "API keys not configured" error
- Check `.env` file exists and has correct keys
- Restart Expo dev server after changing `.env`
- Verify keys start with `EXPO_PUBLIC_` (required for Expo)

### No suggestions appear
- Content must be >50 characters
- Wait 1 second after typing (debounce delay)
- Check console for errors (`npx expo start --dev-client`)
- Verify you have other notes with embeddings synced

### Slow suggestions
- First query generates embedding (1-2s delay)
- Subsequent edits use cached context
- Network latency to OpenAI/Pinecone

### Pinecone quota exceeded
- Free tier: 1M vectors, 100K queries/month
- Monitor usage in Pinecone dashboard
- Consider upgrading to paid plan ($70/month)

## Cost Estimates

**Monthly costs for personal use (~1000 notes):**

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI Embeddings | ~500K tokens/month | $0.01 |
| Pinecone Storage | 1000 vectors | Free tier |
| Pinecone Queries | ~1000 queries/month | Free tier |
| **Total** | | **$0.01/month** |

**Scaling to 10K notes:**

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI Embeddings | ~5M tokens/month | $0.10 |
| Pinecone Storage | 10K vectors | Free tier |
| Pinecone Queries | ~10K queries/month | Free tier |
| **Total** | | **$0.10/month** |

## Advanced Configuration

### Adjust Similarity Threshold

Edit `src/hooks/useLinkSuggestions.ts`:

```typescript
const MIN_SCORE = 0.7; // Lower = more suggestions, less relevant
```

### Adjust Debounce Delay

```typescript
const DEBOUNCE_MS = 1000; // Milliseconds to wait after typing
```

### Adjust Number of Suggestions

```typescript
const TOP_K = 5; // Max suggestions to show
```

### Exclude Short Notes

```typescript
const MIN_CONTENT_LENGTH = 50; // Min chars for embedding
```

## Privacy & Data

- **Embeddings:** Sent to OpenAI for processing (check their privacy policy)
- **Storage:** Vectors stored in Pinecone cloud
- **Local:** Note content remains in local SQLite
- **Security:** Use HTTPS for all API calls
- **Offline:** Suggestions require internet connection

## Disabling the Feature

If you want to disable AI suggestions:

1. Remove API keys from `.env`
2. The feature will gracefully degrade (no suggestions shown)
3. Existing wiki-links continue to work normally

## Further Reading

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Cosine Similarity Explained](https://en.wikipedia.org/wiki/Cosine_similarity)
- [Design Document](./AI_LINK_SUGGESTIONS.md)

## Support

Issues? Check:
1. Console logs for detailed errors
2. API key validity in provider dashboards
3. Network connectivity
4. Pinecone index configuration (dimension=1536, metric=cosine)

For bugs, create an issue in the repository with:
- Error messages from console
- Steps to reproduce
- Environment (iOS/Android/Web)
