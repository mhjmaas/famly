# Change: Add Realtime Events Platform

## Why

The current WebSocket implementation is tightly coupled to the chat module, but many other features require real-time updates:
- Recurring tasks are generated asynchronously and users don't see them until they refresh
- Karma changes (from task completion, manual grants, reward claims) aren't visible in real-time
- When a child claims a reward, the parent approval task doesn't appear until refresh
- Users can't be notified instantly when tasks are assigned to them or their role

This creates a poor user experience where critical updates are delayed and users must manually refresh to see changes.

## What Changes

- **Extract reusable WebSocket infrastructure** from chat module into a shared `realtime` module
- **Standardize event emission pattern** across all modules (tasks, karma, rewards)
- **Add user-scoped room pattern** for targeted notifications (already exists for chat, extend for all events)
- **Implement notification UI** using Sonner for task assignments and other key events
- **Document PWA compatibility** to ensure WebSocket approach works with service workers for future push notifications

### Backend Changes
- Create `src/modules/realtime` with reusable Socket.IO infrastructure
- Add event emitters in tasks module (task.created, task.assigned, task.completed, task.deleted)
- Add event emitters in karma module (karma.awarded, karma.deducted)
- Add event emitters in rewards module (claim.created, approval_task.created)
- Refactor chat module to use shared realtime infrastructure

### Frontend Changes
- Create reusable WebSocket client hook (`useRealtimeConnection`)
- Create event-specific hooks (`useTaskEvents`, `useKarmaEvents`, `useRewardEvents`)
- Add Sonner toast notifications for task assignments
- Update task, karma, and reward list pages to auto-refresh on events
- Ensure service worker compatibility for future PWA notifications

## Impact

**Affected specs:**
- `realtime-events` (NEW) - Core real-time event infrastructure
- `tasks` - Add real-time event emission requirements
- `karma` - Add real-time event emission requirements  
- `rewards` - Add real-time event emission requirements
- `web-tasks` - Add real-time subscription and UI updates
- `web-rewards` - Add real-time subscription and UI updates

**Affected code:**
- `apps/api/src/modules/chat/realtime/` - Refactor to use shared infrastructure
- `apps/api/src/modules/realtime/` - NEW shared module
- `apps/api/src/modules/tasks/services/` - Add event emission
- `apps/api/src/modules/karma/services/` - Add event emission
- `apps/api/src/modules/rewards/services/` - Add event emission
- `apps/web/src/lib/realtime/` - NEW WebSocket client
- `apps/web/src/app/(dashboard)/tasks/` - Add real-time updates
- `apps/web/src/app/(dashboard)/rewards/` - Add real-time updates

**Breaking changes:** None - this is additive functionality

**PWA Compatibility:** WebSocket connections will coexist with service workers. When app is in background, WebSocket will disconnect but service worker can receive push notifications. Design ensures smooth handoff between both mechanisms.
