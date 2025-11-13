## ADDED Requirements

### Requirement: Real-time Task Event Emission

The system SHALL emit real-time WebSocket events when tasks are created, assigned, completed, or deleted to notify affected users instantly.

#### Scenario: Task created from schedule
- **WHEN** a recurring task is generated from a schedule
- **THEN** a `task.created` event SHALL be emitted
- **AND** the event SHALL be broadcast to users assigned to the task
- **AND** the event payload SHALL include the task details and assignment information

#### Scenario: Task created manually
- **WHEN** a user creates a task via the API
- **THEN** a `task.created` event SHALL be emitted
- **AND** the event SHALL be broadcast to users assigned to the task
- **AND** the event payload SHALL include task ID, name, assignment, and due date

#### Scenario: Task assignment changes
- **WHEN** a task's assignment is updated
- **THEN** a `task.assigned` event SHALL be emitted
- **AND** the event SHALL be broadcast to newly assigned users
- **AND** the event payload SHALL include the updated assignment

#### Scenario: Task completion
- **WHEN** a task is marked as completed
- **THEN** a `task.completed` event SHALL be emitted
- **AND** the event SHALL be broadcast to the family members
- **AND** the event payload SHALL include who completed the task and when

#### Scenario: Task deletion
- **WHEN** a task is deleted
- **THEN** a `task.deleted` event SHALL be emitted
- **AND** the event SHALL be broadcast to users who were assigned to the task
- **AND** the event payload SHALL include the task ID and affected user IDs

#### Scenario: Event emission failure
- **WHEN** event emission fails (e.g., WebSocket server unavailable)
- **THEN** the failure SHALL be logged as a warning
- **AND** the task operation SHALL complete successfully regardless
- **AND** users will see the task on their next page refresh

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
