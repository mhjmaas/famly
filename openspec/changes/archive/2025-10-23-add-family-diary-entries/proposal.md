## Why
Family members need to share diary entries with each other to foster communication and create shared family memories, complementing the existing personal diary functionality.

## What Changes
- Add family diary entry endpoints under `/v1/families/{familyId}/diary` following the established family-scoped route pattern
- Extend existing diary functionality to support `isPersonal: false` entries that are visible to all family members
- Implement family role-based authorization so all family members can create, read, update, and delete family diary entries
- Maintain creator ownership tracking via `createdBy` field while allowing family-wide access

## Impact
- Affected specs: diary (extending existing requirements)
- Affected code: diary module routes, family router mounting, authorization middleware integration
- Database: Uses existing `diary_entries` collection with `isPersonal: false` entries
- API: New family-scoped endpoints following `/v1/families/{familyId}/diary` pattern
