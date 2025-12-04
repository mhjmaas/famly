# Tasks: Add Web Recipes Feature

## 1. Foundation - Types and API Client

- [x] 1.1 Add Recipe types to `apps/web/src/types/api.types.ts` (Recipe, CreateRecipeRequest, UpdateRecipeRequest, SearchRecipesRequest)
- [x] 1.2 Add recipe API client functions to `apps/web/src/lib/api-client.ts` (getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe, searchRecipes)

## 2. Redux Store

- [x] 2.1 Create `apps/web/src/store/slices/recipes.slice.ts` with state, async thunks (fetchRecipes, fetchRecipe, createRecipe, updateRecipe, deleteRecipe, searchRecipes), reducers (clearError, setSearchQuery, toggleStepComplete, resetStepProgress), and selectors
- [x] 2.2 Register recipes reducer in `apps/web/src/store/store.ts`
- [x] 2.3 Write unit tests for recipes slice in `apps/web/tests/unit/store/recipes.slice.test.ts` achieving 100% coverage

## 3. Translations

- [x] 3.1 Create `apps/web/src/dictionaries/en-US/dashboard/recipes.json` with all recipe-related translations
- [x] 3.2 Create `apps/web/src/dictionaries/nl-NL/dashboard/recipes.json` with Dutch translations
- [x] 3.3 Update dictionary index to include recipes translations

## 4. Recipes List Page Components

- [x] 4.1 Create `apps/web/src/components/recipes/RecipeCard.tsx` - individual recipe card with name, description, duration badge, tags, actions menu
- [x] 4.2 Create `apps/web/src/components/recipes/RecipeGrid.tsx` - responsive grid layout for recipe cards
- [x] 4.3 Create `apps/web/src/components/recipes/RecipeSearch.tsx` - search input with results count header
- [x] 4.4 Create `apps/web/src/components/recipes/RecipeEmptyState.tsx` - empty state with create CTA
- [x] 4.5 Create `apps/web/src/components/recipes/CreateRecipeDialog.tsx` - dialog with title, description, duration, tags fields
- [x] 4.6 Create `apps/web/src/components/recipes/RecipesView.tsx` - main container composing search, grid, empty state, dialog

## 5. Recipe Detail Page Components

- [x] 5.1 Create `apps/web/src/components/recipes/RecipeStepItem.tsx` - step with checkbox, text, edit/delete actions
- [x] 5.2 Create `apps/web/src/components/recipes/RecipeStepList.tsx` - list of steps with progress indicator
- [x] 5.3 Create `apps/web/src/components/recipes/AddStepForm.tsx` - inline form to add new step
- [x] 5.4 Create `apps/web/src/components/recipes/EditRecipeDialog.tsx` - dialog for editing recipe metadata
- [x] 5.5 Create `apps/web/src/components/recipes/RecipeDetailView.tsx` - detail page with metadata, steps, edit/delete actions

## 6. Pages and Routing

- [x] 6.1 Create `apps/web/src/app/[lang]/app/recipes/page.tsx` - recipes list page
- [x] 6.2 Create `apps/web/src/app/[lang]/app/recipes/[id]/page.tsx` - recipe detail page

## 7. E2E Tests

- [x] 7.1 Create `apps/web/tests/e2e/pages/recipes.page.ts` - page object with all locators and helper methods
- [x] 7.2 Create `apps/web/tests/e2e/app/recipes.spec.ts` with test suites:
  - Page load and empty state
  - Create recipe via dialog
  - Search recipes
  - Navigate to detail page
  - Toggle step completion
  - Add new step
  - Edit step
  - Delete step
  - Edit recipe metadata
  - Delete recipe
  - Responsive layout tests

## 8. Integration and Polish

- [x] 8.1 Add recipes navigation link to dashboard layout/sidebar
- [x] 8.2 Verify all data-testid attributes are in place for E2E tests
- [x] 8.3 Run full test suite and fix any issues
- [x] 8.4 Manual testing of all flows on desktop and mobile viewports

## 9. AI Chat Tools

- [x] 9.1 Create `listRecipesTool` - List all recipes for a family
- [x] 9.2 Create `getRecipeTool` - Get details of a specific recipe
- [x] 9.3 Create `createRecipeTool` - Create a new recipe
- [x] 9.4 Create `updateRecipeTool` - Update an existing recipe
- [x] 9.5 Create `deleteRecipeTool` - Delete a recipe
- [x] 9.6 Register recipe tools in chat route
