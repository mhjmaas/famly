# Design: Add Personal Diary Page

## Context
The API already provides full CRUD operations for personal diary entries at `/v1/diary`. The web app needs a frontend implementation that follows existing patterns for state management, component structure, and testing.

## Goals / Non-Goals

**Goals:**
- Implement personal diary page matching the reference design in `reference/v0-famly/components/diary-view.tsx`
- Follow existing Redux patterns from `tasks.slice.ts`
- Support i18n with en-US and nl-NL translations
- Achieve 100% unit test coverage for Redux slice
- Implement E2E tests with page object pattern
- Use Shadcn components for UI consistency

**Non-Goals:**
- Family diary implementation (separate feature)
- Rich text editing (plain text only)
- Image attachments
- Entry editing (create and delete only for MVP, update can be added)

## Decisions

### Redux State Shape
```typescript
interface DiaryState {
  entries: DiaryEntry[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}
```
Following the pattern from `tasks.slice.ts` for consistency.

### Component Structure
Split the monolithic reference `DiaryView` into smaller components:
- `DiaryView.tsx` - Main container, orchestrates state and layout
- `DiaryHeader.tsx` - Desktop header with title, search, date picker
- `DiaryFilters.tsx` - Mobile-friendly search and filter controls
- `DiaryEntryForm.tsx` - New entry textarea and submit button
- `DiaryEntryCard.tsx` - Individual entry display
- `DiaryEntryGroup.tsx` - Groups entries by date with separator
- `DiaryEmptyState.tsx` - Empty state with icon and message

### API Client Functions
```typescript
// Personal diary API (uses /v1/diary)
getDiaryEntries(startDate?: string, endDate?: string): Promise<DiaryEntry[]>
createDiaryEntry(data: CreateDiaryEntryRequest): Promise<DiaryEntry>
updateDiaryEntry(entryId: string, data: UpdateDiaryEntryRequest): Promise<DiaryEntry>
deleteDiaryEntry(entryId: string): Promise<void>
```

### ID Handling
Per project conventions, ObjectIDs are terminated at the edge. The API returns `_id` as string, and we use string IDs throughout the web app.

### Responsive Design
- Desktop: Side-by-side header with search/date picker, full-width entry form
- Mobile: Stacked layout, compact search bar, FAB for scroll-to-top

### Data Test IDs
All interactive elements will have `data-testid` attributes following the pattern:
- `diary-title`, `diary-description`
- `diary-search-input`, `diary-date-picker`
- `diary-entry-form`, `diary-entry-input`, `diary-submit-button`
- `diary-entry-card`, `diary-entry-content`, `diary-entry-time`
- `diary-empty-state`
- `diary-scroll-top-button`

## Risks / Trade-offs

**Risk:** Large component file in reference design
**Mitigation:** Split into logical sub-components for maintainability

**Risk:** Date filtering complexity
**Mitigation:** Use date-fns (already in project) for consistent date handling

## Open Questions
None - design follows established patterns.
