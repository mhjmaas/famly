## Why
Users need visibility into their activity history across the platform. Currently, actions like completing tasks, creating recipes, adding diary entries, and other significant events happen without a unified trail. An activity event system provides users with a chronological feed of their accomplishments and actions, enhancing engagement and providing a sense of progress.

## What Changes
- Add new `activity-events` capability with domain model, repository, service, and API endpoint
- Create `ActivityEvent` domain entity with title, optional description, extensible type enum, timestamp, optional metadata (starting with karma value), and user association
- Implement GET endpoint `/api/activity-events` to retrieve events for the authenticated user, sorted by most recent first, with 100-row limit and date range filtering (startDate/endDate query parameters)
- Provide utility service for other modules to easily record activity events when significant actions occur
- Follow existing patterns from diary module for date filtering and pagination
- Integrate activity event recording in tasks module for:
  - Non-recurring task creation (manual tasks only, not schedule-generated tasks)
  - Recurring task schedule creation
  - Task completion (via existing task completion hook)
- Extend e2e tests for tasks module to verify activity event creation

## Impact
- Affected specs: **NEW** `activity-events` capability, **MODIFIED** `tasks` capability
- Affected code: 
  - New module at `apps/api/src/modules/activity-events/`
  - Tasks module integration in service layer and completion hook
  - Extended e2e tests for tasks module
  - No breaking changes to existing APIs
