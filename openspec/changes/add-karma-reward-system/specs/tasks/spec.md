## ADDED Requirements

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
