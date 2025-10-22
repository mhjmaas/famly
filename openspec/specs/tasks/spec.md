# tasks Specification

## Purpose
TBD - created by archiving change add-family-task-management. Update Purpose after archive.
## Requirements
### Requirement: Task Creation
Family members MUST be able to create one-time tasks with a name, optional description, optional due date, and flexible assignment options.

#### Scenario: Create one-time task with specific member assignment
- **GIVEN** an authenticated family member with valid JWT token
- **WHEN** they POST to `/v1/families/{familyId}/tasks` with `{ name, description, dueDate, assignment: { type: 'member', memberId } }`
- **THEN** the API responds with HTTP 201 and returns the created task with generated `_id`, `createdBy`, `createdAt`, and `updatedAt` timestamps
- **AND** the task is stored in the `tasks` collection with `scheduleId: null`

#### Scenario: Create task with role-based assignment
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/tasks` with `{ name, assignment: { type: 'role', role: 'parent' } }`
- **THEN** the task is created with assignment targeting all family members with the parent role

#### Scenario: Create task with no assignment
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/tasks` with `{ name, assignment: { type: 'unassigned' } }`
- **THEN** the task is created as an unassigned task available for anyone to claim

#### Scenario: Reject task with missing name
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/tasks` with a payload missing the `name` field
- **THEN** the API responds with HTTP 400 and a validation error message indicating `name` is required

#### Scenario: Reject task with invalid assignment
- **GIVEN** an authenticated family member
- **WHEN** they POST with `assignment: { type: 'member', memberId: 'invalid-id' }`
- **THEN** the API responds with HTTP 400 and a validation error for invalid ObjectId format

#### Scenario: Reject task for non-member
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to POST to `/v1/families/{familyId}/tasks`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Task Schedule Creation
Family members MUST be able to create recurring task schedules that specify days of week, weekly interval, and optional start/end dates.

#### Scenario: Create weekly recurring schedule
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/tasks/schedules` with `{ name, description, assignment, schedule: { daysOfWeek: [1, 3, 5], weeklyInterval: 1, startDate: '2025-01-01' }, timeOfDay: '09:00' }`
- **THEN** the API responds with HTTP 201 and returns the created schedule
- **AND** the schedule is stored in the `task_schedules` collection
- **AND** `lastGeneratedDate` is initially null

#### Scenario: Create biweekly schedule with end date
- **GIVEN** an authenticated family member
- **WHEN** they POST with `schedule: { daysOfWeek: [0, 6], weeklyInterval: 2, startDate: '2025-01-01', endDate: '2025-12-31' }`
- **THEN** the schedule is created with the specified end date for finite recurrence

#### Scenario: Reject schedule with invalid weekly interval
- **GIVEN** an authenticated family member
- **WHEN** they POST with `schedule: { weeklyInterval: 5 }`
- **THEN** the API responds with HTTP 400 indicating `weeklyInterval` must be 1-4

#### Scenario: Reject schedule with invalid day of week
- **GIVEN** an authenticated family member
- **WHEN** they POST with `schedule: { daysOfWeek: [7, 8] }`
- **THEN** the API responds with HTTP 400 indicating days must be 0-6 (Sunday-Saturday)

#### Scenario: Reject schedule with empty days array
- **GIVEN** an authenticated family member
- **WHEN** they POST with `schedule: { daysOfWeek: [] }`
- **THEN** the API responds with HTTP 400 indicating at least one day of week is required

### Requirement: Task Listing
Family members MUST be able to list all tasks for their family with optional filtering by due date range.

#### Scenario: List all family tasks
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/tasks`
- **THEN** the API responds with HTTP 200 and an array of all tasks for the family
- **AND** each task includes `_id`, `familyId`, `name`, `description`, `dueDate`, `assignment`, `scheduleId`, `createdBy`, `createdAt`, `updatedAt`

#### Scenario: List tasks with due date filtering
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/tasks?dueDateFrom=2025-01-01&dueDateTo=2025-01-31`
- **THEN** only tasks with due dates within the specified range are returned

#### Scenario: Empty list for family with no tasks
- **GIVEN** an authenticated family member in a family with no tasks
- **WHEN** they GET `/v1/families/{familyId}/tasks`
- **THEN** the API responds with HTTP 200 and an empty array

### Requirement: Schedule Listing
Family members MUST be able to list all task schedules for their family.

#### Scenario: List all family schedules
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/tasks/schedules`
- **THEN** the API responds with HTTP 200 and an array of all schedules for the family
- **AND** each schedule includes full schedule configuration and `lastGeneratedDate`

### Requirement: Task Retrieval
Family members MUST be able to retrieve a specific task by ID.

#### Scenario: Get task by ID
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/tasks/{taskId}`
- **THEN** the API responds with HTTP 200 and the complete task object

#### Scenario: Task not found
- **GIVEN** an authenticated family member
- **WHEN** they GET a non-existent task ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Access denied for wrong family
- **GIVEN** an authenticated user who is a member of familyA but not familyB
- **WHEN** they GET `/v1/families/{familyB}/tasks/{taskId}`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Task Update
Family members MUST be able to update task fields including name, description, due date, and assignment.

#### Scenario: Update task name and description
- **GIVEN** an authenticated family member
- **WHEN** they PATCH `/v1/families/{familyId}/tasks/{taskId}` with `{ name: 'Updated Name', description: 'Updated description' }`
- **THEN** the API responds with HTTP 200 and the updated task
- **AND** `updatedAt` timestamp is refreshed

#### Scenario: Update task assignment
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ assignment: { type: 'member', memberId: 'new-member-id' } }`
- **THEN** the task assignment is updated to the new member

#### Scenario: Reject update with invalid data
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with invalid field values (e.g., name exceeding 200 chars)
- **THEN** the API responds with HTTP 400 and validation errors

### Requirement: Schedule Update
Family members MUST be able to update schedule configurations.

#### Scenario: Update schedule days and interval
- **GIVEN** an authenticated family member
- **WHEN** they PATCH `/v1/families/{familyId}/tasks/schedules/{scheduleId}` with updated `schedule` object
- **THEN** the schedule is updated and future generated tasks will use new configuration
- **AND** existing generated tasks remain unchanged

#### Scenario: Update schedule assignment
- **GIVEN** an authenticated family member
- **WHEN** they PATCH the schedule's `assignment` field
- **THEN** future generated tasks will use the new assignment

### Requirement: Task Deletion
Family members MUST be able to delete individual tasks.

#### Scenario: Delete task successfully
- **GIVEN** an authenticated family member
- **WHEN** they DELETE `/v1/families/{familyId}/tasks/{taskId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the task is removed from the database

#### Scenario: Delete schedule-generated task
- **GIVEN** a task that was generated from a schedule (has `scheduleId`)
- **WHEN** the task is deleted
- **THEN** only that specific task instance is removed
- **AND** the schedule continues to generate future tasks

### Requirement: Schedule Deletion
Family members MUST be able to delete task schedules.

#### Scenario: Delete schedule successfully
- **GIVEN** an authenticated family member
- **WHEN** they DELETE `/v1/families/{familyId}/tasks/schedules/{scheduleId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the schedule is removed from the database
- **AND** previously generated tasks remain (orphaned with `scheduleId` reference)

### Requirement: Automatic Task Generation
The system MUST automatically generate task instances from active schedules on a daily basis.

#### Scenario: Daily cron job generates tasks from schedules
- **GIVEN** a task schedule with `daysOfWeek: [1]` (Monday), `weeklyInterval: 1`, and `startDate` in the past
- **WHEN** the daily cron job runs on a Monday
- **THEN** a new task instance is created with reference to the schedule (`scheduleId`)
- **AND** the task's `dueDate` is set based on schedule's `timeOfDay` (or midnight if not specified)
- **AND** the schedule's `lastGeneratedDate` is updated to today's date

#### Scenario: Skip generation if task already exists for date
- **GIVEN** a schedule that has already generated a task for today
- **WHEN** the cron job runs again
- **THEN** no duplicate task is created (idempotent operation)

#### Scenario: Honor weekly interval in generation
- **GIVEN** a schedule with `weeklyInterval: 2` and `lastGeneratedDate` from last week
- **WHEN** the cron job runs one week later on a matching day
- **THEN** no task is generated (interval not met)
- **AND** when the cron runs two weeks after `lastGeneratedDate` on a matching day
- **THEN** a new task is generated

#### Scenario: Respect schedule end date
- **GIVEN** a schedule with `endDate` in the past
- **WHEN** the cron job runs
- **THEN** no tasks are generated from that schedule

#### Scenario: Skip inactive schedules
- **GIVEN** a schedule with `startDate` in the future
- **WHEN** the cron job runs
- **THEN** no tasks are generated until startDate is reached

### Requirement: Field Validation
The system MUST enforce field length and format constraints.

#### Scenario: Enforce task name length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create a task with `name` exceeding 200 characters
- **THEN** the API responds with HTTP 400 and indicates name max length is 200

#### Scenario: Enforce description length
- **GIVEN** an authenticated family member
- **WHEN** they attempt to create a task with `description` exceeding 2000 characters
- **THEN** the API responds with HTTP 400 and indicates description max length is 2000

#### Scenario: Validate due date format
- **GIVEN** an authenticated family member
- **WHEN** they POST with an invalid date format for `dueDate`
- **THEN** the API responds with HTTP 400 and indicates proper ISO 8601 format required

#### Scenario: Validate timeOfDay format
- **GIVEN** an authenticated family member
- **WHEN** they create a schedule with invalid `timeOfDay` format (not HH:mm)
- **THEN** the API responds with HTTP 400 and validation error

### Requirement: Task Completion
Family members MUST be able to mark tasks as completed via a PATCH operation.

#### Scenario: Complete a task successfully
- **GIVEN** an authenticated family member
- **WHEN** they PATCH `/v1/families/{familyId}/tasks/{taskId}` with `{ completedAt: '2025-01-15T10:30:00Z' }`
- **THEN** the API responds with HTTP 200 and the updated task
- **AND** the task's `completedAt` field is set to the provided timestamp
- **AND** `updatedAt` timestamp is refreshed

#### Scenario: Mark task as incomplete by clearing completedAt
- **GIVEN** an authenticated family member with a completed task
- **WHEN** they PATCH with `{ completedAt: null }`
- **THEN** the task's `completedAt` field is set to null (marking it incomplete)

#### Scenario: Complete task with current timestamp
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with `{ completedAt: new Date().toISOString() }`
- **THEN** the task is marked as completed with the current timestamp

#### Scenario: Reject invalid completedAt format
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with an invalid date format for `completedAt`
- **THEN** the API responds with HTTP 400 and indicates proper ISO 8601 format required

### Requirement: Authorization
Only family members MUST be authorized to access family tasks and schedules.

#### Scenario: Require family membership for task access
- **GIVEN** an authenticated user who is not a member of the specified family
- **WHEN** they attempt any task operation for that family
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Both parents and children can manage tasks
- **GIVEN** an authenticated child member of a family
- **WHEN** they create, update, or delete a task
- **THEN** the operation succeeds (no parent-only restrictions)

#### Scenario: Require authentication for all endpoints
- **GIVEN** an unauthenticated request (no JWT token)
- **WHEN** accessing any task endpoint
- **THEN** the API responds with HTTP 401 Unauthorized

