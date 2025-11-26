# Change: Cascade chat cleanup when removing a family member

## Why
- Removing a family member currently leaves dangling chat memberships and DMs, causing orphaned data and users still seeing removed members.
- Product asks that removing a member also removes them from all chats, and that DMs involving the removed member are fully deleted.

## What Changes
- Cascade chat cleanup when `DELETE /v1/families/{familyId}/members/{memberId}` is called.
- Remove the member from every group chat and delete DMs (chat, messages, memberships) that include the member.
- Emit appropriate chat updates and ensure data integrity with transactional safety where possible.
- Add E2E coverage proving group chat removal and DM deletion behaviors.

## Impact
- Affected specs: chat, family
- Affected code: family service removal flow, chat repositories/services for cascade utilities, E2E test suite
