# Design: Web Recipes Feature

## Context

The backend API (`apps/api/src/modules/recipes`) already provides full CRUD and search functionality for recipes. This change adds the web frontend to consume these APIs. The design follows existing patterns from the tasks and shopping lists features.

## Goals / Non-Goals

### Goals

- Provide a recipes list page with grid layout and search functionality
- Provide a recipe detail page with step-by-step progress tracking
- Allow any family member to create, edit, and delete recipes
- Support inline step management on the detail page
- Follow existing code patterns and design system
- Match the reference design in `reference/v0-famly/components/`

### Non-Goals

- Recipe image uploads (not in current API)
- Recipe sharing between families
- Meal planning integration
- Nutritional information

## Decisions

### 1. Redux Store Structure

**Decision**: Create a dedicated `recipes.slice.ts` following the `tasks.slice.ts` pattern.

**State shape**:

```typescript
interface RecipesState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  stepProgress: Record<string, boolean>; // recipeId-stepIndex -> completed
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: Recipe[];
  isSearching: boolean;
}
```

**Rationale**: Step progress is stored locally in Redux (not persisted to API) since the API stores steps as strings, not objects with completion state. This matches the reference design behavior where step completion is session-based.

### 2. Component Architecture

**Decision**: Split into logical components following the tasks pattern:

```
components/recipes/
├── RecipesView.tsx          # Main container with search and grid
├── RecipeCard.tsx           # Individual recipe card in grid
├── RecipeGrid.tsx           # Grid layout wrapper
├── RecipeSearch.tsx         # Search input with results header
├── RecipeEmptyState.tsx     # Empty state for no recipes
├── CreateRecipeDialog.tsx   # Dialog for creating new recipes
├── RecipeDetailView.tsx     # Detail page content
├── RecipeStepList.tsx       # List of steps with checkboxes
├── RecipeStepItem.tsx       # Individual step with checkbox
├── AddStepForm.tsx          # Inline form to add new steps
├── EditRecipeDialog.tsx     # Dialog for editing recipe metadata
```

**Rationale**: Smaller components improve testability and reusability. Matches the granularity of `components/tasks/`.

### 3. Create Recipe Dialog

**Decision**: The create dialog only collects basic info (title, description, duration, tags). Steps are added on the detail page.

**Rationale**:

- Matches user request for "basic information" in create dialog
- Steps can be lengthy; inline editing on detail page is more ergonomic
- Follows progressive disclosure pattern

### 4. Step Management

**Decision**: Steps are managed inline on the detail page with:

- Add step form at the bottom
- Edit step inline (click to edit)
- Delete step via icon button
- Drag-to-reorder (optional enhancement)

**Rationale**: Quick modification of steps without modal dialogs improves UX for recipe editing.

### 5. API Client Functions

**Decision**: Add to existing `api-client.ts`:

```typescript
// Recipe CRUD
getRecipes(familyId: string): Promise<Recipe[]>
getRecipe(familyId: string, recipeId: string): Promise<Recipe>
createRecipe(familyId: string, data: CreateRecipeRequest): Promise<Recipe>
updateRecipe(familyId: string, recipeId: string, data: UpdateRecipeRequest): Promise<Recipe>
deleteRecipe(familyId: string, recipeId: string): Promise<void>
searchRecipes(familyId: string, query: string): Promise<Recipe[]>
```

### 6. Type Definitions

**Decision**: Add to `api.types.ts`:

```typescript
interface Recipe {
  _id: string;
  familyId: string;
  name: string;
  description: string;
  durationMinutes?: number;
  steps: string[];
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateRecipeRequest {
  name: string;
  description: string;
  durationMinutes?: number;
  steps: string[];
  tags?: string[];
}

interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  durationMinutes?: number | null;
  steps?: string[];
  tags?: string[];
}

interface SearchRecipesRequest {
  query: string;
  limit?: number;
  offset?: number;
}
```

### 7. Routing

**Decision**:

- List page: `/[lang]/app/recipes/page.tsx`
- Detail page: `/[lang]/app/recipes/[id]/page.tsx`

### 8. Translations

**Decision**: Add `dictionaries/en-US/dashboard/recipes.json` and `dictionaries/nl-NL/dashboard/recipes.json` following the tasks translation structure.

### 9. Test Strategy

**E2E Tests** (`tests/e2e/app/recipes.spec.ts`):

- Page load and empty state
- Create recipe via dialog
- Search recipes
- Navigate to detail page
- Toggle step completion
- Add/edit/delete steps
- Edit recipe metadata
- Delete recipe

**Unit Tests** (`tests/unit/store/recipes.slice.test.ts`):

- Initial state
- All async thunks (pending, fulfilled, rejected)
- All reducers (clearError, setSearchQuery, toggleStepComplete, resetStepProgress)
- All selectors
- 100% coverage requirement

**Page Object** (`tests/e2e/pages/recipes.page.ts`):

- All locators using `data-testid` attributes
- Helper methods for common actions

## Risks / Trade-offs

| Risk                        | Mitigation                                                |
| --------------------------- | --------------------------------------------------------- |
| Step progress not persisted | Document as session-only; future API enhancement possible |
| Large recipe lists          | Implement pagination or virtual scrolling if needed       |
| Search performance          | Use debounced search input                                |

## Open Questions

None - design follows established patterns.
