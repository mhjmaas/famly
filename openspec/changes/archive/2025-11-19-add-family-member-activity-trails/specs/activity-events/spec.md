# Family Member Activity Trails Specification

## Purpose

Extend the existing activity events system to allow family members to view each other's activity trails within the family context, enabling family oversight and engagement while maintaining proper authorization boundaries.

## Requirements

### Requirement: Family Member Activity Events Retrieval

The system SHALL provide an API endpoint to retrieve activity events for any family member, scoped to the requesting user's family membership.

#### Scenario: Retrieve family member activity events

- **WHEN** an authenticated user requests `GET /families/{familyId}/members/{memberId}/activity-events`
- **AND** the requesting user is a member of the specified family
- **AND** the target member exists in the specified family
- **THEN** the system MUST return:
  - Array of activity events for the target family member
  - Events sorted by most recent first (createdAt descending)
  - Maximum of 100 events per request
  - HTTP 200 status with ActivityEventDTO array

#### Scenario: Unauthorized access to different family

- **WHEN** an authenticated user requests `GET /families/{familyId}/members/{memberId}/activity-events`
- **AND** the requesting user is NOT a member of the specified family
- **THEN** the system MUST return HTTP 403 Forbidden

#### Scenario: Retrieve activity for non-existent family member

- **WHEN** an authenticated user requests `GET /families/{familyId}/members/{memberId}/activity-events`
- **AND** the requesting user is a member of the family but the target member is not
- **THEN** the system MUST return HTTP 404 Not Found

### Requirement: Family Role Authorization

The system SHALL support both Parent and Child roles to view family member activity events.

#### Scenario: Parent views child activity

- **WHEN** a Parent member requests activity events for any family member
- **THEN** the system MUST return the requested member's activity events

#### Scenario: Child views sibling activity

- **WHEN** a Child member requests activity events for another family member
- **THEN** the system MUST return the requested member's activity events

#### Scenario: Child views own activity via family endpoint

- **WHEN** a Child member requests their own activity events via the family endpoint
- **THEN** the system MUST return the member's own activity events

### Requirement: Date Range Filtering for Family Members

The system SHALL support the same date range filtering capabilities for family member activity events as for user's own events.

#### Scenario: Filter family member events by start date

- **WHEN** user requests `GET /families/{familyId}/members/{memberId}/activity-events?startDate=2024-01-01`
- **THEN** the system MUST return only events with createdAt >= 2024-01-01T00:00:00Z

#### Scenario: Filter family member events by date range

- **WHEN** user requests `GET /families/{familyId}/members/{memberId}/activity-events?startDate=2024-01-01&endDate=2024-12-31`
- **THEN** the system MUST return only events within the specified range

#### Scenario: Invalid date format for family member request

- **WHEN** user provides date in invalid format for family member request
- **THEN** the system MUST return HTTP 400 Bad Request with validation error message

### Requirement: Backward Compatibility

The system SHALL maintain the existing user-only activity events endpoint for backward compatibility.

#### Scenario: Existing user endpoint unchanged

- **WHEN** user requests `GET /activity-events` (without family/member path)
- **THEN** the system MUST return the authenticated user's own activity events as before
- **AND** no changes to existing behavior or API contract

### Requirement: Family Membership Validation

The system SHALL validate family membership using existing family membership infrastructure.

#### Scenario: Validate requesting user membership

- **WHEN** processing any family member activity request
- **THEN** the system MUST verify the requesting user is a member of the specified family
- **AND** use existing family membership repository for validation

#### Scenario: Validate target member membership

- **WHEN** processing family member activity request
- **THEN** the system MUST verify the target member is a member of the specified family
- **AND** return 404 if target member is not found in the family

### Requirement: Enhanced Service Layer

The activity events service SHALL be extended with family-scoped retrieval methods.

#### Scenario: Family member activity retrieval

- **WHEN** service method `getEventsForFamilyMember` is called with familyId, memberId, and date range
- **THEN** the service MUST:
  - Validate family membership for both requesting user and target member
  - Retrieve activity events for the target member
  - Apply date range filtering if provided
  - Return the events sorted by most recent first

#### Scenario: Service layer authorization integration

- **WHEN** family member activity service is called
- **THEN** the service MUST integrate with existing family authorization patterns
- **AND** use `requireFamilyRole` or equivalent validation logic
- **AND** throw appropriate HTTP errors for authorization failures

### Requirement: Request Validation

The system SHALL provide comprehensive validation for family member activity requests.

#### Scenario: Validate family and member ID formats

- **WHEN** processing family member activity request
- **THEN** the system MUST validate that familyId and memberId are valid ObjectId formats
- **AND** return HTTP 400 Bad Request for invalid ID formats

#### Scenario: Validate date parameters

- **WHEN** processing family member activity request with date parameters
- **THEN** the system MUST validate date formats using existing validation patterns
- **AND** return HTTP 400 Bad Request for invalid date formats

### Requirement: Data Transfer Objects

The system SHALL use the existing ActivityEventDTO structure for family member activity responses.

#### Scenario: DTO consistency

- **WHEN** returning family member activity events
- **THEN** each ActivityEventDTO MUST contain the same structure as user-only events:
  - id (string, converted from ObjectId)
  - userId (string, converted from ObjectId)
  - type (ActivityEventType)
  - title (string)
  - description (string or null)
  - metadata (object with karma number or null)
  - createdAt (ISO 8601 timestamp string)

### Requirement: Error Handling

The system SHALL provide consistent error handling for family member activity requests.

#### Scenario: Family not found

- **WHEN** requesting activity for a non-existent family
- **THEN** the system MUST return HTTP 404 Not Found

#### Scenario: Member not found in family

- **WHEN** requesting activity for a member not in the specified family
- **THEN** the system MUST return HTTP 404 Not Found

#### Scenario: Authorization failure

- **WHEN** requesting activity without proper family membership
- **THEN** the system MUST return HTTP 403 Forbidden

#### Scenario: Invalid request parameters

- **WHEN** providing invalid familyId, memberId, or date parameters
- **THEN** the system MUST return HTTP 400 Bad Request with descriptive error message

### Requirement: Performance and Indexing

The system SHALL maintain optimal query performance for family member activity retrieval.

#### Scenario: Efficient family member queries

- **WHEN** querying activity events for family members
- **THEN** the system MUST utilize existing userId + createdAt indexes
- **AND** maintain query performance similar to user-only requests
- **AND** not require additional database indexes

### Requirement: Integration with Existing Activity System

The system SHALL integrate seamlessly with the existing activity events infrastructure.

#### Scenario: Shared service methods

- **WHEN** implementing family member activity retrieval
- **THEN** the system MUST reuse existing repository methods where possible
- **AND** maintain consistency with existing activity event patterns
- **AND** not duplicate existing activity event recording functionality

#### Scenario: Consistent event data

- **WHEN** retrieving activity events for family members
- **THEN** the events MUST have the same data structure and metadata as user-only events
- **AND** maintain the same event types and recording mechanisms
