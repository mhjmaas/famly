# web-recipes Specification Delta

## ADDED Requirements

### Requirement: Recipes List Page

The web app SHALL provide a recipes list page at `/[lang]/app/recipes` that displays all family recipes in a responsive grid layout.

#### Scenario: Display recipes grid

- **GIVEN** an authenticated family member navigates to the recipes page
- **WHEN** the page loads
- **THEN** the system displays a grid of recipe cards
- **AND** each card shows the recipe name, description, duration badge, and tags
- **AND** each card has an actions menu with Edit and Delete options
- **AND** each card has a "View Details" link to the recipe detail page

#### Scenario: Empty state when no recipes exist

- **GIVEN** an authenticated family member with no recipes
- **WHEN** they navigate to the recipes page
- **THEN** the system displays an empty state with a "Create Recipe" call-to-action

#### Scenario: Responsive grid layout

- **GIVEN** an authenticated family member on the recipes page
- **WHEN** viewing on desktop (lg breakpoint and above)
- **THEN** recipes display in a 3-column grid
- **WHEN** viewing on tablet (md breakpoint)
- **THEN** recipes display in a 2-column grid
- **WHEN** viewing on mobile (below md breakpoint)
- **THEN** recipes display in a single column

### Requirement: Recipe Search

The web app SHALL provide search functionality to filter recipes by name, description, or tags.

#### Scenario: Search recipes by query

- **GIVEN** an authenticated family member on the recipes page
- **WHEN** they enter a search query in the search input
- **THEN** the system filters recipes matching the query in name, description, or tags
- **AND** displays a results header showing the count of matching recipes

#### Scenario: Clear search

- **GIVEN** an authenticated family member with an active search query
- **WHEN** they click the "Clear search" button
- **THEN** the search query is cleared
- **AND** all recipes are displayed

#### Scenario: No search results

- **GIVEN** an authenticated family member searching for a non-existent recipe
- **WHEN** no recipes match the query
- **THEN** the system displays a "No recipes found" message with suggestion to adjust search terms

### Requirement: Create Recipe Dialog

The web app SHALL provide a dialog for creating new recipes with basic information fields.

#### Scenario: Open create recipe dialog

- **GIVEN** an authenticated family member on the recipes page
- **WHEN** they click the "Add Recipe" button
- **THEN** a dialog opens with fields for title, description, duration, and tags

#### Scenario: Create recipe with required fields

- **GIVEN** an authenticated family member with the create dialog open
- **WHEN** they fill in the recipe name and description and click "Create"
- **THEN** the recipe is created via the API
- **AND** the dialog closes
- **AND** the new recipe appears in the grid
- **AND** a success toast is displayed

#### Scenario: Create recipe with all fields

- **GIVEN** an authenticated family member with the create dialog open
- **WHEN** they fill in name, description, duration (in minutes), and comma-separated tags
- **THEN** all fields are saved to the recipe

#### Scenario: Validation prevents empty name

- **GIVEN** an authenticated family member with the create dialog open
- **WHEN** they attempt to submit without a recipe name
- **THEN** the form shows a validation error
- **AND** the dialog remains open

### Requirement: Recipe Detail Page

The web app SHALL provide a recipe detail page at `/[lang]/app/recipes/[id]` showing full recipe information and step-by-step instructions.

#### Scenario: Display recipe details

- **GIVEN** an authenticated family member
- **WHEN** they navigate to a recipe detail page
- **THEN** the system displays the recipe name, description, duration, tags, creator name, and creation date
- **AND** displays a list of steps with checkboxes

#### Scenario: Navigate back to recipes list

- **GIVEN** an authenticated family member on a recipe detail page
- **WHEN** they click the back button or breadcrumb link
- **THEN** they are navigated to the recipes list page

#### Scenario: Recipe not found

- **GIVEN** an authenticated family member
- **WHEN** they navigate to a non-existent recipe ID
- **THEN** the system displays a "Recipe not found" error

### Requirement: Step Progress Tracking

The web app SHALL allow family members to track progress through recipe steps by checking them off.

#### Scenario: Toggle step completion

- **GIVEN** an authenticated family member on a recipe detail page
- **WHEN** they click the checkbox next to a step
- **THEN** the step is marked as completed with a strikethrough style
- **AND** the progress indicator updates (e.g., "3 of 8 completed")

#### Scenario: Uncheck completed step

- **GIVEN** an authenticated family member with a completed step
- **WHEN** they click the checkbox again
- **THEN** the step is marked as incomplete
- **AND** the strikethrough style is removed

#### Scenario: Reset all steps

- **GIVEN** an authenticated family member with some completed steps
- **WHEN** they click the "Reset All" button
- **THEN** all steps are marked as incomplete
- **AND** a confirmation toast is displayed

#### Scenario: All steps completed celebration

- **GIVEN** an authenticated family member
- **WHEN** they complete the last step
- **THEN** a celebration message is displayed (e.g., "Recipe completed! Enjoy your meal!")

### Requirement: Step Management

The web app SHALL allow family members to add, edit, and remove recipe steps on the detail page.

#### Scenario: Add new step

- **GIVEN** an authenticated family member on a recipe detail page
- **WHEN** they enter text in the "Add step" input and submit
- **THEN** the new step is added to the end of the steps list
- **AND** the recipe is updated via the API
- **AND** the input is cleared

#### Scenario: Edit existing step

- **GIVEN** an authenticated family member on a recipe detail page
- **WHEN** they click the edit button on a step
- **THEN** the step text becomes editable inline
- **WHEN** they save the changes
- **THEN** the step is updated via the API

#### Scenario: Delete step

- **GIVEN** an authenticated family member on a recipe detail page
- **WHEN** they click the delete button on a step
- **THEN** the step is removed from the list
- **AND** the recipe is updated via the API

### Requirement: Edit Recipe Metadata

The web app SHALL allow family members to edit recipe metadata (name, description, duration, tags) via a dialog.

#### Scenario: Open edit recipe dialog

- **GIVEN** an authenticated family member on a recipe detail page
- **WHEN** they click the Edit button
- **THEN** a dialog opens pre-filled with the current recipe metadata

#### Scenario: Update recipe metadata

- **GIVEN** an authenticated family member with the edit dialog open
- **WHEN** they modify the fields and click "Update"
- **THEN** the recipe is updated via the API
- **AND** the dialog closes
- **AND** the detail page reflects the changes
- **AND** a success toast is displayed

### Requirement: Delete Recipe

The web app SHALL allow family members to delete recipes.

#### Scenario: Delete recipe from detail page

- **GIVEN** an authenticated family member on a recipe detail page
- **WHEN** they click the Delete button
- **THEN** the recipe is deleted via the API
- **AND** they are navigated to the recipes list page
- **AND** a success toast is displayed

#### Scenario: Delete recipe from list page

- **GIVEN** an authenticated family member on the recipes list page
- **WHEN** they click Delete from a recipe card's actions menu
- **THEN** the recipe is deleted via the API
- **AND** the recipe is removed from the grid
- **AND** a success toast is displayed

### Requirement: Redux State Management

The web app SHALL manage recipe state through a dedicated Redux slice with full CRUD operations.

#### Scenario: Fetch recipes on page load

- **GIVEN** an authenticated family member navigating to the recipes page
- **WHEN** the page mounts
- **THEN** the recipes slice dispatches fetchRecipes thunk
- **AND** sets isLoading to true during the request
- **AND** populates the recipes array on success

#### Scenario: Handle fetch error

- **GIVEN** an authenticated family member
- **WHEN** the fetchRecipes API call fails
- **THEN** the slice sets error state with the error message
- **AND** the UI displays the error

#### Scenario: Optimistic update on create

- **GIVEN** an authenticated family member creating a recipe
- **WHEN** the createRecipe thunk is dispatched
- **THEN** the new recipe is added to the state on success

#### Scenario: Step progress stored in Redux

- **GIVEN** an authenticated family member toggling step completion
- **WHEN** they check/uncheck a step
- **THEN** the stepProgress state is updated with the step's completion status
- **AND** progress persists during the session but not across page reloads

### Requirement: Internationalization

The web app SHALL support English (en-US) and Dutch (nl-NL) translations for all recipe-related UI text.

#### Scenario: English translations

- **GIVEN** a user with language preference set to en-US
- **WHEN** they view the recipes pages
- **THEN** all UI text is displayed in English

#### Scenario: Dutch translations

- **GIVEN** a user with language preference set to nl-NL
- **WHEN** they view the recipes pages
- **THEN** all UI text is displayed in Dutch

### Requirement: E2E Test Coverage

The web app SHALL include comprehensive E2E tests for recipe functionality using Playwright.

#### Scenario: E2E tests use page object pattern

- **GIVEN** the E2E test suite
- **WHEN** tests interact with the recipes pages
- **THEN** they use a RecipesPage page object for locators and helpers

#### Scenario: E2E tests use data-testid attributes

- **GIVEN** the recipes components
- **WHEN** rendered in the browser
- **THEN** all interactive elements have data-testid attributes for E2E test targeting

### Requirement: Unit Test Coverage

The web app SHALL include 100% unit test coverage for the recipes Redux slice.

#### Scenario: Test all async thunks

- **GIVEN** the recipes slice unit tests
- **WHEN** executed
- **THEN** all async thunks are tested for pending, fulfilled, and rejected states

#### Scenario: Test all reducers

- **GIVEN** the recipes slice unit tests
- **WHEN** executed
- **THEN** all synchronous reducers are tested (clearError, setSearchQuery, toggleStepComplete, resetStepProgress)

#### Scenario: Test all selectors

- **GIVEN** the recipes slice unit tests
- **WHEN** executed
- **THEN** all selectors are tested for correct state selection
