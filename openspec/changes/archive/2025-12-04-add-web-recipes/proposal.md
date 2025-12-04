# Change: Add Recipe Functionality to Web App

## Why

The backend API already supports recipe management (CRUD, search), but the web app lacks a UI for family members to browse, create, edit, and delete recipes. This feature enables families to share and track cooking recipes with step-by-step progress tracking.

## What Changes

- Add new `recipes` Redux slice with full CRUD operations and search functionality
- Add recipe API client functions to `api-client.ts`
- Add recipe types to `api.types.ts`
- Create recipes list page at `/[lang]/app/recipes` with grid layout and search
- Create recipe detail page at `/[lang]/app/recipes/[id]` with step tracking
- Add "Create Recipe" dialog following existing dialog patterns (title, description, duration, tags only)
- Add step management on detail page (add/edit/remove steps inline)
- Add translations for en-US and nl-NL
- Add E2E tests with page object pattern
- Add 100% unit test coverage for Redux slice

## Impact

- **Affected specs**: Creates new `web-recipes` spec
- **Affected code**:
  - `apps/web/src/store/slices/recipes.slice.ts` (new)
  - `apps/web/src/store/store.ts` (add recipes reducer)
  - `apps/web/src/lib/api-client.ts` (add recipe functions)
  - `apps/web/src/types/api.types.ts` (add recipe types)
  - `apps/web/src/app/[lang]/app/recipes/` (new pages)
  - `apps/web/src/components/recipes/` (new components)
  - `apps/web/src/dictionaries/en-US/dashboard/recipes.json` (new)
  - `apps/web/src/dictionaries/nl-NL/dashboard/recipes.json` (new)
  - `apps/web/tests/e2e/app/recipes.spec.ts` (new)
  - `apps/web/tests/e2e/pages/recipes.page.ts` (new)
  - `apps/web/tests/unit/store/recipes.slice.test.ts` (new)
