# Tasks: add-recipes

Implementation tasks to deliver the recipes capability. Complete in order.

## Phase 1: Foundation & Domain

- [x] Create `apps/api/src/modules/recipes/domain/recipe.ts` with Recipe, RecipeItem entities and DTOs
- [x] Create `apps/api/src/modules/recipes/lib/recipe.mapper.ts` to convert domain objects to HTTP DTOs
- [x] Create unit tests for recipe.mapper.ts

## Phase 2: Data Access

- [x] Create `apps/api/src/modules/recipes/repositories/recipe.repository.ts` with methods:
  - `create(recipe: Recipe): Promise<Recipe>`
  - `getById(familyId: ObjectId, recipeId: ObjectId): Promise<Recipe | null>`
  - `listByFamily(familyId: ObjectId, limit: number, offset: number): Promise<Recipe[]>`
  - `search(familyId: ObjectId, query: string, limit: number, offset: number): Promise<Recipe[]>`
  - `update(familyId: ObjectId, recipeId: ObjectId, update: Partial<Recipe>): Promise<Recipe | null>`
  - `delete(familyId: ObjectId, recipeId: ObjectId): Promise<boolean>`
  - `countByFamily(familyId: ObjectId): Promise<number>`
- [x] Create unit tests for recipe.repository.ts (mock queries)

## Phase 3: Validators

- [x] Create `apps/api/src/modules/recipes/validators/create-recipe.validator.ts` with Zod schema for recipe creation
  - Validate: name (1–200 chars), description (1–2000 chars), steps (1+ array, each 1–500 chars), tags (0–20, each 1–50 chars)
- [x] Create `apps/api/src/modules/recipes/validators/update-recipe.validator.ts` for partial updates (all fields optional)
- [x] Create `apps/api/src/modules/recipes/validators/list-recipes.validator.ts` for pagination (limit, offset)
- [x] Create `apps/api/src/modules/recipes/validators/search-recipes.validator.ts` for search queries (query string, limit, offset)
- [x] Create unit tests for all validators

## Phase 4: Services

- [x] Create `apps/api/src/modules/recipes/services/recipe.service.ts` with methods:
  - `createRecipe(familyId: ObjectId, userId: ObjectId, input: CreateRecipeInput): Promise<Recipe>`
  - `getRecipe(familyId: ObjectId, recipeId: ObjectId): Promise<Recipe>`
  - `listRecipes(familyId: ObjectId, limit: number, offset: number): Promise<{ recipes: Recipe[]; total: number }>`
  - `updateRecipe(familyId: ObjectId, recipeId: ObjectId, input: UpdateRecipeInput): Promise<Recipe>`
  - `deleteRecipe(familyId: ObjectId, recipeId: ObjectId): Promise<void>`
  - `searchRecipes(familyId: ObjectId, query: string, limit: number, offset: number): Promise<{ recipes: Recipe[]; total: number }>`
- [x] Create unit tests for recipe.service.ts

## Phase 5: Routes & Middleware

- [x] Create `apps/api/src/modules/recipes/middleware/index.ts` to reuse family auth and verification from existing modules
- [x] Create `apps/api/src/modules/recipes/routes/create-recipe.route.ts` (POST /v1/families/:familyId/recipes)
- [x] Create `apps/api/src/modules/recipes/routes/list-recipes.route.ts` (GET /v1/families/:familyId/recipes)
- [x] Create `apps/api/src/modules/recipes/routes/get-recipe.route.ts` (GET /v1/families/:familyId/recipes/:recipeId)
- [x] Create `apps/api/src/modules/recipes/routes/update-recipe.route.ts` (PATCH /v1/families/:familyId/recipes/:recipeId)
- [x] Create `apps/api/src/modules/recipes/routes/delete-recipe.route.ts` (DELETE /v1/families/:familyId/recipes/:recipeId)
- [x] Create `apps/api/src/modules/recipes/routes/search-recipes.route.ts` (POST /v1/families/:familyId/recipes/search)
- [x] Create `apps/api/src/modules/recipes/routes/recipes.router.ts` to aggregate all routes
- [x] Create `apps/api/src/modules/recipes/index.ts` with module exports

## Phase 5b: Bruno Collection

- [x] Create `bruno/Famly/recipes/folder.bru` with folder metadata
- [x] Create `bruno/Famly/recipes/create-recipe.bru` with POST example to create recipe
- [x] Create `bruno/Famly/recipes/list-recipes.bru` with GET example to list recipes
- [x] Create `bruno/Famly/recipes/get-recipe.bru` with GET example to retrieve single recipe
- [x] Create `bruno/Famly/recipes/update-recipe.bru` with PATCH example to update recipe
- [x] Create `bruno/Famly/recipes/delete-recipe.bru` with DELETE example to delete recipe
- [x] Create `bruno/Famly/recipes/search-recipes.bru` with POST example to search recipes

## Phase 6: Module Integration

- [x] Update `apps/api/src/modules/family/routes/families.route.ts` to:
  - Import `createRecipesRouter` from recipes module
  - Mount recipes router with `router.use("/:familyId/recipes", createRecipesRouter())`
  - Update JSDoc comment to include recipes endpoint documentation
- [x] Create `apps/api/src/modules/recipes/init.ts` (if needed for initialization logic)

## Phase 7: E2E Tests

- [x] Create `apps/api/tests/e2e/recipes/create-recipe.e2e.test.ts`
  - Test: Create with required fields only
  - Test: Create with tags
  - Test: Reject missing/invalid fields
  - Test: Reject non-member
- [x] Create `apps/api/tests/e2e/recipes/list-recipes.e2e.test.ts`
  - Test: List all recipes
  - Test: Empty list
  - Test: Pagination (limit, offset)
  - Test: Invalid pagination
- [x] Create `apps/api/tests/e2e/recipes/get-recipe.e2e.test.ts`
  - Test: Get by ID
  - Test: Not found
  - Test: Access denied for non-member
- [x] Create `apps/api/tests/e2e/recipes/update-recipe.e2e.test.ts`
  - Test: Update name/description/steps/tags
  - Test: Partial update preserves other fields
  - Test: Reject invalid updates
  - Test: Not found
- [x] Create `apps/api/tests/e2e/recipes/delete-recipe.e2e.test.ts`
  - Test: Delete successfully
  - Test: Not found
  - Test: Recipe removed from DB
- [x] Create `apps/api/tests/e2e/recipes/search-recipes.e2e.test.ts`
  - Test: Search by name
  - Test: Search by description
  - Test: Case-insensitive
  - Test: Empty results
  - Test: Pagination in search
  - Test: Family scope isolation
  - Test: Reject empty query
- [x] Create `apps/api/tests/e2e/recipes/authorization.e2e.test.ts`
  - Test: Non-member cannot create/read/update/delete
  - Test: Non-member cannot search
  - Test: Both parents and children can manage recipes
  - Test: Unauthenticated requests rejected

## Phase 8: Validation & Documentation

- [x] Run `openspec validate add-recipes --strict` and resolve any issues
- [x] Run `pnpm test:unit` to ensure all unit tests pass
- [x] Run `pnpm test:e2e` to ensure all e2e tests pass
- [x] Run `pnpm run lint` to check linting and formatting
- [x] Verify all requirements from `spec.md` have corresponding tests with passing scenarios

## Phase 9: Final Review

- [x] Update `openspec/changes/add-recipes/tasks.md` with `[x]` for all completed tasks
- [x] Prepare PR description with summary of changes
- [x] Request review and merge after approval
