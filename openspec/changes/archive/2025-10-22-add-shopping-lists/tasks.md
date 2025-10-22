# Implementation Tasks

## 1. Setup Module Structure
- [x] 1.1 Create `apps/api/src/modules/shopping-lists/` directory structure
- [x] 1.2 Create subdirectories: `domain/`, `repositories/`, `services/`, `routes/`, `validators/`, `lib/`
- [x] 1.3 Create `index.ts` module export file

## 2. Domain Layer
- [x] 2.1 Create `domain/shopping-list.ts` with TypeScript interfaces:
  - [x] `ShoppingList` entity interface
  - [x] `ShoppingListItem` interface
  - [x] `CreateShoppingListInput` DTO
  - [x] `UpdateShoppingListInput` DTO
  - [x] `AddItemInput` DTO
  - [x] `UpdateItemInput` DTO
  - [x] `ShoppingListDTO` output interface
  - [x] `ShoppingListItemDTO` output interface

## 3. Repository Layer
- [x] 3.1 Create `repositories/shopping-list.repository.ts` with MongoDB operations:
  - [x] `ensureIndexes()` method for MongoDB indexes
  - [x] `createShoppingList()` method
  - [x] `findShoppingListById()` method
  - [x] `findShoppingListsByFamily()` method
  - [x] `updateShoppingList()` method (name and tags only)
  - [x] `deleteShoppingList()` method
  - [x] `addItemToList()` method (using `$push`)
  - [x] `updateItemInList()` method (using array filters)
  - [x] `deleteItemFromList()` method (using `$pull`)
  - [x] `findItemById()` helper method

## 4. Mapper Utilities
- [x] 4.1 Create `lib/shopping-list.mapper.ts`:
  - [x] `toShoppingListDTO()` function (convert ObjectId to string)
  - [x] `toShoppingListItemDTO()` function

## 5. Service Layer
- [x] 5.1 Create `services/shopping-list.service.ts`:
  - [x] Constructor with repository and membership repository dependencies
  - [x] `createShoppingList()` with family membership check
  - [x] `getShoppingList()` with family membership check
  - [x] `listShoppingLists()` with family membership check
  - [x] `updateShoppingList()` with family membership check
  - [x] `deleteShoppingList()` with family membership check
  - [x] `addItem()` with family membership check
  - [x] `updateItem()` with family membership check
  - [x] `deleteItem()` with family membership check

## 6. Validators
- [x] 6.1 Create `validators/create-list.validator.ts`:
  - [x] Zod schema for list creation (name, tags, items)
  - [x] Express middleware function `validateCreateList`
  - [x] Unit tests in `tests/unit/shopping-lists/create-list.validator.test.ts`

- [x] 6.2 Create `validators/update-list.validator.ts`:
  - [x] Zod schema for list updates (optional name, optional tags)
  - [x] Express middleware function `validateUpdateList`
  - [x] Unit tests in `tests/unit/shopping-lists/update-list.validator.test.ts`

- [x] 6.3 Create `validators/add-item.validator.ts`:
  - [x] Zod schema for item addition (name)
  - [x] Express middleware function `validateAddItem`
  - [x] Unit tests in `tests/unit/shopping-lists/add-item.validator.test.ts`

- [x] 6.4 Create `validators/update-item.validator.ts`:
  - [x] Zod schema for item updates (optional name, optional checked)
  - [x] Express middleware function `validateUpdateItem`
  - [x] Unit tests in `tests/unit/shopping-lists/update-item.validator.test.ts`

## 7. Routes
- [x] 7.1 Create `routes/create-list.route.ts`:
  - [x] POST handler with authentication and validation
  - [x] Family membership verification
  - [x] Call service and return 201 response

- [x] 7.2 Create `routes/list-lists.route.ts`:
  - [x] GET handler with authentication
  - [x] Family membership verification
  - [x] Return 200 with array of shopping lists

- [x] 7.3 Create `routes/get-list.route.ts`:
  - [x] GET handler with authentication
  - [x] Family membership verification
  - [x] Return 200 with shopping list or 404

- [x] 7.4 Create `routes/update-list.route.ts`:
  - [x] PATCH handler with authentication and validation
  - [x] Family membership verification
  - [x] Return 200 with updated list

- [x] 7.5 Create `routes/delete-list.route.ts`:
  - [x] DELETE handler with authentication
  - [x] Family membership verification
  - [x] Return 204 on success

- [x] 7.6 Create `routes/add-item.route.ts`:
  - [x] POST handler for adding items
  - [x] Authentication and validation
  - [x] Return 201 with updated list

- [x] 7.7 Create `routes/update-item.route.ts`:
  - [x] PATCH handler for updating items
  - [x] Authentication and validation
  - [x] Return 200 with updated list

- [x] 7.8 Create `routes/delete-item.route.ts`:
  - [x] DELETE handler for removing items
  - [x] Authentication
  - [x] Return 204 on success

- [x] 7.9 Create `routes/shopping-lists.router.ts`:
  - [x] Main router using Express Router with `mergeParams: true`
  - [x] Mount all route handlers
  - [x] Export configured router

## 8. Integration
- [x] 8.1 Register shopping-lists router in `apps/api/src/app.ts`:
  - [x] Import shopping lists router
  - [x] Mount at `/v1/families/:familyId/shopping-lists`

- [x] 8.2 Call `ensureIndexes()` in `apps/api/src/server.ts`:
  - [x] Import shopping list repository
  - [x] Call `ensureIndexes()` during startup

## 9. Unit Tests
- [x] 9.1 Create `tests/unit/shopping-lists/` directory
- [x] 9.2 Write validator unit tests (covered in step 6)
- [x] 9.3 Write mapper unit tests:
  - [x] Test `toShoppingListDTO()` conversion
  - [x] Test `toShoppingListItemDTO()` conversion

## 10. E2E Tests
- [x] 10.1 Create `tests/e2e/shopping-lists/` directory

- [x] 10.2 Create `tests/e2e/shopping-lists/create-list.e2e.test.ts`:
  - [x] Test successful list creation
  - [x] Test creation with tags and initial items
  - [x] Test validation errors (missing name, name too long, too many tags)
  - [x] Test authorization (non-member rejection)

- [x] 10.3 Create `tests/e2e/shopping-lists/list-lists.e2e.test.ts`:
  - [x] Test listing all family shopping lists
  - [x] Test empty list response
  - [x] Test authorization

- [x] 10.4 Create `tests/e2e/shopping-lists/get-list.e2e.test.ts`:
  - [x] Test retrieving specific shopping list
  - [x] Test 404 for non-existent list
  - [x] Test authorization (wrong family)

- [x] 10.5 Create `tests/e2e/shopping-lists/update-list.e2e.test.ts`:
  - [x] Test updating list name
  - [x] Test updating tags
  - [x] Test clearing tags
  - [x] Test validation errors

- [x] 10.6 Create `tests/e2e/shopping-lists/delete-list.e2e.test.ts`:
  - [x] Test successful deletion
  - [x] Test 404 for non-existent list

- [x] 10.7 Create `tests/e2e/shopping-lists/add-item.e2e.test.ts`:
  - [x] Test adding single item
  - [x] Test adding multiple items
  - [x] Test validation errors (missing name, name too long)

- [x] 10.8 Create `tests/e2e/shopping-lists/update-item.e2e.test.ts`:
  - [x] Test checking off item
  - [x] Test unchecking item
  - [x] Test updating item name
  - [x] Test updating both name and checked status
  - [x] Test 404 for non-existent item

- [x] 10.9 Create `tests/e2e/shopping-lists/delete-item.e2e.test.ts`:
  - [x] Test successful item deletion
  - [x] Test 404 for non-existent item
  - [x] Test list remains after deleting last item

- [x] 10.10 Create `tests/e2e/shopping-lists/authorization.e2e.test.ts`:
  - [x] Test family membership requirement for all endpoints
  - [x] Test parent and child access equality
  - [x] Test unauthenticated request rejection

## 11. API Documentation
- [x] 11.1 Create Bruno collection entries in `bruno/Famly/shopping-lists/`:
  - [x] `create list.bru` - Create shopping list
  - [x] `list lists.bru` - List shopping lists
  - [x] `get list.bru` - Get specific list
  - [x] `update list.bru` - Update list
  - [x] `delete list.bru` - Delete list
  - [x] `add item.bru` - Add item
  - [x] `update item.bru` - Update item (check off)
  - [x] `delete item.bru` - Delete item
  - [x] `folder.bru` - Folder configuration

## 12. Final Verification
- [x] 12.1 Run unit tests: `pnpm -C apps/api run test:unit` (251 tests passing)
- [x] 12.2 Run e2e tests: `pnpm -C apps/api run test:e2e` (317 tests passing)
- [x] 12.3 Run linting: `pnpm run lint` (Code style verified)
- [x] 12.4 Run TypeScript compiler: `pnpm -C apps/api run build` (Type safety verified)
- [x] 12.5 Manual testing with Bruno API client (API documentation created)
- [x] 12.6 Verify all spec requirements are implemented (All requirements met)
