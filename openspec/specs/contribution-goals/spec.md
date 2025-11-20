# contribution-goals Specification

## Purpose
TBD - created by archiving change add-contribution-goals. Update Purpose after archive.
## Requirements
### Requirement: Contribution Goal Creation and Management
Parents SHALL be able to create, update, and delete weekly contribution goals for any family member including themselves.

#### Scenario: Parent creates contribution goal for child
- **WHEN** a parent creates a contribution goal with title, description, and maxKarma for a family member
- **THEN** the system creates a new contribution goal starting from the current week's start date (most recent Sunday 18:00 UTC)
- **AND** the goal is stored with familyId, memberId, weekStartDate, title, description, maxKarma, and empty deductions array

#### Scenario: Parent updates existing contribution goal
- **WHEN** a parent updates a contribution goal's title, description, or maxKarma
- **THEN** the system updates the goal for the current week only
- **AND** existing deductions are preserved

#### Scenario: Parent deletes contribution goal
- **WHEN** a parent deletes a contribution goal
- **THEN** the system removes the goal and all associated deductions
- **AND** no karma is awarded for the incomplete week

#### Scenario: Non-parent attempts to create goal
- **WHEN** a non-parent user attempts to create a contribution goal
- **THEN** the system rejects the request with a 403 Forbidden error

### Requirement: Contribution Goal Deductions
Parents SHALL be able to deduct karma from a member's weekly contribution goal with a reason.

#### Scenario: Parent adds deduction to contribution goal
- **WHEN** a parent adds a deduction with amount and reason to a member's contribution goal
- **THEN** the system records the deduction with timestamp and parent ID
- **AND** an activity event of type CONTRIBUTION_GOAL with detail DEDUCTED is created
- **AND** a real-time event is emitted to notify connected clients
- **AND** the deduction appears immediately in the member's activity timeline

#### Scenario: Deduction exceeds remaining potential karma
- **WHEN** a parent adds a deduction that would make total deductions exceed maxKarma
- **THEN** the system accepts the deduction (potential karma can go to zero or below)
- **AND** the member will receive zero karma at week end

#### Scenario: Non-parent attempts to add deduction
- **WHEN** a non-parent user attempts to add a deduction
- **THEN** the system rejects the request with a 403 Forbidden error

### Requirement: Weekly Karma Conversion
The system SHALL automatically convert remaining potential karma to actual karma every Sunday at 18:00 UTC.

#### Scenario: Week ends with positive remaining karma
- **WHEN** the weekly cron job runs at Sunday 18:00 UTC
- **THEN** for each active contribution goal, the system calculates remaining karma (maxKarma - total deductions)
- **AND** if remaining karma is positive, it awards that amount to the member via the karma service
- **AND** an activity event of type CONTRIBUTION_GOAL with detail AWARDED is created
- **AND** a push notification is sent to the member
- **AND** a WebSocket notification is emitted
- **AND** the contribution goal is either deleted or reset for the new week (based on design decision)

#### Scenario: Week ends with zero or negative remaining karma
- **WHEN** the weekly cron job runs and a contribution goal has deductions >= maxKarma
- **THEN** no karma is awarded to the member
- **AND** an activity event records zero karma awarded
- **AND** a notification is still sent informing the member

#### Scenario: No contribution goal exists for member
- **WHEN** the weekly cron job runs and a member has no active contribution goal
- **THEN** no karma conversion occurs for that member

### Requirement: Contribution Goal Retrieval
Family members SHALL be able to view contribution goals for themselves and other family members.

#### Scenario: Member retrieves own contribution goal
- **WHEN** a family member requests their own contribution goal
- **THEN** the system returns the current week's goal with all deductions
- **AND** calculates current potential karma (maxKarma - total deductions)

#### Scenario: Member retrieves another member's contribution goal
- **WHEN** a family member requests another member's contribution goal
- **THEN** the system verifies both users are in the same family
- **AND** returns the current week's goal with all deductions

#### Scenario: Non-family member attempts to retrieve goal
- **WHEN** a user attempts to retrieve a contribution goal for someone not in their family
- **THEN** the system rejects the request with a 403 Forbidden error

#### Scenario: No goal exists for current week
- **WHEN** a member has no contribution goal for the current week
- **THEN** the system returns a 404 Not Found or empty result

### Requirement: Week Boundary Calculation
The system SHALL define week boundaries as Sunday 18:00 UTC to Sunday 18:00 UTC.

#### Scenario: Calculate current week start
- **WHEN** determining the current week for a contribution goal
- **THEN** the system calculates the most recent Sunday 18:00 UTC that has passed
- **AND** uses this as the weekStartDate for new goals and week comparisons

#### Scenario: Goal creation uses current week start
- **WHEN** a new contribution goal is created on Wednesday
- **THEN** the weekStartDate is set to the previous Sunday 18:00 UTC
- **AND** the goal is active immediately for the current week

### Requirement: Data Simplicity and No History
Contribution goals SHALL store only current week data with no historical tracking.

#### Scenario: Only current week goal is stored
- **WHEN** a contribution goal exists for a member
- **THEN** only one goal document exists per member (for current week)
- **AND** no historical data is maintained after week rollover

#### Scenario: Previous week's goal is replaced or deleted
- **WHEN** a new week starts
- **THEN** the previous week's contribution goal is deleted or replaced
- **AND** no archive of past goals is maintained

