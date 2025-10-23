# Implementation Tasks

## 1. Setup Module Structure
- [ ] 1.1 Create `apps/api/src/modules/diary/` directory structure
- [ ] 1.2 Create subdirectories: `domain/`, `repositories/`, `routes/`, `validators/`, `lib/`
- [ ] 1.3 Create `index.ts` module export file

## 2. Domain Layer
- [ ] 2.1 Create `domain/diary-entry.ts` with TypeScript interfaces:
  - [ ] `DiaryEntry` entity interface with fields: `_id`, `date`, `entry`, `isPersonal`, `createdBy`, `createdAt`, `updatedAt`
  - [ ] `CreateDiaryEntryInput` DTO with fields: `date`, `entry`
  - [ ] `UpdateDiaryEntryInput` DTO with optional fields: `date`, `entry`
  - [ ] `DiaryEntryDTO` output interface with string representations of ObjectId fields

## 3. Repository Layer
- [ ] 3.1 Create `repositories/diary.repository.ts` with MongoDB operations:
  - [ ] `ensureIndexes()` method to create indexes on `createdBy` and `date` fields
  - [ ] `createEntry()` method that accepts user ID, input data, and sets `isPersonal: true`
  - [ ] `findById()` method that returns entry by ID or null
  - [ ] `findByCreator()` method that returns all entries for a specific user, sorted by date descending
  - [ ] `findByCreatorInDateRange()` method with optional startDate and endDate filters
  - [ ] `updateEntry()` method that updates date and/or entry text
  - [ ] `deleteEntry()` method that removes entry by ID

## 4. Mapper Utilities
- [ ] 4.1 Create `lib/diary-entry.mapper.ts`:
  - [ ] `toDiaryEntryDTO()` function to convert DiaryEntry to DiaryEntryDTO (ObjectId to string conversion)

## 5. Validators
- [ ] 5.1 Create `validators/create-entry.validator.ts`:
  - [ ] Zod schema for entry creation: `date` (string YYYY-MM-DD), `entry` (string, min 1 char, max 10,000 chars)
  - [ ] Express middleware function `validateCreateEntry`
  - [ ] Unit tests in `tests/unit/diary/create-entry.validator.test.ts`

- [ ] 5.2 Create `validators/update-entry.validator.ts`:
  - [ ] Zod schema for entry updates: optional `date`, optional `entry` (max 10,000 chars)
  - [ ] Express middleware function `validateUpdateEntry`
  - [ ] Unit tests in `tests/unit/diary/update-entry.validator.test.ts`

## 6. Routes
- [ ] 6.1 Create `routes/create-entry.route.ts`:
  - [ ] POST handler with `authenticate` middleware and `validateCreateEntry`
  - [ ] Call repository to create entry with `isPersonal: true`
  - [ ] Return 201 with created entry DTO

- [ ] 6.2 Create `routes/list-entries.route.ts`:
  - [ ] GET handler with `authenticate` middleware
  - [ ] Support optional query params: `startDate` and `endDate`
  - [ ] Return 200 with array of user's diary entries (sorted by date descending)

- [ ] 6.3 Create `routes/get-entry.route.ts`:
  - [ ] GET handler with `authenticate` and `authorizeCreatorOwnership` middleware
  - [ ] Configure `authorizeCreatorOwnership` with `resourceIdParam: 'entryId'` and `lookupFn: diaryRepository.findById`
  - [ ] Return 200 with entry DTO or 404

- [ ] 6.4 Create `routes/update-entry.route.ts`:
  - [ ] PATCH handler with `authenticate`, `authorizeCreatorOwnership`, and `validateUpdateEntry`
  - [ ] Configure `authorizeCreatorOwnership` middleware
  - [ ] Return 200 with updated entry DTO

- [ ] 6.5 Create `routes/delete-entry.route.ts`:
  - [ ] DELETE handler with `authenticate` and `authorizeCreatorOwnership` middleware
  - [ ] Configure `authorizeCreatorOwnership` middleware
  - [ ] Return 204 on success

- [ ] 6.6 Create `routes/diary.router.ts`:
  - [ ] Main router using Express Router
  - [ ] Mount all route handlers:
    - [ ] POST `/` -> create-entry
    - [ ] GET `/` -> list-entries
    - [ ] GET `/:entryId` -> get-entry
    - [ ] PATCH `/:entryId` -> update-entry
    - [ ] DELETE `/:entryId` -> delete-entry
  - [ ] Export configured router

## 7. Integration
- [ ] 7.1 Register diary router in `apps/api/src/app.ts`:
  - [ ] Import diary router
  - [ ] Mount at `/v1/diary`

- [ ] 7.2 Call `ensureIndexes()` in `apps/api/src/server.ts`:
  - [ ] Import diary repository
  - [ ] Call `ensureIndexes()` during startup

## 8. Unit Tests
- [ ] 8.1 Create `tests/unit/diary/` directory
- [ ] 8.2 Write validator unit tests (covered in step 5)
- [ ] 8.3 Write mapper unit tests:
  - [ ] Test `toDiaryEntryDTO()` conversion in `tests/unit/diary/diary-entry.mapper.test.ts`

## 9. E2E Tests
- [ ] 9.1 Create `tests/e2e/diary/` directory

- [ ] 9.2 Create `tests/e2e/diary/create-entry.e2e.test.ts`:
  - [ ] Test successful entry creation
  - [ ] Test validation errors (missing date, missing entry, invalid date format, entry too long)
  - [ ] Test authentication requirement

- [ ] 9.3 Create `tests/e2e/diary/list-entries.e2e.test.ts`:
  - [ ] Test listing all personal entries
  - [ ] Test empty list response
  - [ ] Test user only sees their own entries (isolation)
  - [ ] Test date range filtering with startDate and endDate
  - [ ] Test authentication requirement

- [ ] 9.4 Create `tests/e2e/diary/get-entry.e2e.test.ts`:
  - [ ] Test retrieving own entry by ID
  - [ ] Test 404 for non-existent entry
  - [ ] Test 403 when accessing another user's entry
  - [ ] Test authentication requirement

- [ ] 9.5 Create `tests/e2e/diary/update-entry.e2e.test.ts`:
  - [ ] Test updating entry text
  - [ ] Test updating date
  - [ ] Test updating both date and entry
  - [ ] Test validation errors
  - [ ] Test 403 when updating another user's entry
  - [ ] Test authentication requirement

- [ ] 9.6 Create `tests/e2e/diary/delete-entry.e2e.test.ts`:
  - [ ] Test successful deletion
  - [ ] Test 404 for non-existent entry
  - [ ] Test 403 when deleting another user's entry
  - [ ] Test authentication requirement

- [ ] 9.7 Create `tests/e2e/diary/authorization.e2e.test.ts`:
  - [ ] Test creator ownership enforcement on GET, PATCH, DELETE
  - [ ] Test unauthenticated request rejection on all endpoints

## 10. API Documentation
- [ ] 10.1 Create Bruno collection entries in `bruno/Famly/diary/`:
  - [ ] `create entry.bru` - Create diary entry
  - [ ] `list entries.bru` - List diary entries
  - [ ] `get entry.bru` - Get specific entry
  - [ ] `update entry.bru` - Update entry
  - [ ] `delete entry.bru` - Delete entry
  - [ ] `folder.bru` - Folder configuration

## 11. Final Verification
- [ ] 11.1 Run unit tests: `pnpm -C apps/api run test:unit`
- [ ] 11.2 Run e2e tests: `pnpm -C apps/api run test:e2e`
- [ ] 11.3 Run linting: `pnpm run lint`
- [ ] 11.4 Run TypeScript compiler: `pnpm -C apps/api run build`
- [ ] 11.5 Manual testing with Bruno API client
- [ ] 11.6 Verify all spec requirements are implemented
- [ ] 11.7 Verify creator ownership middleware is applied correctly on all protected routes
