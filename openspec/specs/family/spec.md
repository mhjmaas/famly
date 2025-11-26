# family Specification

## Purpose
TBD - created by archiving change add-user-profile-fields. Update Purpose after archive.
## Requirements
### Requirement: Collect profile fields when adding family members
Parents MUST supply a display name and birthdate whenever they add a new member account to a family.

#### Scenario: Add member succeeds with profile fields
- **GIVEN** a parent payload with `email`, `password`, `role`, `name`, and `birthdate` formatted as ISO `YYYY-MM-DD`
- **WHEN** the client calls `POST /v1/families/{familyId}/members`
- **THEN** the member account is created with the provided `name` and `birthdate`
- **AND** the 201 response echoes `member.name` and `member.birthdate` (or equivalent profile block) for the created user

#### Scenario: Add member rejects missing name
- **GIVEN** a payload that omits `name`
- **WHEN** the parent calls `POST /v1/families/{familyId}/members`
- **THEN** the API responds with HTTP 400 and a validation message indicating `name` is required

### Requirement: Family listings include member profile fields
Family listing responses MUST provide each member's name and birthdate so clients can display recognizable profiles.

#### Scenario: Family list includes member profile fields
- **GIVEN** a family with members that have stored `name` and `birthdate`
- **WHEN** the client calls `GET /v1/families`
- **THEN** every `members[]` entry includes `name` and `birthdate` values for each user

### Requirement: Parents can update member roles
Parents MUST be able to change any family member's role between Parent and Child after the member has been added to the family.

#### Scenario: Update member from Child to Parent
- **GIVEN** a parent authenticated with a family containing a Child member
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{memberId}` with `{ "role": "Parent" }`
- **THEN** the API responds with HTTP 200
- **AND** the response includes the updated `memberId`, `familyId`, `role: "Parent"`, and `updatedAt` timestamp
- **AND** subsequent requests show the member as a Parent

#### Scenario: Update member from Parent to Child
- **GIVEN** a parent authenticated with a family containing another Parent member
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{memberId}` with `{ "role": "Child" }`
- **THEN** the API responds with HTTP 200
- **AND** the response includes the updated `memberId`, `familyId`, `role: "Child"`, and `updatedAt` timestamp
- **AND** subsequent requests show the member as a Child

#### Scenario: Update role rejects non-parent users
- **GIVEN** a Child member authenticated with a family
- **WHEN** the child calls `PATCH /v1/families/{familyId}/members/{memberId}` with any role
- **THEN** the API responds with HTTP 403
- **AND** the response includes an error message indicating insufficient permissions
- **AND** the target member's role remains unchanged

#### Scenario: Update role rejects invalid role values
- **GIVEN** a parent authenticated with a family containing a member
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{memberId}` with `{ "role": "InvalidRole" }`
- **THEN** the API responds with HTTP 400
- **AND** the response includes a validation error message
- **AND** the target member's role remains unchanged

#### Scenario: Update role rejects missing family
- **GIVEN** a parent authenticated user
- **WHEN** the parent calls `PATCH /v1/families/{nonExistentFamilyId}/members/{memberId}` with a valid role
- **THEN** the API responds with HTTP 404
- **AND** the response indicates the family was not found

#### Scenario: Update role rejects missing member
- **GIVEN** a parent authenticated with a family
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{nonExistentMemberId}` with a valid role
- **THEN** the API responds with HTTP 404
- **AND** the response indicates the member was not found

#### Scenario: Update role rejects member from different family
- **GIVEN** a parent authenticated with familyA
- **AND** a member who belongs to familyB but not familyA
- **WHEN** the parent calls `PATCH /v1/families/{familyA}/members/{memberIdFromFamilyB}` with a valid role
- **THEN** the API responds with HTTP 404 or HTTP 409
- **AND** the response indicates the member is not part of the specified family
- **AND** the member's role in familyB remains unchanged

### Requirement: Cascade chat cleanup when removing a family member
Removing a family member MUST cascade to chat data to prevent stale references.

#### Scenario: Remove member clears group chat memberships
- **GIVEN** a family member belongs to one or more group chats
- **WHEN** a parent calls `DELETE /v1/families/{familyId}/members/{memberId}`
- **THEN** the API returns HTTP 204
- **AND** the member's records are removed from `chat_memberships` and each chat's `memberIds`
- **AND** remaining members keep access to those chats

#### Scenario: Remove member deletes any DM involving that member
- **GIVEN** a DM exists between the member being removed and another family member
- **WHEN** a parent calls `DELETE /v1/families/{familyId}/members/{memberId}`
- **THEN** the API returns HTTP 204
- **AND** the DM chat document, its memberships, and its messages are deleted
- **AND** neither participant sees the DM in subsequent chat listings

