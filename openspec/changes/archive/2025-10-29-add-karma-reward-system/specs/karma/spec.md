## ADDED Requirements

### Requirement: Karma Balance Retrieval
Family members MUST be able to retrieve their current karma total for a specific family.

#### Scenario: Get karma balance successfully
- **GIVEN** an authenticated family member with valid JWT token
- **WHEN** they GET `/v1/families/{familyId}/karma/balance`
- **THEN** the API responds with HTTP 200 and returns their karma total, user ID, family ID, and last updated timestamp
- **AND** the response includes `familyId`, `userId`, `totalKarma`, and `updatedAt` fields

#### Scenario: Zero karma for new member
- **GIVEN** an authenticated family member who has never received karma
- **WHEN** they GET their karma balance
- **THEN** the API responds with HTTP 200 and `totalKarma: 0`

#### Scenario: Require family membership for balance access
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to GET karma balance for that family
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Require authentication
- **GIVEN** an unauthenticated request (no JWT token)
- **WHEN** accessing karma balance endpoint
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Karma Event History
Family members MUST be able to retrieve a paginated history of all karma events they have received in a specific family.

#### Scenario: Get karma history successfully
- **GIVEN** an authenticated family member with karma events
- **WHEN** they GET `/v1/families/{familyId}/karma/history`
- **THEN** the API responds with HTTP 200 and returns an array of karma events
- **AND** each event includes `id`, `amount`, `source`, `description`, `metadata`, and `createdAt`
- **AND** events are sorted by `createdAt` in descending order (newest first)

#### Scenario: Paginate history with cursor
- **GIVEN** an authenticated family member with more than 50 karma events
- **WHEN** they GET karma history with default limit
- **THEN** the API returns the first 50 events and a `nextCursor` for pagination
- **AND** when they GET with `cursor={nextCursor}`, the next page of events is returned

#### Scenario: Empty history for new member
- **GIVEN** an authenticated family member with no karma events
- **WHEN** they GET karma history
- **THEN** the API responds with HTTP 200 and an empty events array

#### Scenario: Limit history page size
- **GIVEN** an authenticated family member
- **WHEN** they GET karma history with `limit=20`
- **THEN** the API returns at most 20 events

#### Scenario: Enforce maximum page size
- **GIVEN** an authenticated family member
- **WHEN** they GET karma history with `limit=200` (exceeds max)
- **THEN** the API responds with HTTP 400 indicating max limit is 100

#### Scenario: Require family membership for history access
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to GET karma history for that family
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Manual Karma Grants
Parents MUST be able to manually grant karma to family members with an optional description.

#### Scenario: Grant karma successfully
- **GIVEN** an authenticated parent in a family
- **WHEN** they POST to `/v1/families/{familyId}/karma/grant` with `{ userId, amount, description }`
- **THEN** the API responds with HTTP 201 and returns the created karma event
- **AND** the response includes `eventId`, `familyId`, `userId`, `amount`, `newTotal`, `description`, `grantedBy`, and `createdAt`
- **AND** a karma event is created with `source: 'manual_grant'`
- **AND** the member's karma total is incremented by the specified amount
- **AND** the event metadata includes `grantedBy` with the parent's user ID

#### Scenario: Grant karma without description
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `{ userId, amount }` (no description)
- **THEN** the karma grant succeeds with an empty or default description

#### Scenario: Reject negative karma amounts
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `amount: -10`
- **THEN** the API responds with HTTP 400 indicating amount must be positive

#### Scenario: Reject zero karma amounts
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `amount: 0`
- **THEN** the API responds with HTTP 400 indicating amount must be greater than zero

#### Scenario: Reject excessive karma amounts
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `amount: 10000` (exceeds max)
- **THEN** the API responds with HTTP 400 indicating maximum amount is 1000

#### Scenario: Reject non-integer karma amounts
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `amount: 10.5`
- **THEN** the API responds with HTTP 400 indicating amount must be an integer

#### Scenario: Reject overly long descriptions
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with description exceeding 500 characters
- **THEN** the API responds with HTTP 400 indicating max description length is 500

#### Scenario: Reject grant to non-family member
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma to a user who is not in the family
- **THEN** the API responds with HTTP 400 indicating user is not a family member

#### Scenario: Require parent role for manual grants
- **GIVEN** an authenticated child member of a family
- **WHEN** they attempt to POST to grant karma
- **THEN** the API responds with HTTP 403 Forbidden indicating parent role required

#### Scenario: Require family membership to grant karma
- **GIVEN** an authenticated parent who is NOT a member of the specified family
- **WHEN** they attempt to grant karma in that family
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Automatic Karma Awards from Task Completion
The system MUST automatically award karma to the user who completes a task if the task has karma metadata configured.

#### Scenario: Award karma on task completion
- **GIVEN** a task with `metadata.karma: 10`
- **WHEN** a family member sets the task's `completedAt` timestamp (marks it complete)
- **THEN** the system creates a karma event with `amount: 10`, `source: 'task_completion'`, and description including the task name
- **AND** the member's karma total is incremented by 10
- **AND** the event metadata includes the task ID

#### Scenario: Award karma on recurring task completion
- **GIVEN** a recurring task schedule with `metadata.karma: 5`
- **AND** multiple task instances generated from that schedule
- **WHEN** a family member completes one task instance
- **THEN** karma is awarded for that instance
- **AND** when they complete another instance, karma is awarded again

#### Scenario: No karma awarded for tasks without karma metadata
- **GIVEN** a task with no `metadata.karma` field
- **WHEN** a family member completes the task
- **THEN** no karma event is created
- **AND** the member's karma total remains unchanged

#### Scenario: No karma on task uncomplete
- **GIVEN** a completed task that previously awarded karma
- **WHEN** a family member sets `completedAt: null` (marks it incomplete)
- **THEN** no karma is deducted (karma is not reversed)

#### Scenario: Task completion succeeds even if karma grant fails
- **GIVEN** a task with karma metadata
- **WHEN** a family member completes the task
- **AND** the karma service is temporarily unavailable
- **THEN** the task completion still succeeds (status updated to completed)
- **AND** the karma failure is logged but does not throw an error

#### Scenario: Only award karma on transition to completed
- **GIVEN** a task that is already completed (has completedAt timestamp)
- **WHEN** the task is updated (e.g., name changed)
- **THEN** no additional karma is awarded (karma only on initial completion)

### Requirement: Family-Specific Karma Isolation
Karma totals MUST be tracked separately per family for members who belong to multiple families.

#### Scenario: Independent karma totals per family
- **GIVEN** a user who is a member of familyA and familyB
- **AND** the user has 100 karma in familyA
- **WHEN** the user earns 50 karma in familyB
- **THEN** their familyA karma remains 100
- **AND** their familyB karma is 50

#### Scenario: Karma history filtered by family
- **GIVEN** a user with karma events in familyA and familyB
- **WHEN** they GET karma history for familyA
- **THEN** only events from familyA are returned

#### Scenario: Karma grants scoped to family
- **GIVEN** a parent in familyA attempting to grant karma to a member
- **WHEN** the member is in familyA but not familyB
- **THEN** the karma is granted in familyA context only

### Requirement: Karma Event Metadata
All karma events MUST include source information and optional metadata for audit purposes.

#### Scenario: Task completion event includes task reference
- **GIVEN** a task completion that awards karma
- **THEN** the created karma event has `source: 'task_completion'`
- **AND** the event metadata includes `taskId` referencing the completed task

#### Scenario: Manual grant event includes granter reference
- **GIVEN** a parent manually granting karma
- **THEN** the created karma event has `source: 'manual_grant'`
- **AND** the event metadata includes `grantedBy` with the parent's user ID

#### Scenario: All events have timestamp
- **GIVEN** any karma event
- **THEN** the event includes a `createdAt` timestamp in ISO 8601 format

### Requirement: Data Consistency Between Totals and Events
The system MUST maintain consistency between the aggregate karma total and the sum of karma events.

#### Scenario: Karma total matches event sum
- **GIVEN** a member with multiple karma events
- **WHEN** summing all event amounts for that member in that family
- **THEN** the sum MUST equal the member's `totalKarma` in the `member_karma` collection

#### Scenario: Atomic updates to total and events
- **GIVEN** a karma grant or award operation
- **WHEN** creating a new karma event
- **THEN** the karma total is updated atomically (using $inc operator)
- **AND** both operations succeed or both fail (no partial updates)

### Requirement: Field Validation
The system MUST enforce field constraints and formats for all karma operations.

#### Scenario: Validate karma amount range
- **GIVEN** a karma grant or task with karma metadata
- **WHEN** the amount is less than 1 or greater than 1000
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Validate karma amount type
- **GIVEN** a karma grant request
- **WHEN** the amount is not an integer (e.g., 10.5 or "ten")
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Validate description length
- **GIVEN** a manual karma grant with description
- **WHEN** the description exceeds 500 characters
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Validate user ID format
- **GIVEN** a manual karma grant request
- **WHEN** the userId is not a valid ObjectId
- **THEN** the API responds with HTTP 400 and validation error
