# web-shopping-lists Specification

## Purpose
TBD - created by archiving change add-web-shopping-lists. Update Purpose after archive.
## Requirements
### Requirement: Shopping Lists Page Display
The web application MUST display a shopping lists page with header, list of shopping lists, and empty state when no lists exist.

#### Scenario: Display page with shopping lists
- **GIVEN** an authenticated family member with existing shopping lists
- **WHEN** they navigate to `/[lang]/app/shopping-lists`
- **THEN** the page displays a header with title "Shopping Lists" and description
- **AND** a "New List" button is visible on desktop
- **AND** all shopping lists are displayed grouped by active (no completedAt) and completed (all items checked)
- **AND** completed lists are grouped by completion date with date separators

#### Scenario: Display empty state
- **GIVEN** an authenticated family member with no shopping lists
- **WHEN** they navigate to the shopping lists page
- **THEN** an empty state card is displayed with shopping cart icon
- **AND** a "Create List" button is shown to create the first list

#### Scenario: Display loading state
- **GIVEN** an authenticated family member
- **WHEN** the shopping lists are being fetched
- **THEN** a loading indicator is displayed

### Requirement: Shopping List Card Display
The web application MUST display each shopping list as a card with name, tags, items, and action controls.

#### Scenario: Display active shopping list card
- **GIVEN** an authenticated family member viewing shopping lists
- **WHEN** a shopping list has unchecked items
- **THEN** the card displays the list name prominently
- **AND** tags are displayed as badges next to the name
- **AND** item count shows "X of Y items checked"
- **AND** each item is displayed with a checkbox and name
- **AND** a "Check All" button is visible when items exist
- **AND** a menu button with edit and delete options is visible

#### Scenario: Display completed shopping list card
- **GIVEN** an authenticated family member viewing shopping lists
- **WHEN** all items in a shopping list are checked
- **THEN** the card is displayed with reduced opacity
- **AND** the list name has strikethrough styling
- **AND** checked items show strikethrough text

#### Scenario: Display item checked state
- **GIVEN** a shopping list with items
- **WHEN** an item is checked
- **THEN** the checkbox shows checked state
- **AND** the item name has strikethrough and muted color

### Requirement: Shopping List Creation
The web application MUST allow family members to create new shopping lists via a dialog.

#### Scenario: Open create dialog from header button
- **GIVEN** an authenticated family member on the shopping lists page
- **WHEN** they click the "New List" button
- **THEN** a dialog opens with title "Create New Shopping List"
- **AND** a name input field is displayed (required)
- **AND** an "Add Tags" button is displayed to optionally add tags
- **AND** Cancel and "Create List" buttons are displayed

#### Scenario: Create shopping list with name only
- **GIVEN** the create dialog is open
- **WHEN** the user enters a name and clicks "Create List"
- **THEN** the API is called to create the shopping list
- **AND** the dialog closes
- **AND** the new shopping list appears in the list

#### Scenario: Create shopping list with tags
- **GIVEN** the create dialog is open
- **WHEN** the user clicks "Add Tags" and enters tags
- **AND** clicks "Create List"
- **THEN** the shopping list is created with the specified tags

#### Scenario: Add tag via enter key
- **GIVEN** the tags input is visible
- **WHEN** the user types a tag and presses Enter
- **THEN** the tag is added to the list of tags
- **AND** the input is cleared for the next tag

#### Scenario: Remove tag before creation
- **GIVEN** tags have been added to the form
- **WHEN** the user clicks the X button on a tag badge
- **THEN** the tag is removed from the list

#### Scenario: Validation prevents empty name
- **GIVEN** the create dialog is open
- **WHEN** the user clicks "Create List" without entering a name
- **THEN** the form is not submitted
- **AND** the name field shows validation feedback

### Requirement: Shopping List Editing
The web application MUST allow family members to edit shopping list name and tags via a dialog.

#### Scenario: Open edit dialog from menu
- **GIVEN** an authenticated family member viewing a shopping list
- **WHEN** they click the menu button and select "Edit"
- **THEN** a dialog opens with title "Edit Shopping List"
- **AND** the name field is pre-populated with the current name
- **AND** existing tags are displayed

#### Scenario: Update shopping list name
- **GIVEN** the edit dialog is open
- **WHEN** the user changes the name and clicks "Update List"
- **THEN** the API is called to update the shopping list
- **AND** the dialog closes
- **AND** the updated name is displayed

#### Scenario: Update shopping list tags
- **GIVEN** the edit dialog is open
- **WHEN** the user adds or removes tags and clicks "Update List"
- **THEN** the shopping list tags are updated

### Requirement: Shopping List Deletion
The web application MUST allow family members to delete shopping lists with confirmation.

#### Scenario: Delete shopping list from menu
- **GIVEN** an authenticated family member viewing a shopping list
- **WHEN** they click the menu button and select "Delete"
- **THEN** a confirmation dialog appears
- **AND** the dialog shows the list name being deleted

#### Scenario: Confirm deletion
- **GIVEN** the delete confirmation dialog is open
- **WHEN** the user clicks "Delete"
- **THEN** the API is called to delete the shopping list
- **AND** the dialog closes
- **AND** the shopping list is removed from the view

#### Scenario: Cancel deletion
- **GIVEN** the delete confirmation dialog is open
- **WHEN** the user clicks "Cancel"
- **THEN** the dialog closes
- **AND** the shopping list remains unchanged

### Requirement: Shopping List Item Management
The web application MUST allow family members to add, check, and manage items within shopping lists.

#### Scenario: Add item via inline input
- **GIVEN** an authenticated family member viewing an active shopping list
- **WHEN** they type an item name in the add item input and press Enter
- **THEN** the API is called to add the item
- **AND** the new item appears in the list unchecked
- **AND** the input is cleared

#### Scenario: Add item via button
- **GIVEN** an authenticated family member viewing an active shopping list
- **WHEN** they type an item name and click the add button
- **THEN** the item is added to the list

#### Scenario: Check item as purchased
- **GIVEN** a shopping list with unchecked items
- **WHEN** the user clicks the checkbox for an item
- **THEN** the API is called to update the item checked status
- **AND** the item displays as checked with strikethrough

#### Scenario: Uncheck item
- **GIVEN** a shopping list with checked items
- **WHEN** the user clicks the checkbox for a checked item
- **THEN** the item is unchecked
- **AND** the strikethrough styling is removed

#### Scenario: Check all items
- **GIVEN** a shopping list with unchecked items
- **WHEN** the user clicks "Check All"
- **THEN** all items are marked as checked
- **AND** the list moves to the completed section

#### Scenario: Uncheck all items
- **GIVEN** a shopping list with all items checked
- **WHEN** the user clicks "Uncheck All"
- **THEN** all items are unchecked
- **AND** the list moves back to the active section

### Requirement: Shopping Lists Redux State Management
The web application MUST manage shopping list state via Redux with proper loading, error handling, and optimistic updates.

#### Scenario: Fetch shopping lists on page load
- **GIVEN** an authenticated family member
- **WHEN** they navigate to the shopping lists page
- **THEN** the Redux store dispatches fetchShoppingLists action
- **AND** loading state is set to true during fetch
- **AND** shopping lists are stored in state on success

#### Scenario: Handle fetch error
- **GIVEN** the API returns an error when fetching shopping lists
- **WHEN** the fetch completes
- **THEN** the error is stored in Redux state
- **AND** an error message is displayed to the user

#### Scenario: Optimistic create
- **GIVEN** a user creates a new shopping list
- **WHEN** the create action is dispatched
- **THEN** the new list appears immediately in the UI
- **AND** the API call is made in the background

#### Scenario: Optimistic update
- **GIVEN** a user updates a shopping list or item
- **WHEN** the update action is dispatched
- **THEN** the change appears immediately in the UI
- **AND** the API call is made in the background

#### Scenario: Optimistic delete
- **GIVEN** a user deletes a shopping list
- **WHEN** the delete action is dispatched
- **THEN** the list is removed immediately from the UI
- **AND** the API call is made in the background

### Requirement: Shopping Lists Internationalization
The web application MUST support internationalization for all shopping list UI text.

#### Scenario: Display English translations
- **GIVEN** the user's locale is en-US
- **WHEN** they view the shopping lists page
- **THEN** all UI text is displayed in English

#### Scenario: Display Dutch translations
- **GIVEN** the user's locale is nl-NL
- **WHEN** they view the shopping lists page
- **THEN** all UI text is displayed in Dutch

### Requirement: Shopping Lists Responsive Design
The web application MUST provide responsive layouts for desktop and mobile viewports.

#### Scenario: Desktop layout
- **GIVEN** the user is on a desktop viewport (lg breakpoint and above)
- **WHEN** they view the shopping lists page
- **THEN** the header with title and "New List" button is visible
- **AND** shopping list cards are displayed at full width

#### Scenario: Mobile layout
- **GIVEN** the user is on a mobile viewport (below lg breakpoint)
- **WHEN** they view the shopping lists page
- **THEN** the desktop header is hidden
- **AND** a mobile-friendly "New List" button is displayed at the bottom
- **AND** shopping list cards adapt to mobile width

### Requirement: Shopping Lists E2E Test Coverage
The web application MUST have E2E tests using page object pattern with data-testid attributes.

#### Scenario: Page object provides locators
- **GIVEN** the shopping lists page object class
- **WHEN** tests need to interact with elements
- **THEN** locators are available for all interactive elements via data-testid

#### Scenario: Page object provides navigation helpers
- **GIVEN** the shopping lists page object class
- **WHEN** tests need to navigate to the page
- **THEN** a gotoShoppingLists method is available

#### Scenario: Page object provides form helpers
- **GIVEN** the shopping lists page object class
- **WHEN** tests need to fill forms
- **THEN** helper methods are available for filling create/edit forms

### Requirement: Shopping Lists Redux Unit Test Coverage
The web application MUST have 100% unit test coverage for the shopping lists Redux slice.

#### Scenario: Test initial state
- **GIVEN** the shopping lists slice
- **WHEN** the store is initialized
- **THEN** the initial state has empty lists array, loading false, and null error

#### Scenario: Test fetch thunk success
- **GIVEN** the fetchShoppingLists thunk
- **WHEN** the API returns shopping lists
- **THEN** the lists are stored in state and loading is false

#### Scenario: Test fetch thunk error
- **GIVEN** the fetchShoppingLists thunk
- **WHEN** the API returns an error
- **THEN** the error is stored in state and loading is false

#### Scenario: Test create thunk
- **GIVEN** the createShoppingList thunk
- **WHEN** a new list is created
- **THEN** the list is added to state

#### Scenario: Test update thunk
- **GIVEN** the updateShoppingList thunk
- **WHEN** a list is updated
- **THEN** the list is updated in state

#### Scenario: Test delete thunk
- **GIVEN** the deleteShoppingList thunk
- **WHEN** a list is deleted
- **THEN** the list is removed from state

#### Scenario: Test item thunks
- **GIVEN** the addItem, updateItem thunks
- **WHEN** items are added or updated
- **THEN** the shopping list items are updated in state

#### Scenario: Test selectors
- **GIVEN** the shopping lists selectors
- **WHEN** selecting state
- **THEN** selectShoppingLists, selectShoppingListsLoading, selectShoppingListsError return correct values

