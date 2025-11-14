# Design: Task Completion Assignee Attribution

## Current Behavior
- `TaskService.updateTask` sets `completedBy` to the actor toggling the task and awards karma to that same user.
- No role-based guard exists, so any family member can complete any other member’s tasks.
- Real-time `task.completed` events and activity events only expose a single `completedBy` value, making it impossible to distinguish between the actor and the credited member once we change attribution.
- Web Redux thunks optimistically adjust karma using the current viewer’s ID, so UI balances mirror the existing (incorrect) backend rules.

## Proposed Backend Changes
1. **Recipient Resolution:** introduce a helper inside `TaskService.updateTask` that determines the `creditUserId` when a task transitions to completed:
   - Member assignment → `assignment.memberId` wins.
   - Role/unassigned assignment → request `userId` wins.
   Persist this value in `completedBy`, pass it to karma service, and hand it to hooks.
2. **Role Guard:** when `assignment.type === "member"` and `assignment.memberId !== userId`, call `requireFamilyRole` with `Parent` role; otherwise throw 403. This keeps the rest of the update surface unchanged.
3. **Event/Hooks Signature:** extend `TaskCompletionHook` + `emitTaskCompleted` to accept `{ creditedUserId, triggeredBy }` so activity events can log both values and WebSocket payloads can include them (`completedBy` stays the credited user for backward compatibility, `triggeredBy` becomes new field).
4. **Repository Update:** keep `completedBy` semantics the same field but populate it with the credited member; we do not store the actor on the document because hooks + events already expose the triggering ID.
5. **Tests:** cover the new guard, ensure karma awarding honors the assignment, and assert that event payloads contain `triggeredBy` when parents complete tasks for kids.

## Proposed Frontend Changes
1. **Capability Helpers:** add `getTaskKarmaRecipient(task, viewerId)` + `canCompleteTask(task, viewer)` utilities consumed by both Tasks page and Dashboard so logic stays consistent.
2. **Redux:** pass the recipient ID into `completeTask`/`reopenTask` thunks so they can dispatch `incrementKarma`/`decrementKarma` for the right person (and refresh the right balances for reward-claim tasks).
3. **UI affordances:**
   - Disable the checkbox for member-assigned tasks when the viewer is neither the assignee nor a parent, with tooltip text sourced from dictionaries.
   - When a parent completes a task with karma, update toasts to read something like "You marked this done for {name}. They earned {karma} karma points."
   - For role/unassigned tasks, keep current behavior.
4. **Dashboard:** reuse the same helpers so the pending tasks section honors the same completion guard and toast copy.

## Testing Strategy
- Extend Jest e2e suites (`tasks` + `karma`) to prove the backend restrictions, awarding, and event payloads.
- Update API unit tests if needed (e.g., service-level tests for helper).
- Augment Playwright specs under `apps/web/tests/e2e/app/tasks.spec.ts` and `dashboard-overview` scenarios to cover parent/child behaviors and UI messaging.
- Keep existing regression suites (pnpm test, pnpm lint, Playwright) green.
