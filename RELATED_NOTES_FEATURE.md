# Related Notes Panel Feature

## Overview
Shows existing related notes in a side panel while creating a new note, helping users discover connections and avoid duplicates.

## Implementation

### Components

#### 1. `useRelatedNotes` Hook (`src/hooks/useRelatedNotes.ts`)
**Purpose:** Find related notes based on text content and tags with debouncing.

**Features:**
- **Debounced search** (300ms default) to avoid excessive database queries
- **Tag matching** (highest priority) - 10 points per matching tag
- **Keyword matching** via FTS5 full-text search - 3 points per keyword
- **Smart keyword extraction** - filters stop words, minimum 3 chars
- Returns top 5 most relevant notes sorted by score

**Algorithm:**
1. Extract keywords from typed text (simple tokenization + stop word filtering)
2. Search for notes with matching tags (high priority)
3. Use SQLite FTS5 for keyword matching in title/content
4. Score each note based on matches
5. Sort by relevance score and return top 5

**Performance:**
- Only triggers when text ≥3 chars or tags exist
- Debounced at 300ms to reduce query frequency
- Leverages existing FTS5 index for fast searches
- Limits to top 50 notes for tag matching, top 20 per keyword

#### 2. `RelatedNotesPanel` Component (`src/components/RelatedNotesPanel.tsx`)
**Purpose:** Display related notes with tap-to-view functionality.

**UI Features:**
- Shows count badge
- Displays note title, preview (2 lines), and tags (max 3 visible)
- Loading indicator during search
- Auto-hides when no related notes found
- Max height of 280px with scrollable list
- Keyboard-aware tap handling

**Styling:**
- Dark theme consistent with app design
- iOS-style card layout
- Badge for count
- Tag chips with color coding

#### 3. `CaptureScreen` Updates (`src/screens/CaptureScreen.tsx`)
**Integration:**
- Added `useRelatedNotes` hook with 300ms debounce
- Renders `RelatedNotesPanel` between tags section and footer
- Handles related note tap → navigates to `NoteDetail` screen
- Maintains existing save/cancel/tag functionality

## User Flow

1. **User opens Capture screen** → Input auto-focuses
2. **User starts typing** → After 300ms debounce:
   - Keywords extracted from text
   - Database searches for matching notes via FTS5
3. **Related notes appear** (if any):
   - Panel shows below tags section
   - Top 3-5 most relevant notes displayed
   - Each shows title, preview, tags
4. **User can tap a related note**:
   - Navigates to that note's detail screen
   - Can reference/link/merge if needed
5. **User adds tags** → Panel updates to include tag-based matches
6. **User saves note** → Returns to note list

## Technical Details

### Database Schema (Existing)
```sql
-- Notes table with FTS5 index already set up
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL, -- JSON array
  created_at TEXT,
  updated_at TEXT
);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE notes_fts USING fts5(
  title, 
  content,
  content=notes,
  content_rowid=rowid
);
```

### Search Strategy
1. **Tag Matching** (Priority 1):
   - Parse tags from input
   - Query all notes, filter by matching tags
   - Score: 10 points per matching tag

2. **Keyword Matching** (Priority 2):
   - Extract keywords (≥3 chars, no stop words)
   - Use FTS5 MATCH query per keyword
   - Score: 3 points per keyword match

3. **Ranking**:
   - Combine scores (tags + keywords)
   - Sort descending
   - Return top 5

### Performance Optimizations
- **Debouncing**: 300ms delay prevents query spam
- **FTS5**: Leverages existing full-text search index
- **Limits**: Max 50 notes for tag search, 20 per keyword
- **Short-circuit**: No search if text <3 chars and no tags
- **Keyword limit**: Max 10 keywords extracted to avoid over-querying

## Testing Recommendations

### Manual Tests
1. **Empty state**: No related notes when typing <3 chars
2. **Tag matching**: Add tag → see notes with same tag
3. **Keyword matching**: Type existing note keywords → see matches
4. **Combined scoring**: Notes with both tag and keyword matches rank highest
5. **Debouncing**: Verify no lag while typing (searches after pause)
6. **Navigation**: Tap related note → opens detail screen
7. **No duplicates**: Current note (if editing) shouldn't appear
8. **Panel hiding**: Panel disappears when no matches

### Edge Cases
- [ ] Very long text input (>1000 chars)
- [ ] Special characters in search
- [ ] Multiple rapid tag additions
- [ ] Empty database
- [ ] Malformed tags in database

## Future Enhancements (Not Implemented)

### Phase 2: AI Semantic Matching
- Integrate with LLM for semantic similarity
- Generate embeddings for notes
- Vector similarity search
- Requires: vector database or external API

### Phase 3: Linking Suggestions
- "Create link to this note?" quick action
- Bi-directional link creation
- Link preview in related note cards

### Phase 4: Smart Deduplication
- Detect very similar notes
- Suggest merging duplicates
- Show similarity percentage

## Files Changed

### New Files
- `src/hooks/useRelatedNotes.ts` - Related notes search logic
- `src/components/RelatedNotesPanel.tsx` - UI component

### Modified Files
- `src/screens/CaptureScreen.tsx` - Integrated related notes panel

### Dependencies
No new dependencies required - uses existing:
- `expo-sqlite` (already installed)
- React Navigation (already installed)
- React Native core components

## API Surface

### `useRelatedNotes(text: string, tags: string[], debounceMs?: number)`
**Returns:** `{ relatedNotes: RelatedNote[], loading: boolean }`

**RelatedNote Type:**
```typescript
interface RelatedNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  score: number; // Relevance score
}
```

### `RelatedNotesPanel` Props
```typescript
interface RelatedNotesPanelProps {
  relatedNotes: RelatedNote[];
  loading: boolean;
  onNotePress: (noteId: string) => void;
}
```

## Accessibility
- **Keyboard navigation**: Panel supports tap handling with keyboard visible
- **Loading states**: Shows spinner when searching
- **Touch targets**: 44pt minimum for note cards
- **Color contrast**: Follows iOS dark mode standards

## Performance Benchmarks (Expected)

- **Initial render**: <50ms
- **Debounce delay**: 300ms after typing stops
- **Search query**: <100ms (FTS5 indexed)
- **Re-render**: <16ms (60fps)

## Rollout Plan

### Testing Phase
1. Run TypeScript compilation ✅
2. Test on iOS simulator
3. Test on Android emulator
4. Manual QA (all test cases above)

### Deployment
1. Create feature branch: `feature/related-notes-panel`
2. Open PR with this doc
3. Code review
4. Merge to main
5. Tag release: `v1.1.0`

## Success Metrics

### Qualitative
- Users discover related notes while writing
- Reduced duplicate notes
- Faster note creation (no need to search separately)

### Quantitative (Future)
- % of new notes that view related notes
- % of related note taps that create links
- Average related notes panel engagement time

---

**Status:** ✅ Implementation complete
**Next:** Manual testing on iOS/Android
