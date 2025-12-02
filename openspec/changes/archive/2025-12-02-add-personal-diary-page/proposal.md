# Change: Add Personal Diary Page

## Why
Users need a web interface to create, view, search, and manage their personal diary entries. The API already supports personal diary CRUD operations (`/v1/diary`), but the web app currently shows only a placeholder page.

## What Changes
- Add new `diary.slice.ts` Redux slice for personal diary state management
- Add API client functions for personal diary endpoints
- Implement `DiaryView` component with sub-components following existing patterns
- Add translations for diary page (en-US and nl-NL)
- Add E2E tests with page object pattern
- Add 100% unit test coverage for Redux slice

## Impact
- Affected specs: Creates new `web-personal-diary` capability
- Affected code:
  - `apps/web/src/store/slices/diary.slice.ts` (new)
  - `apps/web/src/store/store.ts` (add diary reducer)
  - `apps/web/src/lib/api-client.ts` (add diary API functions)
  - `apps/web/src/types/api.types.ts` (add diary types)
  - `apps/web/src/app/[lang]/app/diary/page.tsx` (update)
  - `apps/web/src/components/diary/` (new directory with components)
  - `apps/web/src/dictionaries/en-US/dashboard/diary.json` (update)
  - `apps/web/src/dictionaries/nl-NL/dashboard/diary.json` (update)
  - `apps/web/tests/e2e/pages/diary.page.ts` (new)
  - `apps/web/tests/e2e/app/diary.spec.ts` (new)
  - `apps/web/tests/unit/store/diary.slice.test.ts` (new)
