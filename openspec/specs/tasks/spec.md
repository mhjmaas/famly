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
Completion credit MUST follow the task assignment so the correct member receives rewards regardless of who triggered the action.
#### Scenario: Credit assigned member when completing
- **GIVEN** a task assigned to a specific member (`assignment.type: "member"`)
- **WHEN** any authorized user marks it complete via `PATCH /v1/families/{familyId}/tasks/{taskId}` with `completedAt`
- **THEN** the response's `completedBy` field MUST equal the assignment's `memberId`
- **AND** the stored task document MUST persist that credited member in `completedBy`
- **AND** karma hooks MUST use that member ID when awarding/deducting karma.

#### Scenario: Parent completes child-assigned task
- **GIVEN** a task assigned to Child A and a parent user for the same family
- **WHEN** the parent sends `PATCH ... { completedAt: now }`
- **THEN** the API responds 200 with `completedBy` set to Child A's user ID
- **AND** the parent ID MUST be captured separately as the actor in emitted events (see Event section)
- **AND** the parent does NOT receive karma for the action.

### Requirement: Authorization
The API MUST enforce that only the assignee or a parent can complete a member-targeted task.
#### Scenario: Reject non-parent completing another member's task
- **GIVEN** a child user attempts to complete a task whose `assignment.memberId` is a different user
- **WHEN** they call the PATCH endpoint with `completedAt`
- **THEN** the API responds with HTTP 403 and an error explaining only parents can complete tasks for someone else.

#### Scenario: Allow parents to complete any member-assigned task
- **GIVEN** an authenticated parent user
- **WHEN** they complete a task assigned to another user in the same family
- **THEN** the PATCH succeeds (assuming other validations pass).

### Requirement: Optional Karma Metadata on Tasks
The system MUST support optional karma metadata on tasks and task schedules that specifies reward points for completion.

#### Scenario: Create task with karma metadata
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/tasks` with `{ name, metadata: { karma: 10 } }`
- **THEN** the API responds with HTTP 201 and returns the created task
- **AND** the task includes `metadata.karma: 10`

#### Scenario: Create task without karma metadata
- **GIVEN** an authenticated family member
- **WHEN** they POST to create a task with no metadata field
- **THEN** the task is created successfully without karma metadata
- **AND** the task behaves identically to tasks created before karma feature

#### Scenario: Create schedule with karma metadata
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/tasks/schedules` with `{ name, schedule: {...}, metadata: { karma: 5 } }`
- **THEN** the schedule is created with karma metadata
- **AND** all task instances generated from this schedule inherit the karma metadata

#### Scenario: Update task to add karma metadata
- **GIVEN** an existing task without karma metadata
- **WHEN** a family member PATCH updates the task with `{ metadata: { karma: 15 } }`
- **THEN** the task is updated to include karma metadata

#### Scenario: Update task to remove karma metadata
- **GIVEN** an existing task with karma metadata
- **WHEN** a family member PATCH updates the task with `{ metadata: {} }` or `{ metadata: null }`
- **THEN** the karma metadata is removed

#### Scenario: Validate karma amount is positive integer
- **GIVEN** an authenticated family member
- **WHEN** they create or update a task with `metadata.karma: -5`
- **THEN** the API responds with HTTP 400 indicating karma must be a positive integer

#### Scenario: Validate karma amount maximum
- **GIVEN** an authenticated family member
- **WHEN** they create or update a task with `metadata.karma: 5000` (exceeds max)
- **THEN** the API responds with HTTP 400 indicating maximum karma is 1000

#### Scenario: Validate karma amount is integer
- **GIVEN** an authenticated family member
- **WHEN** they create or update a task with `metadata.karma: 10.5`
- **THEN** the API responds with HTTP 400 indicating karma must be an integer

#### Scenario: Task list includes karma metadata
- **GIVEN** tasks with and without karma metadata
- **WHEN** a family member lists tasks via GET `/v1/families/{familyId}/tasks`
- **THEN** tasks with karma include `metadata.karma` in the response
- **AND** tasks without karma have no metadata field or empty metadata object

### Requirement: Activity Event Recording on Task Creation
The system SHALL record an activity event when a non-recurring task is created.

#### Scenario: Manual task creation records event
- **WHEN** a user creates a manual task (not generated from a schedule)
- **THEN** the system MUST create an activity event with:
  - type: `TASK`
  - title: task name
  - description: null or task description if provided
  - userId: task creator's ID
  - metadata.karma: karma value if task has karma metadata

#### Scenario: Schedule-generated tasks do not record events
- **WHEN** a task is automatically generated from a recurring schedule
- **THEN** the system MUST NOT create an activity event for the generated task

### Requirement: Activity Event Recording on Schedule Creation
The system SHALL record an activity event when a recurring task schedule is created.

#### Scenario: Schedule creation records event
- **WHEN** a user creates a recurring task schedule
- **THEN** the system MUST create an activity event with:
  - type: `TASK`
  - title: schedule name
  - description: schedule description if provided, otherwise null
  - userId: schedule creator's ID
  - metadata.karma: karma value if schedule has karma metadata

### Requirement: Activity Event Recording on Task Completion
Recorded events MUST reflect both the credited user and, when different, the actor who clicked complete.
#### Scenario: Record credited user and actor metadata
- **WHEN** a task completion activity event is recorded
- **THEN** `userId` MUST represent the member credited with completion (the assignee for member tasks)
- **AND** if the actor differs from the credited member, the event metadata MUST include `triggeredBy` with the actor's user ID so history shows who marked it complete.

### Requirement: E2E Test Coverage for Activity Events
The system SHALL include e2e tests verifying activity event creation for task operations.

#### Scenario: Task creation e2e test extension
- **WHEN** running e2e tests for task creation
- **THEN** tests MUST verify that an activity event is created with correct type and data

#### Scenario: Schedule creation e2e test extension
- **WHEN** running e2e tests for schedule creation
- **THEN** tests MUST verify that an activity event is created with correct type and data

#### Scenario: Task completion e2e test extension
- **WHEN** running e2e tests for task completion
- **THEN** tests MUST verify that an activity event is created with correct type and data

### Requirement: Real-time Task Event Emission
`task.completed` events MUST surface both the credited member and the actor so clients can display accurate context.
#### Scenario: Include actor for task.completed events
- **WHEN** emitting a `task.completed` event
- **THEN** the payload MUST continue to expose `completedBy` as the credited member ID
- **AND** it MUST include a `triggeredBy` field with the user ID that performed the action when they differ
- **AND** clients MUST be able to rely on this field when showing "marked complete by" context.

### Requirement: Task Assignment Targeting

The system SHALL determine which users to notify based on task assignment type (individual, role-based, or family-wide).

#### Scenario: Individual assignment notification
- **WHEN** a task is assigned to specific user IDs
- **THEN** events SHALL be emitted only to those specific users
- **AND** other family members SHALL NOT receive the notification

#### Scenario: Role-based assignment notification
- **WHEN** a task is assigned to a family role (e.g., "parent", "child")
- **THEN** events SHALL be emitted to all users with that role in the family
- **AND** users without the role SHALL NOT receive the notification

#### Scenario: Family-wide assignment notification
- **WHEN** a task is assigned to the entire family
- **THEN** events SHALL be emitted to all family members
- **AND** all family members SHALL receive the notification

### Requirement: Event Payload Structure

The system SHALL include complete task information in event payloads to enable UI updates without additional API calls.

#### Scenario: Event payload content
- **WHEN** a task event is emitted
- **THEN** the payload SHALL include task ID, family ID, name, description, due date, and status
- **AND** the payload SHALL include assignment details (type, user IDs, or role)
- **AND** the payload SHALL include metadata for context (e.g., schedule ID if applicable)

#### Scenario: Timestamp inclusion
- **WHEN** any task event is emitted
- **THEN** the payload SHALL include an ISO 8601 timestamp
- **AND** the timestamp SHALL represent when the event was emitted from the server

