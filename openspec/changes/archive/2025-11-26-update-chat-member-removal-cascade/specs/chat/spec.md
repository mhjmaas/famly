## ADDED Requirements
### Requirement: Cascade chat cleanup on family member removal
Removing a family member MUST clean up their chat participation to avoid orphaned chats or memberships.

#### Scenario: Remove member from all group chats
- **GIVEN** a family member participates in one or more group chats
- **WHEN** a parent calls `DELETE /v1/families/{familyId}/members/{memberId}`
- **THEN** the member's chat memberships are deleted for each group chat
- **AND** each chat's `memberIds` no longer includes the removed member
- **AND** the chats remain accessible to remaining members

#### Scenario: Delete DM when a participant is removed
- **GIVEN** a direct-message chat that includes the member being removed
- **WHEN** a parent calls `DELETE /v1/families/{familyId}/members/{memberId}`
- **THEN** the DM chat document is deleted
- **AND** all chat memberships for that DM are deleted
- **AND** all messages for that DM are deleted
- **AND** subsequent chat listings for both participants no longer include the deleted DM
