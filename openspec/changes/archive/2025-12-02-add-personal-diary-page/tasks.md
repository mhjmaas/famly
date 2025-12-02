# Tasks: Add Personal Diary Page

## 1. API Client & Types
- [x] 1.1 Add `DiaryEntry` and related types to `apps/web/src/types/api.types.ts`
- [x] 1.2 Add diary API functions to `apps/web/src/lib/api-client.ts` (getDiaryEntries, createDiaryEntry, updateDiaryEntry, deleteDiaryEntry)

## 2. Redux Store
- [x] 2.1 Create `apps/web/src/store/slices/diary.slice.ts` with state, async thunks, and selectors
- [x] 2.2 Register diary reducer in `apps/web/src/store/store.ts`
- [x] 2.3 Write unit tests for diary slice with 100% coverage in `apps/web/tests/unit/store/diary.slice.test.ts`

## 3. Translations
- [x] 3.1 Update `apps/web/src/dictionaries/en-US/dashboard/diary.json` with all diary page translations
- [x] 3.2 Update `apps/web/src/dictionaries/nl-NL/dashboard/diary.json` with Dutch translations
- [x] 3.3 Update dictionary index files if needed

## 4. Components
- [x] 4.1 Create `apps/web/src/components/diary/DiaryView.tsx` main container component
- [x] 4.2 Create `apps/web/src/components/diary/DiaryHeader.tsx` with title, search, and date filter
- [x] 4.3 Create `apps/web/src/components/diary/DiaryEntryForm.tsx` for creating new entries
- [x] 4.4 Create `apps/web/src/components/diary/DiaryEntryCard.tsx` for displaying individual entries
- [x] 4.5 Create `apps/web/src/components/diary/DiaryEntryGroup.tsx` for grouping entries by date
- [x] 4.6 Create `apps/web/src/components/diary/DiaryEmptyState.tsx` for empty state display
- [x] 4.7 Create `apps/web/src/components/diary/DiaryFilters.tsx` for search and date filtering
- [x] 4.8 Add data-testid attributes to all interactive elements

## 5. Page Integration
- [x] 5.1 Update `apps/web/src/app/[lang]/app/diary/page.tsx` to use DiaryView component
- [x] 5.2 Implement responsive layout following existing patterns (desktop/mobile)

## 6. E2E Tests
- [x] 6.1 Create `apps/web/tests/e2e/pages/diary.page.ts` page object with locators and helpers
- [x] 6.2 Create `apps/web/tests/e2e/app/diary.spec.ts` with E2E test scenarios
- [x] 6.3 Test page load and empty state
- [x] 6.4 Test entry creation
- [x] 6.5 Test search functionality
- [x] 6.6 Test date filtering
- [x] 6.7 Test responsive layout (mobile/desktop)

## 7. Verification
- [x] 7.1 Run unit tests: `pnpm test` in apps/web
- [x] 7.2 Run E2E tests: `pnpm test:e2e` in apps/web
- [x] 7.3 Run lint: `pnpm run lint`
- [x] 7.4 Manual verification of visual design against reference
