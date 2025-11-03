## ADDED Requirements

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
The system SHALL record an activity event when a task is marked as completed.

#### Scenario: Task completion records event
- **WHEN** a user marks a task as completed
- **THEN** the system MUST create an activity event with:
  - type: `TASK`
  - title: task name
  - description: "Completed {task name}"
  - userId: user who completed the task
  - metadata.karma: karma value if task has karma metadata

#### Scenario: Task completion via hook integration
- **WHEN** the task completion hook is invoked
- **THEN** the system MUST call the activity event service to record the completion event

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
