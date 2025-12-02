# Change: Add Web Shopping Lists Page

## Why
The shopping lists API is fully implemented but the web frontend only has a placeholder page. Family members need a functional UI to create, manage, and check off items on shopping lists to coordinate household shopping.

## What Changes
- Add new Redux slice `shopping-lists.slice.ts` for shopping list state management
- Add API client functions for shopping list CRUD operations
- Add TypeScript types for shopping list DTOs
- Create `ShoppingListsView` component with subcomponents following existing patterns (TasksView)
- Implement create/edit shopping list dialog with name and optional tags
- Implement inline item addition on active shopping lists
- Implement item check/uncheck functionality
- Implement shopping list menu with edit and delete options
- Add translations for en-US and nl-NL
- Add E2E tests with page object pattern
- Add 100% unit test coverage for Redux slice

## Impact
- Affected specs: web-shopping-lists (new capability)
- Affected code:
  - `apps/web/src/store/slices/shopping-lists.slice.ts` (new)
  - `apps/web/src/store/store.ts` (add reducer)
  - `apps/web/src/lib/api-client.ts` (add shopping list functions)
  - `apps/web/src/types/api.types.ts` (add shopping list types)
  - `apps/web/src/app/[lang]/app/shopping-lists/page.tsx` (update)
  - `apps/web/src/components/shopping-lists/` (new directory)
  - `apps/web/src/dictionaries/*/dashboard/shopping-lists.json` (update)
  - `apps/web/tests/e2e/pages/shopping-lists.page.ts` (new)
  - `apps/web/tests/e2e/app/shopping-lists.spec.ts` (new)
  - `apps/web/tests/unit/store/slices/shopping-lists.slice.test.ts` (new)
