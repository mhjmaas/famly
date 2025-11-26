## ADDED Requirements
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
