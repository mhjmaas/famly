## ADDED Requirements

### Requirement: Real-time Reward Claim Event Emission

The system SHALL emit real-time WebSocket events when reward claims are created, completed, or cancelled to notify relevant family members.

#### Scenario: Claim created by child
- **WHEN** a child claims a reward
- **THEN** a `claim.created` event SHALL be emitted
- **AND** the event SHALL be broadcast to the child who made the claim
- **AND** the event payload SHALL include claim ID, reward details, and status

#### Scenario: Approval task created for parent
- **WHEN** a reward claim auto-generates an approval task for parents
- **THEN** an `approval_task.created` event SHALL be emitted
- **AND** the event SHALL be broadcast to all parents in the family
- **AND** the event payload SHALL include task details and claim context

#### Scenario: Claim completed
- **WHEN** a parent completes the approval task and claim is fulfilled
- **THEN** a `claim.completed` event SHALL be emitted
- **AND** the event SHALL be broadcast to the child who claimed the reward
- **AND** the event payload SHALL include reward name and karma deducted

#### Scenario: Claim cancelled
- **WHEN** a claim is cancelled by the child or parent
- **THEN** a `claim.cancelled` event SHALL be emitted
- **AND** the event SHALL be broadcast to both the child and any assigned parents
- **AND** the event payload SHALL include cancellation reason if provided

#### Scenario: Event emission failure
- **WHEN** reward event emission fails
- **THEN** the failure SHALL be logged as a warning
- **AND** the claim operation SHALL complete successfully regardless
- **AND** users will see the claim status on their next page refresh

### Requirement: Reward Event Payload Structure

The system SHALL include complete reward claim information in event payloads to enable UI updates and notifications.

#### Scenario: Claim created payload
- **WHEN** a `claim.created` event is emitted
- **THEN** the payload SHALL include claim ID, reward ID, reward name, karma cost, and member ID
- **AND** the payload SHALL include family ID and claim status
- **AND** the payload SHALL include timestamp of claim creation

#### Scenario: Approval task payload
- **WHEN** an `approval_task.created` event is emitted
- **THEN** the payload SHALL include task ID, claim ID, child's name, and reward name
- **AND** the payload SHALL include karma amount to be deducted
- **AND** the payload SHALL clearly indicate this is a parent approval task

#### Scenario: Claim status change payload
- **WHEN** a `claim.completed` or `claim.cancelled` event is emitted
- **THEN** the payload SHALL include claim ID, reward name, and final status
- **AND** the payload SHALL include who completed/cancelled the claim and when
- **AND** for completed claims, the payload SHALL include karma deducted amount
