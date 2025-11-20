# activity-events Specification

## Purpose
TBD - created by archiving change add-activity-events. Update Purpose after archive.
## Requirements
### Requirement: Activity Event Domain Model
The system SHALL provide an `ActivityEvent` entity to track user activities across the platform.

#### Scenario: Activity event structure
- **WHEN** an activity event is created
- **THEN** it MUST contain:
  - Unique identifier (_id)
  - User ID reference (userId)
  - Title (string, required)
  - Description (string, optional)
  - Event type (ActivityEventType enum)
  - Timestamp (createdAt)
  - Optional metadata object with karma value (number, optional)

#### Scenario: Extensible event types
- **WHEN** defining activity event types
- **THEN** the system MUST support an extensible enum with high-level categories:
  - `TASK` (for task creation, completion, and schedule creation)
  - `SHOPPING_LIST` (for shopping list operations)
  - `KARMA` (for karma-related events)
  - `RECIPE` (for recipe operations)
  - `DIARY` (for personal diary entries)
  - `FAMILY_DIARY` (for family diary entries)
  - `REWARD` (for reward redemption and claims)
  - Additional types can be added without breaking changes

### Requirement: Activity Event Retrieval
The system SHALL provide an API endpoint to retrieve activity events for the authenticated user.

#### Scenario: List user activity events
- **WHEN** an authenticated user requests GET `/api/activity-events`
- **THEN** the system MUST return:
  - Array of activity events for the requesting user
  - Events sorted by most recent first (createdAt descending)
  - Maximum of 100 events per request
  - HTTP 200 status with ActivityEventDTO array

#### Scenario: Unauthenticated access denied
- **WHEN** an unauthenticated user requests GET `/api/activity-events`
- **THEN** the system MUST return HTTP 401 Unauthorized

### Requirement: Date Range Filtering
The system SHALL support filtering activity events by date range using query parameters.

#### Scenario: Filter by start date
- **WHEN** user requests GET `/api/activity-events?startDate=2024-01-01`
- **THEN** the system MUST return only events with createdAt >= 2024-01-01T00:00:00Z

#### Scenario: Filter by end date
- **WHEN** user requests GET `/api/activity-events?endDate=2024-12-31`
- **THEN** the system MUST return only events with createdAt <= 2024-12-31T23:59:59Z

#### Scenario: Filter by date range
- **WHEN** user requests GET `/api/activity-events?startDate=2024-01-01&endDate=2024-12-31`
- **THEN** the system MUST return only events within the specified range

#### Scenario: Invalid date format
- **WHEN** user provides date in invalid format (not YYYY-MM-DD)
- **THEN** the system MUST return HTTP 400 Bad Request with validation error message

#### Scenario: No date filters
- **WHEN** user requests GET `/api/activity-events` without date parameters
- **THEN** the system MUST return all events for the user (up to 100 limit)

### Requirement: Activity Event Recording Service
The system SHALL provide a service utility for other modules to record activity events.

#### Scenario: Record activity event from module
- **WHEN** a module calls the activity event service with userId, type, title, description, and metadata
- **THEN** the system MUST:
  - Create a new ActivityEvent record
  - Set createdAt to current timestamp
  - Store the event in the database
  - Return the created event

#### Scenario: Record event with karma metadata
- **WHEN** a module records an event with karma metadata
- **THEN** the system MUST store the karma value in the metadata object

#### Scenario: Record event without optional fields
- **WHEN** a module records an event with only required fields (userId, type, title)
- **THEN** the system MUST create the event with null/undefined optional fields

### Requirement: Database Indexing
The system SHALL create appropriate indexes for efficient activity event queries.

#### Scenario: User and date index
- **WHEN** the application starts
- **THEN** the system MUST create a compound index on (userId, createdAt descending) for efficient user event retrieval

#### Scenario: Date range query optimization
- **WHEN** querying events by date range
- **THEN** the system MUST use the userId + createdAt index for optimal performance

### Requirement: Activity Event DTO
The system SHALL provide a data transfer object for API responses.

#### Scenario: DTO structure
- **WHEN** returning activity events via API
- **THEN** each ActivityEventDTO MUST contain:
  - id (string, converted from ObjectId)
  - userId (string, converted from ObjectId)
  - type (ActivityEventType)
  - title (string)
  - description (string or null)
  - metadata (object with karma number or null)
  - createdAt (ISO 8601 timestamp string)

### Requirement: Contribution Goal Activity Event Type
The activity events system SHALL support CONTRIBUTION_GOAL event type for tracking goal-related activities.

#### Scenario: Record contribution goal deduction event
- **WHEN** a deduction is added to a contribution goal
- **THEN** create activity event with type="CONTRIBUTION_GOAL" and detail="DEDUCTED"
- **AND** include metadata { karma: -amount, triggeredBy: parentUserId }
- **AND** set title to "Karma deducted from contribution goal"
- **AND** set description to the deduction reason

#### Scenario: Record contribution goal award event
- **WHEN** weekly karma is awarded from a contribution goal
- **THEN** create activity event with type="CONTRIBUTION_GOAL" and detail="AWARDED"
- **AND** include metadata { karma: awardedAmount, goalId: string }
- **AND** set title to "Weekly contribution goal completed"
- **AND** set description to goal title and summary

#### Scenario: Activity events are queryable by type and detail
- **WHEN** fetching activity events for a member
- **THEN** CONTRIBUTION_GOAL events appear in chronological order
- **AND** can be filtered by date range to show only current week's deductions

