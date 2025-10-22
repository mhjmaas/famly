## 1. Dependencies and Infrastructure

- [ ] 1.1 Add `cron` package to `apps/api/package.json` with `pnpm add cron`
- [ ] 1.2 Add `@types/cron` to devDependencies with `pnpm add -D @types/cron`
- [ ] 1.3 Run `pnpm install` to update lockfile

## 2. Domain Types and Models

- [ ] 2.1 Create `apps/api/src/modules/tasks/domain/task.ts` with TypeScript interfaces:
  - `TaskAssignment` discriminated union type
  - `Task` interface matching MongoDB schema (including `completedAt?: Date`)
  - `TaskSchedule` interface with schedule configuration
  - `Schedule` interface for recurrence rules
  - Input/output DTOs for API operations

## 3. Task Validators (TDD: Write Tests First)

- [ ] 3.1 Write failing unit tests in `apps/api/tests/unit/tasks/create-task.validator.test.ts`:
  - Valid task creation with all assignment types
  - Name validation (required, max 200 chars)
  - Description validation (optional, max 2000 chars)
  - Due date format validation
  - Assignment type validation
  - MemberId ObjectId format validation
- [ ] 3.2 Implement `apps/api/src/modules/tasks/validators/create-task.validator.ts` using Zod
- [ ] 3.3 Verify tests pass with `pnpm test:unit`

- [ ] 3.4 Write failing unit tests in `apps/api/tests/unit/tasks/update-task.validator.test.ts`:
  - Partial update validation
  - Field-specific validation
  - CompletedAt date format validation (ISO 8601)
  - CompletedAt can be null (to mark incomplete)
- [ ] 3.5 Implement `apps/api/src/modules/tasks/validators/update-task.validator.ts`
- [ ] 3.6 Verify tests pass

## 4. Schedule Validators (TDD: Write Tests First)

- [ ] 4.1 Write failing unit tests in `apps/api/tests/unit/tasks/create-schedule.validator.test.ts`:
  - Valid schedule with all fields
  - Days of week validation (0-6, non-empty array)
  - Weekly interval validation (1-4)
  - Start date required
  - End date optional but must be after start date
  - TimeOfDay format validation (HH:mm)
- [ ] 4.2 Implement `apps/api/src/modules/tasks/validators/create-schedule.validator.ts`
- [ ] 4.3 Verify tests pass

- [ ] 4.4 Write failing unit tests in `apps/api/tests/unit/tasks/update-schedule.validator.test.ts`
- [ ] 4.5 Implement `apps/api/src/modules/tasks/validators/update-schedule.validator.ts`
- [ ] 4.6 Verify tests pass

## 5. Task Mapper Utilities (TDD: Write Tests First)

- [ ] 5.1 Write failing unit tests in `apps/api/tests/unit/tasks/task.mapper.test.ts`:
  - toTaskDTO (converts Task entity to API response DTO)
  - toScheduleDTO (converts TaskSchedule entity to API response DTO)
  - Test null/undefined handling
  - Test date formatting
- [ ] 5.2 Implement `apps/api/src/modules/tasks/lib/task.mapper.ts`
- [ ] 5.3 Verify tests pass

## 6. Task Generation Utility Functions (TDD: Write Tests First)

- [ ] 6.1 Write failing unit tests in `apps/api/tests/unit/tasks/schedule-matcher.test.ts` for pure functions:
  - `shouldGenerateForDate(schedule, date)` - determines if date matches schedule criteria
  - `matchesDayOfWeek(dayOfWeek, scheduleDays)` - checks if day is in schedule
  - `matchesWeeklyInterval(lastGenerated, currentDate, interval)` - validates interval
  - `isWithinDateRange(date, startDate, endDate)` - checks date bounds
- [ ] 6.2 Implement `apps/api/src/modules/tasks/lib/schedule-matcher.ts` with pure utility functions
- [ ] 6.3 Verify tests pass

## 7. Task Repository Implementation

- [ ] 7.1 Implement `apps/api/src/modules/tasks/repositories/task.repository.ts`:
  - MongoDB collection access via `getDb().collection('tasks')`
  - Index creation on initialization
  - CRUD operations: createTask, findTaskById, findTasksByFamily, findTasksByFamilyAndDateRange, updateTask, deleteTask, findTaskByScheduleAndDate
  - Proper error handling and logging
- [ ] 7.2 No unit tests needed - will be covered by e2e tests

## 8. Schedule Repository Implementation

- [ ] 8.1 Implement `apps/api/src/modules/tasks/repositories/schedule.repository.ts`:
  - CRUD operations: createSchedule, findScheduleById, findSchedulesByFamily, findActiveSchedules, updateSchedule, updateLastGeneratedDate, deleteSchedule
  - Proper error handling and logging
- [ ] 8.2 No unit tests needed - will be covered by e2e tests

## 9. Task Service Layer Implementation

- [ ] 9.1 Implement `apps/api/src/modules/tasks/services/task.service.ts`:
  - Inject TaskRepository and FamilyMembershipRepository
  - Methods: createTask, listTasksForFamily, getTaskById, updateTask, deleteTask
  - Family membership validation for all operations
  - Comprehensive logging with Winston
- [ ] 9.2 No unit tests needed - will be covered by e2e tests

## 10. Schedule Service Layer Implementation

- [ ] 10.1 Implement `apps/api/src/modules/tasks/services/schedule.service.ts`:
  - Inject ScheduleRepository and FamilyMembershipRepository
  - Methods: createSchedule, listSchedulesForFamily, getScheduleById, updateSchedule, deleteSchedule
  - Family membership validation
  - Comprehensive logging
- [ ] 10.2 No unit tests needed - will be covered by e2e tests

## 11. Task Generation Service Implementation

- [ ] 11.1 Implement `apps/api/src/modules/tasks/services/task-generator.service.ts`:
  - Inject TaskRepository and ScheduleRepository
  - Use schedule-matcher utilities for date/interval logic
  - Method: generateTasksForDate(date)
  - Duplicate detection via findTaskByScheduleAndDate
  - Update lastGeneratedDate after successful generation
  - Comprehensive error handling and logging
- [ ] 11.2 No unit tests needed - will be covered by e2e tests

## 12. Cron Job Setup

- [ ] 12.1 Create `apps/api/src/modules/tasks/lib/task-scheduler.ts`:
  - Initialize cron job with expression "5 0 * * *" (00:05 UTC daily)
  - Call TaskGeneratorService.generateTasksForDate(new Date())
  - Comprehensive error handling and logging
  - Export startTaskScheduler() function
- [ ] 12.2 No unit tests needed - will be verified via e2e tests and manual verification

## 13. Task Routes and E2E Tests

### 13.1 Create Task (E2E Tests First)

- [ ] 13.1.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/create-task.e2e.test.ts`:
  - POST /v1/families/:familyId/tasks with valid payloads (all assignment types)
  - Validation error scenarios (missing name, invalid fields, etc.)
  - Non-member authorization failures
  - Verify task created in database
  - Verify response structure
- [ ] 13.1.2 Implement `apps/api/src/modules/tasks/routes/create-task.route.ts`:
  - Use authenticate middleware
  - Use validateCreateTask middleware
  - Verify family membership
  - Call TaskService.createTask
  - Return 201 with created task
- [ ] 13.1.3 Verify e2e tests pass with `pnpm test:e2e apps/api/tests/e2e/tasks/create-task.e2e.test.ts`

### 13.2 List Tasks (E2E Tests First)

- [ ] 13.2.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/list-tasks.e2e.test.ts`:
  - GET /v1/families/:familyId/tasks returns all family tasks
  - Date range filtering with query params
  - Empty list for family with no tasks
  - Authorization check for non-members
  - Verify response includes all task fields
- [ ] 13.2.2 Implement `apps/api/src/modules/tasks/routes/list-tasks.route.ts` (GET)
- [ ] 13.2.3 Verify tests pass

### 13.3 Get Task (E2E Tests First)

- [ ] 13.3.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/get-task.e2e.test.ts`:
  - GET /v1/families/:familyId/tasks/:taskId returns task
  - 404 for non-existent task
  - 403 for wrong family member
- [ ] 13.3.2 Implement `apps/api/src/modules/tasks/routes/get-task.route.ts` (GET)
- [ ] 13.3.3 Verify tests pass

### 13.4 Update Task (E2E Tests First)

- [ ] 13.4.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/update-task.e2e.test.ts`:
  - PATCH /v1/families/:familyId/tasks/:taskId updates fields
  - Partial updates work correctly
  - updatedAt timestamp refreshed
  - Complete task by setting completedAt timestamp
  - Mark task incomplete by setting completedAt to null
  - Validation errors for invalid data (including invalid completedAt format)
  - Authorization checks
- [ ] 13.4.2 Implement `apps/api/src/modules/tasks/routes/update-task.route.ts` (PATCH)
- [ ] 13.4.3 Verify tests pass

### 13.5 Delete Task (E2E Tests First)

- [ ] 13.5.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/delete-task.e2e.test.ts`:
  - DELETE /v1/families/:familyId/tasks/:taskId removes task
  - 204 No Content response
  - Task removed from database
  - Schedule-generated tasks can be deleted independently
  - Authorization checks
- [ ] 13.5.2 Implement `apps/api/src/modules/tasks/routes/delete-task.route.ts` (DELETE)
- [ ] 13.5.3 Verify tests pass

## 14. Schedule Routes and E2E Tests

### 14.1 Create Schedule (E2E Tests First)

- [ ] 14.1.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/create-schedule.e2e.test.ts`:
  - POST /v1/families/:familyId/tasks/schedules with valid data
  - Weekly interval variations (1-4)
  - Day of week validation
  - Start/end date handling
  - Validation errors for invalid input
- [ ] 14.1.2 Implement `apps/api/src/modules/tasks/routes/create-schedule.route.ts`
- [ ] 14.1.3 Verify tests pass

### 14.2 List Schedules (E2E Tests First)

- [ ] 14.2.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/list-schedules.e2e.test.ts`:
  - GET /v1/families/:familyId/tasks/schedules returns all schedules
  - Includes lastGeneratedDate
  - Authorization checks
- [ ] 14.2.2 Implement `apps/api/src/modules/tasks/routes/list-schedules.route.ts` (GET)
- [ ] 14.2.3 Verify tests pass

### 14.3 Get Schedule (E2E Tests First)

- [ ] 14.3.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/get-schedule.e2e.test.ts`:
  - GET /v1/families/:familyId/tasks/schedules/:scheduleId
  - 404 for non-existent
  - Authorization checks
- [ ] 14.3.2 Implement `apps/api/src/modules/tasks/routes/get-schedule.route.ts` (GET)
- [ ] 14.3.3 Verify tests pass

### 14.4 Update Schedule (E2E Tests First)

- [ ] 14.4.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/update-schedule.e2e.test.ts`:
  - PATCH /v1/families/:familyId/tasks/schedules/:scheduleId
  - Update schedule configuration
  - Future tasks use new config, existing tasks unchanged
  - Authorization checks
- [ ] 14.4.2 Implement `apps/api/src/modules/tasks/routes/update-schedule.route.ts` (PATCH)
- [ ] 14.4.3 Verify tests pass

### 14.5 Delete Schedule (E2E Tests First)

- [ ] 14.5.1 Write failing e2e tests in `apps/api/tests/e2e/tasks/delete-schedule.e2e.test.ts`:
  - DELETE /v1/families/:familyId/tasks/schedules/:scheduleId
  - 204 No Content response
  - Schedule removed, existing tasks remain (orphaned)
  - Authorization checks
- [ ] 14.5.2 Implement `apps/api/src/modules/tasks/routes/delete-schedule.route.ts` (DELETE)
- [ ] 14.5.3 Verify tests pass

## 15. Task Router Assembly

- [ ] 15.1 Create `apps/api/src/modules/tasks/routes/index.ts`:
  - Import all route handlers
  - Create Express router
  - Mount routes with proper paths and methods
  - Apply authenticate middleware to all routes
  - Export configured router
- [ ] 15.2 Create `apps/api/src/modules/tasks/index.ts` to export public interfaces

## 16. Task Generation E2E Tests

- [ ] 16.1 Write comprehensive e2e tests in `apps/api/tests/e2e/tasks/task-generation.e2e.test.ts`:
  - Create schedule, manually trigger generateTasksForDate, verify task created
  - Test weekly intervals (1, 2, 3, 4 weeks)
  - Test day of week matching
  - Test duplicate prevention (idempotency)
  - Test end date respect
  - Test future start date skipping
  - Test lastGeneratedDate updates
  - Test multiple schedules generating on same day
- [ ] 16.2 Verify all generation tests pass

## 17. Repository and Service E2E Coverage

- [ ] 17.1 Write comprehensive e2e tests in `apps/api/tests/e2e/tasks/repository-operations.e2e.test.ts`:
  - Test all repository CRUD operations through API calls
  - Test date range filtering
  - Test findActiveSchedules query
  - Test concurrent task creation
  - Test database constraint violations
- [ ] 17.2 Verify tests pass

## 18. Application Integration

- [ ] 18.1 Update `apps/api/src/app.ts`:
  - Import tasks router from `@modules/tasks`
  - Mount router at `/v1/families/:familyId/tasks` (before generic 404 handler)
- [ ] 18.2 Update `apps/api/src/server.ts`:
  - Import startTaskScheduler from `@modules/tasks/lib/task-scheduler`
  - Call startTaskScheduler() after successful DB connection
  - Add logging for scheduler initialization
- [ ] 18.3 Run full test suite with `pnpm test` and verify all pass

## 19. Documentation and Examples

- [ ] 19.1 Create `apps/api/tests/e2e/tasks/README.md` documenting test scenarios and patterns
- [ ] 19.2 Add Bruno HTTP client examples in `bruno/Famly/tasks/`:
  - create-task.bru
  - list-tasks.bru
  - get-task.bru
  - update-task.bru
  - complete-task.bru (PATCH with completedAt)
  - delete-task.bru
  - create-schedule.bru
  - list-schedules.bru
  - update-schedule.bru
  - delete-schedule.bru
  - folder.bru (task collection config)
- [ ] 19.3 Update main `README.md` if needed with task management feature description

## 20. Final Validation

- [ ] 20.1 Run complete test suite: `pnpm test` (unit + e2e)
- [ ] 20.2 Run linter: `pnpm run lint`
- [ ] 20.3 Verify no TypeScript errors: `pnpm run type-check` (if available)
- [ ] 20.4 Manual smoke test:
  - Start local dev environment with `docker compose -f docker/compose.dev.yml up`
  - Create family via API
  - Create one-time task
  - Create recurring schedule
  - List tasks
  - Update task
  - Delete task
  - Verify cron job logs in console after waiting for scheduled time (or trigger manually)
- [ ] 20.5 Verify MongoDB collections and indexes exist:
  - `tasks` collection with expected indexes
  - `task_schedules` collection with expected indexes

## 21. Code Review Checklist

- [ ] 21.1 Verify SOLID principles followed (SRP for services, DIP for repositories)
- [ ] 21.2 Verify DRY principle (no duplicate validation or business logic)
- [ ] 21.3 Verify KISS principle (straightforward implementations, no over-engineering)
- [ ] 21.4 Verify TDD evidence (tests written first, all passing)
- [ ] 21.5 Verify maintainability (clear naming, focused functions, proper logging)
- [ ] 21.6 Verify UX consistency (error messages, response formats match existing patterns)
- [ ] 21.7 Verify test strategy: unit tests only for validators, mappers, and pure utility functions; e2e tests for repositories, services, and routes
- [ ] 21.8 Verify constitution compliance documented in PR description