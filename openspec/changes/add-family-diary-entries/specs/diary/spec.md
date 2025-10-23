## ADDED Requirements

### Requirement: Family Diary Entry Creation
Family members MUST be able to create family diary entries that are visible to all members of the family.

#### Scenario: Create family diary entry with all fields
- **GIVEN** an authenticated family member with valid JWT token
- **WHEN** they POST to `/v1/families/{familyId}/diary` with `{ date: "2025-10-23", entry: "Today our family went to the park together..." }`
- **THEN** the API responds with HTTP 201 and returns the created diary entry with generated `_id`, `createdBy`, `createdAt`, and `updatedAt` timestamps
- **AND** the diary entry is stored in the `diary_entries` collection with `isPersonal: false`
- **AND** the `createdBy` field is set to the authenticated user's ID

#### Scenario: Require family membership for creation
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to POST to `/v1/families/{familyId}/diary`
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Reject entry with missing date
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/diary` with a payload missing the `date` field
- **THEN** the API responds with HTTP 400 and a validation error message indicating `date` is required

#### Scenario: Reject entry with invalid date format
- **GIVEN** an authenticated family member
- **WHEN** they POST with `date` in an invalid format (not YYYY-MM-DD)
- **THEN** the API responds with HTTP 400 and a validation error for date format

#### Scenario: Reject entry with missing entry text
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/diary` with a payload missing the `entry` field
- **THEN** the API responds with HTTP 400 and a validation error message indicating `entry` is required

#### Scenario: Reject entry with entry text exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they POST with `entry` exceeding 10,000 characters
- **THEN** the API responds with HTTP 400 and a validation error for entry length

### Requirement: Family Diary Entry Listing
Family members MUST be able to list all diary entries for their family, sorted by date.

#### Scenario: List all family diary entries
- **GIVEN** an authenticated family member in a family with multiple diary entries
- **WHEN** they GET `/v1/families/{familyId}/diary`
- **THEN** the API responds with HTTP 200 and an array of all family diary entries
- **AND** each diary entry includes `_id`, `date`, `entry`, `isPersonal`, `createdBy`, `createdAt`, `updatedAt`
- **AND** entries are sorted by `date` descending (newest first)
- **AND** all entries have `isPersonal: false`

#### Scenario: Empty list for family with no entries
- **GIVEN** an authenticated family member in a family with no diary entries
- **WHEN** they GET `/v1/families/{familyId}/diary`
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: Only family members can list entries
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to GET `/v1/families/{familyId}/diary`
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Filter by date range
- **GIVEN** an authenticated family member with family diary entries across multiple dates
- **WHEN** they GET `/v1/families/{familyId}/diary?startDate=2025-10-01&endDate=2025-10-31`
- **THEN** only entries with dates within the specified range are returned

### Requirement: Family Diary Entry Retrieval
Family members MUST be able to retrieve a specific family diary entry by ID if it belongs to their family.

#### Scenario: Get family diary entry by ID
- **GIVEN** an authenticated family member in a family with diary entries
- **WHEN** they GET `/v1/families/{familyId}/diary/{entryId}` where entryId is a family diary entry
- **THEN** the API responds with HTTP 200 and the complete diary entry object

#### Scenario: Diary entry not found
- **GIVEN** an authenticated family member
- **WHEN** they GET a non-existent diary entry ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Cannot access another family's entry
- **GIVEN** an authenticated user (UserA) who is a member of FamilyA
- **AND** FamilyB has created a diary entry
- **WHEN** UserA attempts to GET FamilyB's diary entry via `/v1/families/{familyBId}/diary/{entryId}`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Family Diary Entry Update
Family members MUST be able to update family diary entries' date and text content.

#### Scenario: Update family diary entry text
- **GIVEN** an authenticated family member in a family with diary entries
- **WHEN** they PATCH `/v1/families/{familyId}/diary/{entryId}` with `{ entry: "Updated family reflection text" }`
- **THEN** the API responds with HTTP 200 and the updated diary entry
- **AND** `updatedAt` timestamp is refreshed

#### Scenario: Update diary entry date
- **GIVEN** an authenticated family member with a family diary entry
- **WHEN** they PATCH with `{ date: "2025-10-24" }`
- **THEN** the diary entry date is updated to the new value

#### Scenario: Update both date and entry text
- **GIVEN** an authenticated family member with a family diary entry
- **WHEN** they PATCH with `{ date: "2025-10-24", entry: "Corrected family entry" }`
- **THEN** both fields are updated atomically

#### Scenario: Reject update with invalid date
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with date in invalid format
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Reject update with entry exceeding max length
- **GIVEN** an authenticated family member
- **WHEN** they PATCH with entry text exceeding 10,000 characters
- **THEN** the API responds with HTTP 400 and validation error

#### Scenario: Only family members can update entries
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to PATCH `/v1/families/{familyId}/diary/{entryId}`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Family Diary Entry Deletion
Family members MUST be able to delete family diary entries.

#### Scenario: Delete family diary entry successfully
- **GIVEN** an authenticated family member with a family diary entry
- **WHEN** they DELETE `/v1/families/{familyId}/diary/{entryId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the diary entry is removed from the database

#### Scenario: Cannot delete non-existent entry
- **GIVEN** an authenticated family member
- **WHEN** they DELETE a non-existent diary entry ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Only family members can delete entries
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to DELETE `/v1/families/{familyId}/diary/{entryId}`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Family Role Authorization for Diary Entries
All family diary entry operations MUST be protected by family membership authorization.

#### Scenario: Use authorizeFamilyRole middleware on all endpoints
- **GIVEN** the family diary routes are configured
- **WHEN** examining all `/v1/families/{familyId}/diary/*` routes
- **THEN** each route MUST use the `authorizeFamilyRole` middleware
- **AND** the middleware is configured to allow all family roles (parent, child, etc.)
- **AND** the middleware uses `familyIdParam: 'familyId'`

#### Scenario: All family members have equal access
- **GIVEN** a family with members having different roles (parent, child)
- **WHEN** any family member attempts to access family diary operations
- **THEN** all operations are permitted regardless of role
- **AND** both parents and children can create, read, update, and delete family diary entries

## MODIFIED Requirements

### Requirement: Data Model Design for Future Extension
The diary entry data model MUST support both personal and family diary entries with proper scoping.

#### Scenario: isPersonal field distinguishes personal vs family entries
- **GIVEN** diary entries are stored in the database
- **WHEN** examining the document structure
- **THEN** the `isPersonal` boolean field exists to distinguish personal vs. family entries
- **AND** personal entries created via `/v1/diary` have `isPersonal: true`
- **AND** family entries created via `/v1/families/{familyId}/diary` have `isPersonal: false`

#### Scenario: createdBy supports both human and AI authors
- **GIVEN** a diary entry document
- **WHEN** examining the `createdBy` field
- **THEN** it contains an ObjectId that can represent either a real user or a synthetic AI user ID
- **AND** for personal entries, `createdBy` is always set to the authenticated user's ID
- **AND** for family entries, `createdBy` is always set to the authenticated user's ID

#### Scenario: Model structure accommodates family context
- **GIVEN** the diary entry TypeScript interface
- **WHEN** considering family diary entries
- **THEN** the interface design supports family-scoped operations through route context
- **AND** family diary entries are filtered by family membership rather than individual ownership
- **AND** the data model supports future extensions without breaking changes
