# Implementation Tasks: add-karma-reward-system

## 1. Database Setup

- [ ] 1.1 Create database indexes
  - Create unique compound index on `member_karma` collection: `(familyId, userId)`
  - Create compound index on `karma_events` collection: `(familyId, userId, createdAt)` with descending createdAt
  - Create index on `karma_events` collection: `(createdAt)` descending for time-based queries
  - Verify indexes with `db.member_karma.getIndexes()` and `db.karma_events.getIndexes()`

## 2. Domain Models and Types

- [ ] 2.1 Create `apps/api/src/modules/karma/domain/karma.ts`
  - Define `MemberKarma` interface with fields: `_id`, `familyId`, `userId`, `totalKarma`, `createdAt`, `updatedAt`
  - Define `KarmaEvent` interface with fields: `_id`, `familyId`, `userId`, `amount`, `source`, `description`, `metadata`, `createdAt`
  - Define `KarmaSource` enum or union type: `'task_completion' | 'manual_grant'`
  - Define `AwardKarmaInput` interface for service method input
  - Define `MemberKarmaDTO` for API response (string IDs, ISO timestamps)
  - Define `KarmaEventDTO` for API response
  - Define `KarmaHistoryResponse` interface with pagination fields
  - Export all types

- [ ] 2.2 Write unit tests for domain types
  - Test file: `apps/api/tests/unit/karma/karma.domain.test.ts`
  - Verify type definitions compile correctly
  - Test DTO type mappings (if applicable)

## 3. Repository Layer

- [ ] 3.1 Create `apps/api/src/modules/karma/repositories/karma.repository.ts`
  - Implement `KarmaRepository` class with MongoDB client injection
  - Method: `findMemberKarma(familyId: ObjectId, userId: ObjectId): Promise<MemberKarma | null>`
  - Method: `upsertMemberKarma(familyId: ObjectId, userId: ObjectId, incrementAmount: number): Promise<MemberKarma>`
    - Use `$inc` operator for atomic increment
    - Use `upsert: true` to create if not exists
    - Return updated document
  - Method: `createKarmaEvent(event: Omit<KarmaEvent, '_id' | 'createdAt'>): Promise<KarmaEvent>`
    - Insert event with generated ID and current timestamp
  - Method: `findKarmaEvents(familyId: ObjectId, userId: ObjectId, limit: number, cursor?: string): Promise<KarmaEvent[]>`
    - Query events for user in family
    - Sort by `createdAt` descending
    - Implement cursor-based pagination using `_id` or `createdAt` as cursor
    - Limit results to specified page size
  - Method: `countKarmaEvents(familyId: ObjectId, userId: ObjectId): Promise<number>`
    - Return total count of events for pagination metadata
  - Export repository class

- [ ] 3.2 Write unit tests for repository
  - Test file: `apps/api/tests/unit/karma/karma.repository.test.ts`
  - Mock MongoDB collections
  - Test `findMemberKarma` returns null when not found
  - Test `upsertMemberKarma` creates new document with initial amount
  - Test `upsertMemberKarma` increments existing document
  - Test `createKarmaEvent` inserts with correct fields
  - Test `findKarmaEvents` pagination logic
  - Test `findKarmaEvents` cursor handling
  - All tests MUST pass before proceeding

## 4. Service Layer

- [ ] 4.1 Create `apps/api/src/modules/karma/services/karma.service.ts`
  - Implement `KarmaService` class
  - Constructor: Inject `KarmaRepository` and `FamilyMembershipRepository`
  - Method: `awardKarma(input: AwardKarmaInput): Promise<KarmaEvent>`
    - Validate user is family member (using `FamilyMembershipRepository`)
    - Create karma event via repository
    - Update member karma total atomically
    - Handle errors gracefully (log and throw)
    - Return created event
  - Method: `getMemberKarma(familyId: ObjectId, userId: ObjectId, requestingUserId: ObjectId): Promise<MemberKarma>`
    - Verify requesting user is family member
    - Fetch member karma (return 0 if not found)
    - Return karma record
  - Method: `getKarmaHistory(familyId: ObjectId, userId: ObjectId, requestingUserId: ObjectId, limit: number, cursor?: string): Promise<KarmaHistoryResponse>`
    - Verify requesting user is family member
    - Fetch paginated events from repository
    - Calculate `hasMore` and `nextCursor` for pagination
    - Return events with pagination metadata
  - Method: `grantKarma(familyId: ObjectId, userId: ObjectId, amount: number, description: string | undefined, grantedBy: ObjectId): Promise<KarmaEvent>`
    - Verify granter is parent in family (using `requireFamilyRole`)
    - Verify recipient is family member
    - Call `awardKarma` with source `'manual_grant'` and metadata `{ grantedBy }`
    - Return created event
  - Add comprehensive error handling and logging

- [ ] 4.2 Write unit tests for service
  - Test file: `apps/api/tests/unit/karma/karma.service.test.ts`
  - Mock repositories
  - Test `awardKarma` creates event and updates total
  - Test `awardKarma` validates family membership
  - Test `getMemberKarma` returns zero for new member
  - Test `getMemberKarma` validates family membership
  - Test `getKarmaHistory` paginates correctly
  - Test `getKarmaHistory` validates family membership
  - Test `grantKarma` requires parent role
  - Test `grantKarma` validates recipient is family member
  - Test error handling for all methods
  - All tests MUST pass before proceeding

## 5. Mapper Functions

- [ ] 5.1 Create `apps/api/src/modules/karma/lib/karma.mapper.ts`
  - Implement `toMemberKarmaDTO(karma: MemberKarma): MemberKarmaDTO`
    - Convert ObjectIds to strings
    - Convert Dates to ISO 8601 strings
  - Implement `toKarmaEventDTO(event: KarmaEvent): KarmaEventDTO`
    - Convert ObjectIds to strings
    - Convert Dates to ISO 8601 strings
  - Export mapper functions

- [ ] 5.2 Write unit tests for mappers
  - Test file: `apps/api/tests/unit/karma/karma.mapper.test.ts`
  - Test `toMemberKarmaDTO` converts all fields correctly
  - Test `toKarmaEventDTO` converts all fields correctly
  - Test edge cases (null/undefined optional fields)
  - All tests MUST pass before proceeding

## 6. Validators

- [ ] 6.1 Create `apps/api/src/modules/karma/validators/grant-karma.validator.ts`
  - Define Zod schema for POST `/karma/grant` request body
  - Validate `userId` is valid ObjectId string
  - Validate `amount` is positive integer between 1 and 1000
  - Validate `description` is optional string, max 500 characters
  - Export `grantKarmaSchema`

- [ ] 6.2 Write unit tests for validators
  - Test file: `apps/api/tests/unit/karma/grant-karma.validator.test.ts`
  - Test valid grant request passes validation
  - Test negative amount is rejected
  - Test zero amount is rejected
  - Test excessive amount (>1000) is rejected
  - Test non-integer amount is rejected
  - Test overly long description is rejected
  - Test invalid userId format is rejected
  - Test missing required fields are rejected
  - All tests MUST pass before proceeding

## 7. API Routes

- [ ] 7.1 Create `apps/api/src/modules/karma/routes/get-balance.route.ts`
  - Implement GET handler for `/v1/families/:familyId/karma/balance`
  - Extract familyId from params, userId from JWT (req.user)
  - Call `karmaService.getMemberKarma(familyId, userId, userId)`
  - Map result to DTO using mapper
  - Return 200 with karma balance
  - Handle errors (403 for non-members, 500 for server errors)

- [ ] 7.2 Create `apps/api/src/modules/karma/routes/get-history.route.ts`
  - Implement GET handler for `/v1/families/:familyId/karma/history`
  - Extract familyId from params, userId from JWT
  - Parse query params: `limit` (default 50, max 100), `cursor` (optional)
  - Call `karmaService.getKarmaHistory(familyId, userId, userId, limit, cursor)`
  - Map events to DTOs using mapper
  - Return 200 with events and pagination metadata
  - Handle errors

- [ ] 7.3 Create `apps/api/src/modules/karma/routes/grant-karma.route.ts`
  - Implement POST handler for `/v1/families/:familyId/karma/grant`
  - Validate request body using `grantKarmaSchema`
  - Extract familyId from params, grantedBy from JWT
  - Call `karmaService.grantKarma(familyId, userId, amount, description, grantedBy)`
  - Fetch updated member karma to get new total
  - Return 201 with created event and new total
  - Handle errors (400 for validation, 403 for non-parents)

- [ ] 7.4 Create `apps/api/src/modules/karma/routes/karma.router.ts`
  - Create Express router
  - Apply authentication middleware to all routes
  - Register GET `/balance` → `getBalance` handler
  - Register GET `/history` → `getHistory` handler
  - Register POST `/grant` → `grantKarma` handler
  - Export router

- [ ] 7.5 Integrate karma router into family routes
  - Edit `apps/api/src/modules/family/routes/families.route.ts` or create new integration point
  - Mount karma router at `/v1/families/:familyId/karma`
  - Verify routing works with nested params

- [ ] 7.6 Create `apps/api/src/modules/karma/index.ts`
  - Export all public types, services, repositories
  - Export karma router
  - Enable clean imports from other modules

## 8. E2E Tests for Karma API

- [ ] 8.1 Create `apps/api/tests/e2e/karma/get-balance.e2e.test.ts`
  - Test: Authenticated family member can get their karma balance
  - Test: Returns 0 for member with no karma
  - Test: Returns correct balance after karma is awarded
  - Test: Non-family member receives 403 Forbidden
  - Test: Unauthenticated request receives 401 Unauthorized
  - All tests MUST pass before proceeding

- [ ] 8.2 Create `apps/api/tests/e2e/karma/get-history.e2e.test.ts`
  - Test: Authenticated member can get their karma history
  - Test: Returns empty array for member with no events
  - Test: Returns events in descending chronological order
  - Test: Pagination works with cursor parameter
  - Test: Limit parameter restricts page size
  - Test: Exceeding max limit returns 400
  - Test: Non-family member receives 403 Forbidden
  - All tests MUST pass before proceeding

- [ ] 8.3 Create `apps/api/tests/e2e/karma/grant-karma.e2e.test.ts`
  - Test: Parent can manually grant karma to child
  - Test: Parent can manually grant karma to another parent
  - Test: Granted karma updates member's total
  - Test: Grant creates event with correct metadata (grantedBy)
  - Test: Grant without description succeeds
  - Test: Negative amount returns 400
  - Test: Zero amount returns 400
  - Test: Excessive amount (>1000) returns 400
  - Test: Non-integer amount returns 400
  - Test: Overly long description returns 400
  - Test: Granting to non-family member returns 400
  - Test: Child attempting to grant receives 403 Forbidden
  - Test: Non-family member attempting to grant receives 403 Forbidden
  - All tests MUST pass before proceeding

- [ ] 8.4 Create `apps/api/tests/e2e/karma/authorization.e2e.test.ts`
  - Test: All karma endpoints require authentication (401 without JWT)
  - Test: All karma endpoints require family membership (403 for outsiders)
  - Test: Only parents can grant karma (403 for children)
  - Test: Members can only view their own karma (not implemented, but verify current behavior)
  - All tests MUST pass before proceeding

## 9. Task Integration

- [ ] 9.1 Update Task domain model
  - Edit `apps/api/src/modules/tasks/domain/task.ts`
  - Add optional `metadata?: { karma?: number }` field to `Task` interface
  - Add optional `metadata?: { karma?: number }` to `CreateTaskInput` interface
  - Add optional `metadata?: { karma?: number }` to `UpdateTaskInput` interface
  - Add optional `metadata?: { karma?: number }` to `TaskDTO` interface

- [ ] 9.2 Update TaskSchedule domain model
  - Edit `apps/api/src/modules/tasks/domain/task-schedule.ts`
  - Add optional `metadata?: { karma?: number }` to `TaskSchedule` interface
  - Add optional `metadata?: { karma?: number }` to `CreateScheduleInput` interface
  - Add optional `metadata?: { karma?: number }` to `UpdateScheduleInput` interface
  - Add optional `metadata?: { karma?: number }` to `TaskScheduleDTO` interface

- [ ] 9.3 Update task validators
  - Edit `apps/api/src/modules/tasks/validators/create-task.validator.ts`
  - Add optional `metadata` field with nested optional `karma` field
  - Validate karma is positive integer between 1 and 1000 if present
  - Edit `apps/api/src/modules/tasks/validators/update-task.validator.ts`
  - Add same validation for metadata.karma

- [ ] 9.4 Update schedule validators
  - Edit `apps/api/src/modules/tasks/validators/create-schedule.validator.ts`
  - Add optional metadata.karma validation
  - Edit `apps/api/src/modules/tasks/validators/update-schedule.validator.ts`
  - Add same validation

- [ ] 9.5 Update task mappers
  - Edit `apps/api/src/modules/tasks/lib/task.mapper.ts`
  - Ensure mapper preserves `metadata` field when converting Task to TaskDTO
  - Edit `apps/api/src/modules/tasks/lib/task-schedule.mapper.ts`
  - Ensure mapper preserves `metadata` field for schedules

- [ ] 9.6 Write unit tests for task validators with karma
  - Test file: `apps/api/tests/unit/tasks/create-task.validator.test.ts` (extend existing)
  - Test: Valid karma metadata passes validation
  - Test: Negative karma is rejected
  - Test: Zero karma is rejected
  - Test: Excessive karma (>1000) is rejected
  - Test: Non-integer karma is rejected
  - Test: Task without karma passes validation
  - Repeat for update-task.validator.test.ts
  - All tests MUST pass before proceeding

- [ ] 9.7 Inject KarmaService into TaskService
  - Edit `apps/api/src/modules/tasks/services/task.service.ts`
  - Add `KarmaService` to constructor dependencies
  - Update instantiation in `apps/api/src/modules/tasks/index.ts` to inject karma service

- [ ] 9.8 Add karma award logic to task completion
  - Edit `TaskService.updateTask` method in `apps/api/src/modules/tasks/services/task.service.ts`
  - After task update succeeds, check if:
    - `input.completedAt` is set (task being marked complete)
    - `existingTask.completedAt` is null (task was not already complete)
    - `updatedTask.metadata?.karma` exists and is > 0
  - If all conditions met, call `karmaService.awardKarma` with:
    - `familyId: updatedTask.familyId`
    - `userId` (from method params)
    - `amount: updatedTask.metadata.karma`
    - `source: 'task_completion'`
    - `description: "Completed task \"${updatedTask.name}\""`
    - `metadata: { taskId: taskId.toString() }`
  - Wrap karma call in try-catch:
    - On error, log error but do NOT throw
    - Task completion should succeed even if karma fails
  - Add structured logging for karma award success and failure

## 10. E2E Tests for Task-Karma Integration

- [ ] 10.1 Create `apps/api/tests/e2e/tasks/task-karma-integration.e2e.test.ts`
  - Test: Create task with karma metadata succeeds
  - Test: Task completion awards karma to completing user
  - Test: Karma event includes task ID in metadata
  - Test: Karma event has correct description (task name)
  - Test: Member's karma total increases by task karma amount
  - Test: Recurring task completion awards karma each time
  - Test: Task without karma metadata does not award karma
  - Test: Un-completing task (setting completedAt to null) does not reverse karma
  - Test: Updating already-completed task does not award additional karma
  - Test: Task completion succeeds even if karma service fails (mock failure)
  - All tests MUST pass before proceeding

- [ ] 10.2 Extend existing task E2E tests
  - Edit `apps/api/tests/e2e/tasks/create-task.e2e.test.ts`
  - Add test cases for creating tasks with karma metadata
  - Edit `apps/api/tests/e2e/tasks/update-task.e2e.test.ts`
  - Add test cases for updating task karma metadata
  - All tests MUST pass before proceeding

## 11. Integration and System Tests

- [ ] 11.1 Run full unit test suite
  - Execute: `pnpm -C apps/api run test:unit`
  - Verify all unit tests pass
  - Fix any failing tests before proceeding

- [ ] 11.2 Run full E2E test suite
  - Execute: `pnpm -C apps/api run test:e2e`
  - Verify all E2E tests pass
  - Fix any failing tests before proceeding

- [ ] 11.3 Manual testing with Bruno or similar API client
  - Test GET `/v1/families/{familyId}/karma/balance` with authenticated user
  - Test GET `/v1/families/{familyId}/karma/history` with pagination
  - Test POST `/v1/families/{familyId}/karma/grant` as parent
  - Test task creation with karma metadata
  - Test task completion triggers karma award
  - Verify karma totals match event sums in database
  - Test authorization boundaries (non-members, children granting karma)

## 12. Bruno API Collection Updates

- [ ] 12.1 Create karma folder and requests
  - Create `bruno/Famly/karma/folder.bru`:
    - Set meta name: `karma`
    - Set type: `folder`
    - Add description: `Karma reward system API endpoints`
  - Create `bruno/Famly/karma/get-balance.bru`:
    - Type: GET
    - URL: `{{baseUrl}}/v1/families/{{currentFamilyId}}/karma/balance`
    - Auth: inherit
    - Add post-response script to log karma total
  - Create `bruno/Famly/karma/get-history.bru`:
    - Type: GET
    - URL: `{{baseUrl}}/v1/families/{{currentFamilyId}}/karma/history`
    - Auth: inherit
    - Add query params: `limit` (optional), `cursor` (optional)
    - Add post-response script to display pagination info
  - Create `bruno/Famly/karma/grant-karma.bru`:
    - Type: POST
    - URL: `{{baseUrl}}/v1/families/{{currentFamilyId}}/karma/grant`
    - Auth: inherit
    - Body (JSON):
      ```json
      {
        "userId": "{{childUserId}}",
        "amount": 25,
        "description": "Great job helping with chores!"
      }
      ```
    - Add post-response script to save eventId if needed

- [ ] 12.2 Update task requests with karma metadata examples
  - Edit `bruno/Famly/tasks/create-task.bru`:
    - Add example with karma metadata in body:
      ```json
      {
        "name": "Wash dishes",
        "description": "Clean all dishes in the sink",
        "dueDate": "2025-01-15T18:00:00Z",
        "assignment": { "type": "unassigned" },
        "metadata": { "karma": 10 }
      }
      ```
  - Edit `bruno/Famly/tasks/create-schedule.bru`:
    - Add example with karma metadata:
      ```json
      {
        "name": "Weekly room cleanup",
        "schedule": {
          "daysOfWeek": [6],
          "weeklyInterval": 1,
          "startDate": "2025-01-01"
        },
        "timeOfDay": "10:00",
        "assignment": { "type": "unassigned" },
        "metadata": { "karma": 5 }
      }
      ```
  - Create `bruno/Famly/tasks/create-task-with-karma.bru` (optional dedicated example):
    - Duplicate create-task.bru
    - Rename to `create task with karma`
    - Focus body on karma example

- [ ] 12.3 Add environment variables for testing
  - Edit `bruno/Famly/environments/local.bru` (if needed):
    - Ensure `currentFamilyId` exists
    - Consider adding `childUserId` variable for karma grant testing
    - Consider adding `parentUserId` variable for role-based tests

## 13. Documentation and Cleanup

- [ ] 13.1 Add API documentation comments
  - Document all public methods in `KarmaService`
  - Document all route handlers with JSDoc comments
  - Document domain interfaces with field descriptions

- [ ] 13.2 Update module README (if applicable)
  - Create `apps/api/src/modules/karma/README.md` with:
    - Module overview
    - API endpoints documentation
    - Database schema
    - Integration points (task completion)

- [ ] 13.3 Run linter
  - Execute: `pnpm -C apps/api run lint`
  - Fix any linting errors
  - Ensure code style consistency

- [ ] 13.4 Run formatter
  - Execute: `pnpm -C apps/api run format` (if available)
  - Ensure all code is properly formatted

## 14. Verification and Sign-off

- [ ] 14.1 Verify all requirements met
  - Review spec deltas in `openspec/changes/add-karma-reward-system/specs/`
  - Confirm all scenarios are covered by tests
  - Confirm all API endpoints implemented and working

- [ ] 14.2 Verify constitution compliance
  - Confirm SOLID principles followed (SRP, DIP, OCP)
  - Confirm DRY (no duplicate logic)
  - Confirm KISS (simple, straightforward implementation)
  - Confirm TDD (tests written first, all green)

- [ ] 14.3 Performance check
  - Verify karma balance queries are fast (indexed lookups)
  - Verify karma history pagination is efficient
  - Verify task completion flow is not slowed by karma logic

- [ ] 14.4 Security review
  - Verify all endpoints require authentication
  - Verify family membership checks on all operations
  - Verify parent-only authorization on manual grants
  - Verify no karma manipulation exploits (e.g., self-granting)

- [ ] 14.5 Verify Bruno collections work
  - Test all karma endpoints using Bruno requests
  - Test task creation with karma metadata
  - Verify environment variables are properly configured
  - Confirm all requests return expected responses

- [ ] 14.6 Final full test run
  - Execute: `pnpm test` (all tests)
  - Confirm 100% test pass rate
  - Confirm no regressions in existing functionality

## Notes for Implementation

### Test-First Approach
Per the constitution's TDD requirement, each implementation task should follow this sequence:
1. Write failing tests for the functionality
2. Run tests and verify they fail (Red)
3. Implement the minimum code to pass tests (Green)
4. Refactor for clarity and quality (Refactor)
5. Re-run tests to ensure they still pass

### Error Handling Pattern
All karma operations should follow this error handling pattern:
- Validation errors → HTTP 400 with descriptive message
- Authentication errors → HTTP 401
- Authorization errors → HTTP 403 with descriptive message
- Not found errors → HTTP 404
- Server errors → HTTP 500, log full error details

### Logging Standards
Use Winston logger with structured logging:
```typescript
logger.info('Action completed', { familyId: id.toString(), userId: userId.toString() });
logger.error('Action failed', { familyId: id.toString(), error });
```

### Database Transaction Considerations
While MongoDB transactions are available, the current approach uses:
- Atomic `$inc` operations for karma totals
- Separate event creation (eventual consistency acceptable)
- If strict consistency needed, wrap in transaction:
  ```typescript
  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      await createEvent();
      await updateTotal();
    });
  } finally {
    await session.endSession();
  }
  ```
