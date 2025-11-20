# api-contribution-goals Specification

## Purpose
TBD - created by archiving change add-contribution-goals. Update Purpose after archive.
## Requirements
### Requirement: Contribution Goal API Routes
The API SHALL expose REST endpoints for contribution goal management under `/families/:familyId/contribution-goals/*`.

#### Scenario: Create contribution goal endpoint
- **WHEN** POST `/families/:familyId/contribution-goals` is called with title, description, maxKarma, and memberId
- **THEN** the system validates the request body using Zod schema
- **AND** verifies the requesting user is a parent in the family
- **AND** verifies the target member is in the family
- **AND** creates the contribution goal
- **AND** returns 201 Created with the goal DTO

#### Scenario: Get contribution goal for member endpoint
- **WHEN** GET `/families/:familyId/contribution-goals/:memberId` is called
- **THEN** the system verifies the requesting user is a family member
- **AND** returns the current week's contribution goal for the specified member
- **AND** returns 200 OK with goal DTO including calculated remaining karma
- **OR** returns 404 Not Found if no goal exists for current week

#### Scenario: Update contribution goal endpoint
- **WHEN** PUT `/families/:familyId/contribution-goals/:memberId` is called with updated title, description, or maxKarma
- **THEN** the system verifies the requesting user is a parent
- **AND** updates the contribution goal for the current week
- **AND** returns 200 OK with updated goal DTO

#### Scenario: Delete contribution goal endpoint
- **WHEN** DELETE `/families/:familyId/contribution-goals/:memberId` is called
- **THEN** the system verifies the requesting user is a parent
- **AND** deletes the contribution goal
- **AND** returns 204 No Content

#### Scenario: Add deduction endpoint
- **WHEN** POST `/families/:familyId/contribution-goals/:memberId/deductions` is called with amount and reason
- **THEN** the system verifies the requesting user is a parent
- **AND** adds the deduction to the contribution goal
- **AND** creates an activity event
- **AND** emits a real-time event
- **AND** returns 201 Created with updated goal DTO

### Requirement: Contribution Goal Validation
All contribution goal endpoints SHALL validate request data using Zod schemas.

#### Scenario: Validate goal creation request
- **WHEN** creating a contribution goal
- **THEN** title must be 1-200 characters
- **AND** description must be 0-2000 characters
- **AND** maxKarma must be a positive integer (1-10000)
- **AND** memberId must be a valid ObjectId string

#### Scenario: Validate deduction request
- **WHEN** adding a deduction
- **THEN** amount must be a positive integer
- **AND** reason must be 1-500 characters

#### Scenario: Invalid request data
- **WHEN** request data fails validation
- **THEN** the system returns 400 Bad Request with validation errors

### Requirement: Contribution Goal Authorization
All contribution goal endpoints SHALL enforce family membership and role-based access control.

#### Scenario: Verify family membership for all operations
- **WHEN** any contribution goal endpoint is called
- **THEN** the system verifies the requesting user is a member of the specified family
- **AND** returns 403 Forbidden if not a member

#### Scenario: Verify parent role for mutations
- **WHEN** create, update, delete, or add deduction endpoints are called
- **THEN** the system verifies the requesting user has parent role
- **AND** returns 403 Forbidden if not a parent

#### Scenario: Allow any family member to read
- **WHEN** GET contribution goal endpoint is called
- **THEN** any family member can view any member's contribution goal
- **AND** no parent role is required for read operations

### Requirement: Contribution Goal DTOs
The API SHALL return contribution goal data as JSON DTOs with ObjectIds converted to strings.

#### Scenario: Contribution goal DTO structure
- **WHEN** a contribution goal is returned
- **THEN** the DTO includes id (string), familyId (string), memberId (string), weekStartDate (ISO 8601), title, description, maxKarma, deductions array, currentKarma (calculated), createdAt, updatedAt

#### Scenario: Deduction DTO structure
- **WHEN** deductions are returned in a contribution goal
- **THEN** each deduction includes id (string), amount, reason, deductedBy (string), createdAt (ISO 8601)

#### Scenario: ObjectId termination at edge
- **WHEN** contribution goals are retrieved from MongoDB
- **THEN** all ObjectId fields are converted to strings at the mapper layer
- **AND** no ObjectId types are exposed in the API response

### Requirement: Contribution Goal Error Handling
Contribution goal endpoints SHALL return appropriate HTTP status codes and error messages.

#### Scenario: Member not found in family
- **WHEN** creating a goal for a member not in the family
- **THEN** return 404 Not Found with message "Member not found in family"

#### Scenario: Contribution goal not found
- **WHEN** updating, deleting, or adding deduction to non-existent goal
- **THEN** return 404 Not Found with message "Contribution goal not found for current week"

#### Scenario: Internal server error
- **WHEN** an unexpected error occurs during processing
- **THEN** log the error with context
- **AND** return 500 Internal Server Error with generic message

