# Proposal: Granularize Activity Events with Detail Field

## Overview

The activity timeline currently conflates different types of user actions (task creation, task completion, schedule creation) into single event types. This causes misleading UI presentation where task creation events display karma indicators and icons that suggest the user received karma, when they actually just created a task.

This proposal adds an `eventDetail` field to the `ActivityEvent` model to distinguish between different actions within the same event type, enabling the web app to display contextually appropriate indicators.

## Problem Statement

- **Current behavior**: A TASK event is recorded both when a user creates a task and when a user completes a task. The web app displays karma indicators for all TASK events, making task creation appear to grant karma when it does not.
- **Root cause**: The ActivityEvent model lacks granular enough information to distinguish between different actions on the same entity type.
- **Impact**: Users see misleading visual feedback in their activity timeline, creating false impression of karma gains for task creation.

## Solution

Add an `eventDetail` field to the `ActivityEvent` domain model. This field specifies what action occurred and enables the web app to conditionally render indicators based on the combination of `type` and `detail`.

### Example Changes

**Before:**
```typescript
{
  type: "TASK",
  title: "Buy groceries",
  metadata: { karma: 0 }  // Displayed but misleading
}
```

**After:**
```typescript
{
  type: "TASK",
  detail: "CREATED",      // No karma indicator shown
  title: "Buy groceries",
  metadata: { karma: 0 }
}

{
  type: "TASK",
  detail: "COMPLETED",    // Karma indicator shown if karma > 0
  title: "Buy groceries",
  metadata: { karma: 25 }
}
```

## Scope

This change affects:
- **API**: ActivityEvent domain model, all services recording activity events (tasks, shopping-lists, recipes, diary, rewards)
- **Database**: MongoDB schema migration to add `eventDetail` field
- **Web**: Activity timeline display logic to use `type + detail` for conditional rendering

### Affected Modules
- `/apps/api/src/modules/activity-events` - Core domain model
- `/apps/api/src/modules/tasks` - Task/schedule event recording
- `/apps/api/src/modules/shopping-lists` - Shopping list event recording
- `/apps/api/src/modules/recipes` - Recipe event recording
- `/apps/api/src/modules/diary` - Diary event recording
- `/apps/api/src/modules/rewards` - Reward event recording
- `/apps/web/src/components/profile/activity-timeline.tsx` - Event display logic
- `/apps/web/src/lib/utils/activity-utils.ts` - Activity utilities

## Backward Compatibility

The `eventDetail` field is **optional** in the initial implementation. Existing activity events in the database will work without this field. New events will always include it. The web app will gracefully handle events without `eventDetail` by defaulting to current display behavior.

## Success Criteria

1. ✅ ActivityEvent domain model includes `eventDetail` field
2. ✅ All activity event recording calls specify appropriate detail value
3. ✅ Web app activity timeline conditionally displays karma indicators based on `type + detail`
4. ✅ Unit and E2E tests verify event detail recording and display logic
5. ✅ No karma indicators shown for TASK CREATED, SHOPPING_LIST CREATED, RECIPE CREATED events
6. ✅ Karma indicators still shown for TASK COMPLETED, REWARD CLAIMED with positive karma

## Dependencies

- None. This is a self-contained enhancement to activity event tracking.

## Timeline Considerations

- Implementation can proceed in parallel with other work
- No external service dependencies
- Database schema change is backward compatible
