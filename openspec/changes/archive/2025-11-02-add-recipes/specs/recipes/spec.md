# recipes Specification

## Purpose
Enable family members to collaboratively create, organize, and discover recipes within their family, fostering knowledge sharing and simplifying meal planning.

## ADDED Requirements

### Requirement: Recipe Creation
Family members MUST be able to create recipes with a name, description, steps, and optional tags.

#### Scenario: Create recipe with required fields only
- **GIVEN** an authenticated family member with valid JWT token
- **WHEN** they POST to `/v1/families/{familyId}/recipes` with `{ name: "Pasta Carbonara", description: "Classic Roman pasta", steps: ["Cook pasta", "Make sauce", "Combine"] }`
- **THEN** the API responds with HTTP 201 and returns the created recipe with generated `_id`, `familyId`, `createdBy`, `createdAt`, and `updatedAt` timestamps
- **AND** the recipe is stored in the `recipes` collection with an empty `tags` array

#### Scenario: Create recipe with tags
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/recipes` with `{ name: "Sourdough Bread", description: "Homemade bread", steps: ["Mix dough", "Ferment", "Bake"], tags: ["bread", "breakfast", "high-class"] }`
- **THEN** the recipe is created with the specified tags array

#### Scenario: Create recipe with many steps
- **GIVEN** an authenticated family member
- **WHEN** they POST with a recipe containing 15 sequential steps
- **THEN** the recipe is created successfully with all steps preserved in order

#### Scenario: Reject recipe with missing name
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/recipes` with a payload missing the `name` field
- **THEN** the API responds with HTTP 400 and a validation error indicating `name` is required

#### Scenario: Reject recipe with empty name
- **GIVEN** an authenticated family member
- **WHEN** they POST with `name: ""`
- **THEN** the API responds with HTTP 400 and indicates name cannot be empty

#### Scenario: Reject recipe with name exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with a `name` exceeding 200 characters
- **THEN** the API responds with HTTP 400 and indicates name max length is 200

#### Scenario: Reject recipe with missing description
- **GIVEN** an authenticated family member
- **WHEN** they POST with a payload missing the `description` field
- **THEN** the API responds with HTTP 400 and indicates `description` is required

#### Scenario: Reject recipe with empty description
- **GIVEN** an authenticated family member
- **WHEN** they POST with `description: ""`
- **THEN** the API responds with HTTP 400 and indicates description cannot be empty

#### Scenario: Reject recipe with description exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with a `description` exceeding 2000 characters
- **THEN** the API responds with HTTP 400 and indicates description max length is 2000

#### Scenario: Reject recipe with missing steps
- **GIVEN** an authenticated family member
- **WHEN** they POST with a payload missing the `steps` field
- **THEN** the API responds with HTTP 400 and indicates `steps` is required

#### Scenario: Reject recipe with empty steps array
- **GIVEN** an authenticated family member
- **WHEN** they POST with `steps: []`
- **THEN** the API responds with HTTP 400 and indicates at least one step is required

#### Scenario: Reject recipe with empty step
- **GIVEN** an authenticated family member
- **WHEN** they POST with `steps: ["Cook", "", "Serve"]`
- **THEN** the API responds with HTTP 400 and indicates steps cannot be empty strings

#### Scenario: Reject recipe with step exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with any step exceeding 500 characters
- **THEN** the API responds with HTTP 400 and indicates step max length is 500

#### Scenario: Reject recipe with too many tags
- **GIVEN** an authenticated family member
- **WHEN** they POST with more than 20 tags
- **THEN** the API responds with HTTP 400 and indicates maximum 20 tags allowed

#### Scenario: Reject recipe with tag exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with a tag exceeding 50 characters
- **THEN** the API responds with HTTP 400 and indicates tag max length is 50

#### Scenario: Reject recipe for non-member
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to POST to `/v1/families/{familyId}/recipes`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Recipe Listing
Family members MUST be able to list all recipes for their family with pagination.

#### Scenario: List all family recipes
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/recipes`
- **THEN** the API responds with HTTP 200 and an array of all recipes for the family
- **AND** each recipe includes `_id`, `familyId`, `name`, `description`, `steps`, `tags`, `createdBy`, `createdAt`, `updatedAt`
- **AND** recipes are sorted by `createdAt` descending (newest first)

#### Scenario: Empty list for family with no recipes
- **GIVEN** an authenticated family member in a family with no recipes
- **WHEN** they GET `/v1/families/{familyId}/recipes`
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: List with default pagination
- **GIVEN** an authenticated family member with 25 recipes in the family
- **WHEN** they GET `/v1/families/{familyId}/recipes` without pagination parameters
- **THEN** the API responds with HTTP 200 and returns the first 10 recipes (default limit)
- **AND** includes metadata indicating there are more results available

#### Scenario: List with custom limit
- **GIVEN** an authenticated family member with 25 recipes
- **WHEN** they GET `/v1/families/{familyId}/recipes?limit=15`
- **THEN** the API responds with HTTP 200 and returns 15 recipes

#### Scenario: List with offset for pagination
- **GIVEN** an authenticated family member with 25 recipes
- **WHEN** they GET `/v1/families/{familyId}/recipes?limit=10&offset=10`
- **THEN** the API responds with HTTP 200 and returns recipes 11–20

#### Scenario: Reject invalid limit
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/recipes?limit=500`
- **THEN** the API responds with HTTP 400 and indicates max limit is 100

#### Scenario: Reject negative offset
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/recipes?offset=-1`
- **THEN** the API responds with HTTP 400 and indicates offset must be non-negative

### Requirement: Recipe Retrieval
Family members MUST be able to retrieve a specific recipe by ID.

#### Scenario: Get recipe by ID
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/recipes/{recipeId}`
- **THEN** the API responds with HTTP 200 and the complete recipe object with all fields

#### Scenario: Recipe not found
- **GIVEN** an authenticated family member
- **WHEN** they GET a non-existent recipe ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Access denied for wrong family
- **GIVEN** an authenticated user who is a member of familyA but not familyB
- **WHEN** they GET `/v1/families/{familyB}/recipes/{recipeId}`
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Recipe from different family not found
- **GIVEN** an authenticated family member of familyA
- **WHEN** they GET a recipeId that belongs to familyB
- **THEN** the API responds with HTTP 404 Not Found (treats as non-existent to prevent family enumeration)

### Requirement: Recipe Update
Family members MUST be able to update recipe details.

#### Scenario: Update recipe name
- **GIVEN** an authenticated family member
- **WHEN** they PATCH `/v1/families/{familyId}/recipes/{recipeId}` with `{ name: "Updated Recipe Name" }`
- **THEN** the API responds with HTTP 200 and the updated recipe
- **AND** `updatedAt` timestamp is refreshed

#### Scenario: Update recipe description
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ description: "New description" }`
- **THEN** the recipe description is updated

#### Scenario: Update recipe steps
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ steps: ["New step 1", "New step 2", "New step 3"] }`
- **THEN** the recipe steps are replaced with the new array

#### Scenario: Update recipe tags
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ tags: ["vegetarian", "quick"] }`
- **THEN** the recipe tags are replaced with the new array

#### Scenario: Clear recipe tags
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ tags: [] }`
- **THEN** the recipe tags array is emptied

#### Scenario: Partial update preserves other fields
- **GIVEN** an authenticated family member with a recipe containing name, description, steps, and tags
- **WHEN** they PATCH with only `{ name: "New Name" }`
- **THEN** the name is updated while description, steps, and tags remain unchanged

#### Scenario: Reject update with invalid name
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with a name exceeding 200 characters
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Reject update with invalid description
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with a description exceeding 2000 characters
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Reject update with empty steps array
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ steps: [] }`
- **THEN** the API responds with HTTP 400 and indicates at least one step is required

#### Scenario: Reject update with too many tags
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with more than 20 tags
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Cannot update non-existent recipe
- **GIVEN** an authenticated family member
- **WHEN** they PATCH a non-existent recipe ID
- **THEN** the API responds with HTTP 404 Not Found

### Requirement: Recipe Deletion
Family members MUST be able to delete recipes.

#### Scenario: Delete recipe successfully
- **GIVEN** an authenticated family member
- **WHEN** they DELETE `/v1/families/{familyId}/recipes/{recipeId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the recipe is removed from the database

#### Scenario: Cannot delete non-existent recipe
- **GIVEN** an authenticated family member
- **WHEN** they DELETE a non-existent recipe ID
- **THEN** the API responds with HTTP 404 Not Found

### Requirement: Recipe Search
Family members MUST be able to search recipes by name and description.

#### Scenario: Search recipes by name
- **GIVEN** an authenticated family member with recipes including "Chocolate Cake" and "Vanilla Cake"
- **WHEN** they POST to `/v1/families/{familyId}/recipes/search` with `{ query: "Chocolate" }`
- **THEN** the API responds with HTTP 200 and returns recipes matching "Chocolate" in name or description
- **AND** only recipes from the family are returned

#### Scenario: Search recipes by description
- **GIVEN** an authenticated family member with recipes containing different descriptions
- **WHEN** they POST with `{ query: "Italian" }`
- **THEN** the API returns recipes that contain "Italian" in their description

#### Scenario: Search is case-insensitive
- **GIVEN** an authenticated family member
- **WHEN** they POST with `{ query: "pasta" }` and recipes exist with "Pasta" and "PASTA"
- **THEN** all matching recipes are returned

#### Scenario: Search with no matches
- **GIVEN** an authenticated family member
- **WHEN** they POST with `{ query: "nonexistent-ingredient" }`
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: Search supports pagination
- **GIVEN** an authenticated family member with 25 recipes matching a search query
- **WHEN** they POST with `{ query: "recipe", limit: 10, offset: 0 }`
- **THEN** the API responds with HTTP 200 and returns the first 10 matching recipes

#### Scenario: Search respects family scope
- **GIVEN** authenticated members of two different families
- **WHEN** they search in their respective families
- **THEN** each user sees only results from their own family

#### Scenario: Reject search with empty query
- **GIVEN** an authenticated family member
- **WHEN** they POST with `{ query: "" }`
- **THEN** the API responds with HTTP 400 and indicates query cannot be empty

### Requirement: Field Validation
The system MUST enforce field length and format constraints for recipes.

#### Scenario: Enforce name length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a recipe with `name` exceeding 200 characters
- **THEN** the API responds with HTTP 400 and indicates name max length is 200

#### Scenario: Enforce description length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a recipe with `description` exceeding 2000 characters
- **THEN** the API responds with HTTP 400 and indicates description max length is 2000

#### Scenario: Enforce step count and length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create a recipe with 0 steps or any step exceeding 500 characters
- **THEN** the API responds with HTTP 400 with appropriate validation message

#### Scenario: Enforce tag count limit
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a recipe with more than 20 tags
- **THEN** the API responds with HTTP 400 and indicates maximum 20 tags allowed

#### Scenario: Enforce tag length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create or update a recipe with any tag exceeding 50 characters
- **THEN** the API responds with HTTP 400 and indicates tag max length is 50

### Requirement: Authorization
Only family members MUST be authorized to access family recipes.

#### Scenario: Require family membership for recipe access
- **GIVEN** an authenticated user who is not a member of the specified family
- **WHEN** they attempt any recipe operation for that family
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Both parents and children can manage recipes
- **GIVEN** an authenticated child member of a family
- **WHEN** they create, update, or delete a recipe
- **THEN** the operation succeeds (no parent-only restrictions)

#### Scenario: Require authentication for all endpoints
- **GIVEN** an unauthenticated request (no JWT token)
- **WHEN** accessing any recipe endpoint
- **THEN** the API responds with HTTP 401 Unauthorized
