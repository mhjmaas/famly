# Change: Add Recipe Image Support

## Why

Recipes currently lack visual representation, making them less engaging compared to rewards which already support image uploads. Adding image support to recipes will improve the user experience by allowing family members to see what dishes look like at a glance in the recipe overview.

## What Changes

- **API**: Add `imageUrl` field to recipe schema and validators (create/update)
- **API**: Add image upload endpoint for recipes (`POST /v1/families/{familyId}/recipes/upload-image`)
- **API**: Reuse existing MinIO upload infrastructure from rewards
- **Web**: Extend Redux recipes slice with `uploadRecipeImage` thunk and upload state
- **Web**: Add image upload UI to recipe create/edit dialogs (matching rewards pattern)
- **Web**: Display recipe image on RecipeCard component in the overview grid
- **Web**: Add translations for image upload UI in both en-US and nl-NL
- **Tests**: Add E2E tests for image upload workflows with page object helpers
- **Tests**: Add unit tests for recipes Redux slice with 100% coverage of new code

## Impact

- Affected specs: `recipes`, `web-recipes` (new capability to be created)
- Affected code:
  - `apps/api/src/modules/recipes/` (domain, validators, routes, repository, service)
  - `apps/web/src/store/slices/recipes.slice.ts`
  - `apps/web/src/components/recipes/RecipeCard.tsx`
  - `apps/web/src/components/recipes/CreateRecipeDialog.tsx`
  - `apps/web/src/lib/api-client.ts`
  - `apps/web/src/types/api.types.ts`
  - `apps/web/src/dictionaries/*/dashboard/recipes.json`
  - `apps/web/tests/e2e/pages/recipes.page.ts`
  - `apps/web/tests/e2e/app/recipes.spec.ts`
  - `apps/web/tests/unit/store/slices/recipes.slice.test.ts`
