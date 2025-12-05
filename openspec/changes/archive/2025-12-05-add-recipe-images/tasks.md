# Tasks: Add Recipe Image Support

## 1. API Implementation

- [x] 1.1 Add `imageUrl` field to Recipe domain interface (`apps/api/src/modules/recipes/domain/recipe.ts`)
- [x] 1.2 Update `CreateRecipeInput` and `UpdateRecipeInput` types to include optional `imageUrl`
- [x] 1.3 Update `RecipeDTO` to include optional `imageUrl`
- [x] 1.4 Update recipe mapper to include `imageUrl` in DTO conversion
- [x] 1.5 Update `create-recipe.validator.ts` to validate optional `imageUrl` (same rules as rewards: HTTP(S) URL or `/api/images/` path, max 500 chars)
- [x] 1.6 Update `update-recipe.validator.ts` to validate optional `imageUrl` with null support for clearing
- [x] 1.7 Update `RecipeRepository.create()` to persist `imageUrl`
- [x] 1.8 Update `RecipeRepository.update()` to handle `imageUrl` updates and clearing
- [x] 1.9 Create `upload-image.route.ts` for recipes (reuse upload service pattern from rewards)
- [x] 1.10 Create `uploadRecipeImage` function in a new or shared upload service
- [x] 1.11 Register upload route in `recipes.router.ts`
- [x] 1.12 Write API E2E tests for recipe image upload endpoint
- [x] 1.13 Write API E2E tests for create/update recipe with imageUrl

## 2. Web Application - Redux Store

- [x] 2.1 Add `uploadRecipeImage` async thunk to recipes slice
- [x] 2.2 Add `uploadError` state to RecipesState interface
- [x] 2.3 Update `createRecipe` thunk to accept optional `imageFile` and upload before create
- [x] 2.4 Update `updateRecipe` thunk to accept optional `imageFile` and upload before update
- [x] 2.5 Add extra reducers for upload pending/fulfilled/rejected states
- [x] 2.6 Add `selectUploadError` selector
- [x] 2.7 Write unit tests for `uploadRecipeImage` thunk (100% coverage)
- [x] 2.8 Write unit tests for `createRecipe` with image file (100% coverage)
- [x] 2.9 Write unit tests for `updateRecipe` with image file (100% coverage)
- [x] 2.10 Write unit tests for upload error handling (100% coverage)

## 3. Web Application - API Client

- [x] 3.1 Add `uploadRecipeImage` function to `api-client.ts`
- [x] 3.2 Update `Recipe` type in `api.types.ts` to include optional `imageUrl`
- [x] 3.3 Update `CreateRecipeRequest` type to include optional `imageUrl`
- [x] 3.4 Update `UpdateRecipeRequest` type to include optional `imageUrl`

## 4. Web Application - UI Components

- [x] 4.1 Create `RecipeImage` component (similar to `RewardImage`)
- [x] 4.2 Update `RecipeCard` to display recipe image at top of card
- [x] 4.3 Update `CreateRecipeDialog` to include image upload UI (file picker + URL input)
- [x] 4.4 Update `EditRecipeDialog` to include image upload UI with existing image preview
- [x] 4.5 Add file validation (type, size) in dialog components
- [x] 4.6 Add image preview functionality in dialogs
- [x] 4.7 Add remove image button functionality
- [x] 4.8 Update `RecipesView` to pass `imageFile` to create/update handlers
- [x] 4.9 Update `RecipeDetailView` to display recipe image
- [x] 4.10 Add `data-testid` attributes to all new image-related elements

## 5. Translations

- [x] 5.1 Add image upload translations to `en-US/dashboard/recipes.json`
- [x] 5.2 Add image upload translations to `nl-NL/dashboard/recipes.json`
- [x] 5.3 Verify all translation keys match rewards pattern (uploadButton, orLabel, urlPlaceholder, preview, remove, errors.fileSize, errors.fileType, errors.uploadFailed)

## 6. E2E Tests

- [x] 6.1 Add image upload locators to `recipes.page.ts` (fileInput, uploadButton, imagePreview, removeImageButton, uploadError)
- [x] 6.2 Add `uploadImage(filePath)` helper method to RecipesPage
- [x] 6.3 Add `removeUploadedImage()` helper method to RecipesPage
- [x] 6.4 Add `getUploadError()` helper method to RecipesPage
- [x] 6.5 Add `hasImagePreview()` helper method to RecipesPage
- [x] 6.6 Write E2E test: create recipe with uploaded image
- [x] 6.7 Write E2E test: edit recipe and upload new image
- [x] 6.8 Write E2E test: file validation errors (size, type)
- [x] 6.9 Write E2E test: remove uploaded image before submit
- [x] 6.10 Write E2E test: verify recipe card displays uploaded image
- [x] 6.11 Ensure all tests use `data-testid` attributes for locators

## 7. Verification

- [x] 7.1 Run `pnpm test` to verify all unit tests pass
- [x] 7.2 Run `pnpm run lint` to verify code style
- [x] 7.3 Run E2E tests to verify image upload workflows
- [x] 7.4 Manual verification: create recipe with image, verify display on card
- [x] 7.5 Manual verification: edit recipe image, verify update on card
