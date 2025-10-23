# Proposal: Add Personal Diary Entries

## Why
Families need a private space for individual members to record personal thoughts, reflections, and daily events. While Famly currently provides family-wide features like tasks and shopping lists, there's no capability for personal, private journaling. This feature will enable users to maintain their own diary entries that are strictly private to the creator, laying the foundation for future family-wide diary capabilities and potential AI-generated entries based on app activity.

## What Changes
- Add new `diary` module following existing module architecture patterns (tasks, shopping-lists)
- Create `diary_entries` MongoDB collection with entries supporting both personal and family scopes
- Implement CRUD operations for personal diary entries only (family entries deferred to future work)
- Add REST API endpoints under `/v1/diary`
- Apply creator ownership authorization for all personal diary entry operations
- Support entry metadata: date, text content, and `isPersonal` boolean indicator
- Include standard audit fields: `createdBy`, `createdAt`, `updatedAt`

## Impact
- Affected specs: New `diary` capability
- Affected code:
  - New module: `apps/api/src/modules/diary/`
  - App registration: `apps/api/src/app.ts` (router mount)
  - Startup: `apps/api/src/server.ts` (index creation)
  - Test suites: Unit tests for validators and mappers, E2E tests for all endpoints
  - API documentation: Bruno collection entries
- Future considerations:
  - Family diary entries (requires family membership authorization)
  - AI-generated entries (requires synthetic "createdBy" user ID for LLM)
  - Both future features are designed into the data model but not implemented in this change
