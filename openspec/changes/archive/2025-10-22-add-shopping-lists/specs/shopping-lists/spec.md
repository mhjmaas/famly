## ADDED Requirements

### Requirement: Shopping List Creation
Family members MUST be able to create shopping lists with a name, optional tags, and optional initial items.

#### Scenario: Create shopping list with name only
- **GIVEN** an authenticated family member with valid JWT token
- **WHEN** they POST to `/v1/families/{familyId}/shopping-lists` with `{ name: "Weekly Groceries" }`
- **THEN** the API responds with HTTP 201 and returns the created shopping list with generated `_id`, `createdBy`, `createdAt`, and `updatedAt` timestamps
- **AND** the shopping list is stored in the `shopping_lists` collection with an empty `items` array and empty `tags` array

#### Scenario: Create shopping list with tags
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/shopping-lists` with `{ name: "Costco Run", tags: ["groceries", "bulk"] }`
- **THEN** the shopping list is created with the specified tags array

#### Scenario: Create shopping list with initial items
- **GIVEN** an authenticated family member
- **WHEN** they POST with `{ name: "Party Supplies", items: [{ name: "Balloons" }, { name: "Cake" }] }`
- **THEN** the shopping list is created with the specified items
- **AND** each item has a generated `_id`, `checked: false`, and `createdAt` timestamp

#### Scenario: Reject list with missing name
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/shopping-lists` with a payload missing the `name` field
- **THEN** the API responds with HTTP 400 and a validation error message indicating `name` is required

#### Scenario: Reject list with name exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with a `name` exceeding 200 characters
- **THEN** the API responds with HTTP 400 and a validation error for name length

#### Scenario: Reject list with too many tags
- **GIVEN** an authenticated family member
- **WHEN** they POST with more than 20 tags
- **THEN** the API responds with HTTP 400 and a validation error indicating maximum 20 tags allowed

#### Scenario: Reject list with tag exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with a tag exceeding 50 characters
- **THEN** the API responds with HTTP 400 and a validation error for tag length

#### Scenario: Reject list for non-member
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to POST to `/v1/families/{familyId}/shopping-lists`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Shopping List Listing
Family members MUST be able to list all shopping lists for their family.

#### Scenario: List all family shopping lists
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/shopping-lists`
- **THEN** the API responds with HTTP 200 and an array of all shopping lists for the family
- **AND** each shopping list includes `_id`, `familyId`, `name`, `tags`, `items`, `createdBy`, `createdAt`, `updatedAt`
- **AND** lists are sorted by `createdAt` descending (newest first)

#### Scenario: Empty list for family with no shopping lists
- **GIVEN** an authenticated family member in a family with no shopping lists
- **WHEN** they GET `/v1/families/{familyId}/shopping-lists`
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: Items include checked status
- **GIVEN** an authenticated family member with shopping lists containing items
- **WHEN** they GET `/v1/families/{familyId}/shopping-lists`
- **THEN** each item in the response includes `_id`, `name`, `checked`, and `createdAt` fields

### Requirement: Shopping List Retrieval
Family members MUST be able to retrieve a specific shopping list by ID.

#### Scenario: Get shopping list by ID
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/shopping-lists/{listId}`
- **THEN** the API responds with HTTP 200 and the complete shopping list object with all items

#### Scenario: Shopping list not found
- **GIVEN** an authenticated family member
- **WHEN** they GET a non-existent shopping list ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Access denied for wrong family
- **GIVEN** an authenticated user who is a member of familyA but not familyB
- **WHEN** they GET `/v1/families/{familyB}/shopping-lists/{listId}`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Shopping List Update
Family members MUST be able to update shopping list name and tags.

#### Scenario: Update shopping list name
- **GIVEN** an authenticated family member
- **WHEN** they PATCH `/v1/families/{familyId}/shopping-lists/{listId}` with `{ name: "Updated Name" }`
- **THEN** the API responds with HTTP 200 and the updated shopping list
- **AND** `updatedAt` timestamp is refreshed

#### Scenario: Update shopping list tags
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ tags: ["urgent", "groceries"] }`
- **THEN** the shopping list tags are replaced with the new array

#### Scenario: Clear all tags
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ tags: [] }`
- **THEN** the shopping list tags array is emptied

#### Scenario: Reject update with invalid name
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with a name exceeding 200 characters
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Reject update with too many tags
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with more than 20 tags
- **THEN** the API responds with HTTP 400 and validation error

### Requirement: Shopping List Deletion
Family members MUST be able to delete shopping lists.

#### Scenario: Delete shopping list successfully
- **GIVEN** an authenticated family member
- **WHEN** they DELETE `/v1/families/{familyId}/shopping-lists/{listId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the shopping list and all its items are removed from the database

#### Scenario: Delete removes all items
- **GIVEN** a shopping list with multiple items
- **WHEN** the shopping list is deleted
- **THEN** all items are removed along with the list (embedded document pattern)

#### Scenario: Cannot delete non-existent list
- **GIVEN** an authenticated family member
- **WHEN** they DELETE a non-existent shopping list ID
- **THEN** the API responds with HTTP 404 Not Found

### Requirement: Shopping List Item Addition
Family members MUST be able to add items to existing shopping lists.

#### Scenario: Add single item to shopping list
- **GIVEN** an authenticated family member with an existing shopping list
- **WHEN** they POST to `/v1/families/{familyId}/shopping-lists/{listId}/items` with `{ name: "Milk" }`
- **THEN** the API responds with HTTP 201 and the updated shopping list
- **AND** the new item has a generated `_id`, `checked: false`, and `createdAt` timestamp
- **AND** the shopping list's `updatedAt` timestamp is refreshed

#### Scenario: Add multiple items simultaneously
- **GIVEN** an authenticated family member
- **WHEN** they POST multiple items in sequence to the same list
- **THEN** each item is added successfully with unique `_id` values

#### Scenario: Reject item with missing name
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/shopping-lists/{listId}/items` with empty or missing `name`
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Reject item with name exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with item `name` exceeding 200 characters
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Cannot add item to non-existent list
- **GIVEN** an authenticated family member
- **WHEN** they POST to a non-existent shopping list ID
- **THEN** the API responds with HTTP 404 Not Found

### Requirement: Shopping List Item Update
Family members MUST be able to update individual items within a shopping list.

#### Scenario: Check off item as purchased
- **GIVEN** an authenticated family member with a shopping list containing an unchecked item
- **WHEN** they PATCH `/v1/families/{familyId}/shopping-lists/{listId}/items/{itemId}` with `{ checked: true }`
- **THEN** the API responds with HTTP 200 and the updated shopping list
- **AND** the specified item's `checked` field is set to `true`
- **AND** the shopping list's `updatedAt` timestamp is refreshed

#### Scenario: Uncheck item
- **GIVEN** an authenticated family member with a checked item
- **WHEN** they PATCH with `{ checked: false }`
- **THEN** the item's `checked` field is set to `false`

#### Scenario: Update item name
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ name: "Updated Item Name" }`
- **THEN** the item's name is updated

#### Scenario: Update both name and checked status
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ name: "Whole Milk", checked: true }`
- **THEN** both fields are updated atomically

#### Scenario: Reject update with invalid name
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with item name exceeding 200 characters
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Cannot update non-existent item
- **GIVEN** an authenticated family member
- **WHEN** they PATCH a non-existent item ID
- **THEN** the API responds with HTTP 404 Not Found

### Requirement: Shopping List Item Deletion
Family members MUST be able to remove individual items from shopping lists.

#### Scenario: Delete item successfully
- **GIVEN** an authenticated family member with a shopping list containing an item
- **WHEN** they DELETE `/v1/families/{familyId}/shopping-lists/{listId}/items/{itemId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the item is removed from the shopping list's items array
- **AND** the shopping list's `updatedAt` timestamp is refreshed

#### Scenario: Delete checked item
- **GIVEN** a shopping list with a checked (purchased) item
- **WHEN** the item is deleted
- **THEN** the item is removed successfully regardless of checked status

#### Scenario: Cannot delete non-existent item
- **GIVEN** an authenticated family member
- **WHEN** they DELETE a non-existent item ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: List remains after deleting last item
- **GIVEN** a shopping list with only one item
- **WHEN** that item is deleted
- **THEN** the shopping list remains with an empty items array

### Requirement: Field Validation
The system MUST enforce field length and format constraints for shopping lists and items.

#### Scenario: Enforce list name length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a shopping list with `name` exceeding 200 characters
- **THEN** the API responds with HTTP 400 and indicates name max length is 200

#### Scenario: Enforce tag count limit
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a shopping list with more than 20 tags
- **THEN** the API responds with HTTP 400 and indicates maximum 20 tags allowed

#### Scenario: Enforce tag length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a shopping list with any tag exceeding 50 characters
- **THEN** the API responds with HTTP 400 and indicates tag max length is 50

#### Scenario: Enforce item name length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to add or update an item with `name` exceeding 200 characters
- **THEN** the API responds with HTTP 400 and indicates item name max length is 200

#### Scenario: Validate checked field type
- **GIVEN** an authenticated family member
- **WHEN** they attempt to update an item with non-boolean `checked` value
- **THEN** the API responds with HTTP 400 and indicates checked must be boolean

### Requirement: Authorization
Only family members MUST be authorized to access family shopping lists.

#### Scenario: Require family membership for shopping list access
- **GIVEN** an authenticated user who is not a member of the specified family
- **WHEN** they attempt any shopping list operation for that family
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Both parents and children can manage shopping lists
- **GIVEN** an authenticated child member of a family
- **WHEN** they create, update, or delete a shopping list
- **THEN** the operation succeeds (no parent-only restrictions)

#### Scenario: Both parents and children can manage items
- **GIVEN** an authenticated child member of a family
- **WHEN** they add, update, or delete items from a shopping list
- **THEN** the operation succeeds (no parent-only restrictions)

#### Scenario: Require authentication for all endpoints
- **GIVEN** an unauthenticated request (no JWT token)
- **WHEN** accessing any shopping list endpoint
- **THEN** the API responds with HTTP 401 Unauthorized
