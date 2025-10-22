## Why

Families need a way to coordinate and track household tasks and chores. Currently, the Famly platform supports family membership management but lacks task coordination capabilities. This change introduces task management so parents and children can create, assign, and track both one-time and recurring tasks within their family.

## What Changes

- Add new `tasks` module under `apps/api/src/modules/tasks/` following the existing modular Express architecture
- Introduce two MongoDB collections: `tasks` (individual task instances) and `task_schedules` (recurring task templates)
- Implement task CRUD operations with role-based permissions (both parents and children can create/manage tasks)
- Support flexible task assignment: specific family member, all members with a role (parent/child), or unassigned
- Enable task completion tracking via PATCH operation with `completedAt` timestamp field
- Enable recurring task functionality with schedule definitions (days of week, weekly intervals 1-4 weeks)
- Add daily cron job using the `cron` npm package to generate task instances from schedules
- Create RESTful API endpoints under `/v1/families/:familyId/tasks` route structure
- Follow TDD approach with comprehensive unit and e2e tests

## Impact

- **Affected specs**: New `tasks` capability spec
- **Affected code**: 
  - New module: `apps/api/src/modules/tasks/` (domain, repositories, services, routes, validators, lib)
  - App registration: `apps/api/src/app.ts` (mount new routes)
  - Package dependencies: `apps/api/package.json` (add `cron` library)
  - New MongoDB collections: `tasks`, `task_schedules`
  - Test infrastructure: `apps/api/tests/e2e/tasks/` and `apps/api/tests/unit/tasks/`
- **Dependencies**: Reuses existing auth middleware, MongoDB client, Zod validators, Winston logger
- **Breaking changes**: None (new capability, no modifications to existing APIs)