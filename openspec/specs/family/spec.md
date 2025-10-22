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

