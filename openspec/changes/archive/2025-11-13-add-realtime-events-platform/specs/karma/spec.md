## ADDED Requirements

### Requirement: Real-time Karma Event Emission

The system SHALL emit real-time WebSocket events when karma is awarded or deducted to notify users of balance changes instantly.

#### Scenario: Karma awarded from task completion
- **WHEN** karma is automatically awarded after task completion
- **THEN** a `karma.awarded` event SHALL be emitted
- **AND** the event SHALL be broadcast to the user who received the karma
- **AND** the event payload SHALL include the amount, source (task_completion), and new balance

#### Scenario: Karma awarded from manual grant
- **WHEN** a parent manually grants karma to a family member
- **THEN** a `karma.awarded` event SHALL be emitted
- **AND** the event SHALL be broadcast to the recipient user
- **AND** the event payload SHALL include the amount, source (manual_grant), granter ID, and description

#### Scenario: Karma deducted from reward claim
- **WHEN** karma is deducted for a reward redemption
- **THEN** a `karma.deducted` event SHALL be emitted
- **AND** the event SHALL be broadcast to the user whose karma was deducted
- **AND** the event payload SHALL include the amount, reward name, and new balance

#### Scenario: Event emission failure
- **WHEN** karma event emission fails
- **THEN** the failure SHALL be logged as a warning
- **AND** the karma transaction SHALL complete successfully regardless
- **AND** the user will see the updated balance on their next page refresh

### Requirement: Karma Event Payload Structure

The system SHALL include complete karma transaction details in event payloads to enable UI updates and toast notifications.

#### Scenario: Karma awarded payload
- **WHEN** a `karma.awarded` event is emitted
- **THEN** the payload SHALL include user ID, family ID, amount, source, and description
- **AND** the payload SHALL include the new total karma balance
- **AND** the payload SHALL include metadata (e.g., task ID if from task completion)

#### Scenario: Karma deducted payload
- **WHEN** a `karma.deducted` event is emitted
- **THEN** the payload SHALL include user ID, family ID, amount (positive number), and reason
- **AND** the payload SHALL include the new total karma balance
- **AND** the payload SHALL include reward details (name and claim ID)

#### Scenario: Timestamp and correlation
- **WHEN** any karma event is emitted
- **THEN** the payload SHALL include an ISO 8601 timestamp
- **AND** the payload SHALL include a karma event ID for correlation
