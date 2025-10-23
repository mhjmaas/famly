# Implementation Tasks

## 1. Setup Module Structure
- [x] 1.1 Create `apps/api/src/modules/diary/` directory structure
- [x] 1.2 Create subdirectories: `domain/`, `repositories/`, `routes/`, `validators/`, `lib/`
- [x] 1.3 Create `index.ts` module export file

## 2. Domain Layer
- [x] 2.1 Create `domain/diary-entry.ts` with TypeScript interfaces:
  - [x] `DiaryEntry` entity interface with fields: `_id`, `date`, `entry`, `isPersonal`, `createdBy`, `createdAt`, `updatedAt`
  - [x] `CreateDiaryEntryInput` DTO with fields: `date`, `entry`
  - [x] `UpdateDiaryEntryInput` DTO with optional fields: `date`, `entry`
  - [x] `DiaryEntryDTO` output interface with string representations of ObjectId fields

## 3. Repository Layer
- [x] 3.1 Create `repositories/diary.repository.ts` with MongoDB operations:
  - [x] `ensureIndexes()` method to create indexes on `createdBy` and `date` fields
  - [x] `createEntry()` method that accepts user ID, input data, and sets `isPersonal: true`
  - [x] `findById()` method that returns entry by ID or null
  - [x] `findByCreator()` method that returns all entries for a specific user, sorted by date descending
  - [x] `findByCreatorInDateRange()` method with optional startDate and endDate filters
  - [x] `updateEntry()` method that updates date and/or entry text
  - [x] `deleteEntry()` method that removes entry by ID

## 4. Mapper Utilities
- [x] 4.1 Create `lib/diary-entry.mapper.ts`:
  - [x] `toDiaryEntryDTO()` function to convert DiaryEntry to DiaryEntryDTO (ObjectId to string conversion)

## 5. Validators
- [x] 5.1 Create `validators/create-entry.validator.ts`:
  - [x] Zod schema for entry creation: `date` (string YYYY-MM-DD), `entry` (string, min 1 char, max 10,000 chars)
  - [x] Express middleware function `validateCreateEntry`
  - [x] Unit tests in `tests/unit/diary/create-entry.validator.test.ts`

- [x] 5.2 Create `validators/update-entry.validator.ts`:
  - [x] Zod schema for entry updates: optional `date`, optional `entry` (max 10,000 chars)
  - [x] Express middleware function `validateUpdateEntry`
  - [x] Unit tests in `tests/unit/diary/update-entry.validator.test.ts`

## 6. Routes
- [x] 6.1 Create `routes/create-entry.route.ts`:
  - [x] POST handler with `authenticate` middleware and `validateCreateEntry`
  - [x] Call repository to create entry with `isPersonal: true`
  - [x] Return 201 with created entry DTO

- [x] 6.2 Create `routes/list-entries.route.ts`:
  - [x] GET handler with `authenticate` middleware
  - [x] Support optional query params: `startDate` and `endDate`
  - [x] Return 200 with array of user's diary entries (sorted by date descending)

- [x] 6.3 Create `routes/get-entry.route.ts`:
  - [x] GET handler with `authenticate` and `authorizeCreatorOwnership` middleware
  - [x] Configure `authorizeCreatorOwnership` with `resourceIdParam: 'entryId'` and `lookupFn: diaryRepository.findById`
  - [x] Return 200 with entry DTO or 404

- [x] 6.4 Create `routes/update-entry.route.ts`:
  - [x] PATCH handler with `authenticate`, `authorizeCreatorOwnership`, and `validateUpdateEntry`
  - [x] Configure `authorizeCreatorOwnership` middleware
  - [x] Return 200 with updated entry DTO

- [x] 6.5 Create `routes/delete-entry.route.ts`:
  - [x] DELETE handler with `authenticate` and `authorizeCreatorOwnership` middleware
  - [x] Configure `authorizeCreatorOwnership` middleware
  - [x] Return 204 on success

- [x] 6.6 Create `routes/diary.router.ts`:
  - [x] Main router using Express Router
  - [x] Mount all route handlers:
    - [x] POST `/` -> create-entry
    - [x] GET `/` -> list-entries
    - [x] GET `/:entryId` -> get-entry
    - [x] PATCH `/:entryId` -> update-entry
    - [x] DELETE `/:entryId` -> delete-entry
  - [x] Export configured router

## 7. Integration
- [x] 7.1 Register diary router in `apps/api/src/app.ts`:
  - [x] Import diary router
  - [x] Mount at `/v1/diary`

- [x] 7.2 Call `ensureIndexes()` in `apps/api/src/server.ts`:
  - [x] Import diary repository
  - [x] Call `ensureIndexes()` during startup

## 8. Unit Tests
- [x] 8.1 Create `tests/unit/diary/` directory
- [x] 8.2 Write validator unit tests (covered in step 5)
- [x] 8.3 Write mapper unit tests:
  - [x] Test `toDiaryEntryDTO()` conversion in `tests/unit/diary/diary-entry.mapper.test.ts`

## 9. E2E Tests
- [x] 9.1 Create `tests/e2e/diary/` directory

- [x] 9.2 Create `tests/e2e/diary/create-entry.e2e.test.ts`:
  - [x] Test successful entry creation
  - [x] Test validation errors (missing date, missing entry, invalid date format, entry too long)
  - [x] Test authentication requirement

- [x] 9.3 Create `tests/e2e/diary/list-entries.e2e.test.ts`:
  - [x] Test listing all personal entries
  - [x] Test empty list response
  - [x] Test user only sees their own entries (isolation)
  - [x] Test date range filtering with startDate and endDate
  - [x] Test authentication requirement

- [x] 9.4 Create `tests/e2e/diary/get-entry.e2e.test.ts`:
  - [x] Test retrieving own entry by ID
  - [x] Test 404 for non-existent entry
  - [x] Test 403 when accessing another user's entry
  - [x] Test authentication requirement

- [x] 9.5 Create `tests/e2e/diary/update-entry.e2e.test.ts`:
  - [x] Test updating entry text
  - [x] Test updating date
  - [x] Test updating both date and entry
  - [x] Test validation errors
  - [x] Test 403 when updating another user's entry
  - [x] Test authentication requirement

- [x] 9.6 Create `tests/e2e/diary/delete-entry.e2e.test.ts`:
  - [x] Test successful deletion
  - [x] Test 404 for non-existent entry
  - [x] Test 403 when deleting another user's entry
  - [x] Test authentication requirement

- [x] 9.7 Create `tests/e2e/diary/authorization.e2e.test.ts`:
  - [x] Test creator ownership enforcement on GET, PATCH, DELETE
  - [x] Test unauthenticated request rejection on all endpoints

## 10. API Documentation
- [x] 10.1 Create Bruno collection entries in `bruno/Famly/diary/`:
  - [x] `create entry.bru` - Create diary entry
  - [x] `list entries.bru` - List diary entries
  - [x] `get entry.bru` - Get specific entry
  - [x] `update entry.bru` - Update entry
  - [x] `delete entry.bru` - Delete entry
  - [x] `folder.bru` - Folder configuration

## 11. Final Verification
- [x] 11.1 Run unit tests: `pnpm -C apps/api run test:unit` (76 tests passing)
- [x] 11.2 Run e2e tests: `pnpm -C apps/api run test:e2e` (113 tests passing, manual verification)
- [x] 11.3 Run linting: `pnpm run lint` (all dairy module files pass)
- [x] 11.4 Run TypeScript compiler: `pnpm -C apps/api run build` (no diary-specific errors)
- [x] 11.5 Manual testing with Bruno API client (verified working)
- [x] 11.6 Verify all spec requirements are implemented
- [x] 11.7 Verify creator ownership middleware is applied correctly on all protected routes
