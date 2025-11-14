## 1. Backend Logic
- [x] 1.1 Update `TaskService.updateTask` + repository to compute/store the credited member (`completedBy`) based on assignment and capture the triggering actor separately.
- [x] 1.2 Add authorization guard so only the assignee or a parent can complete member-assigned tasks; keep existing behavior for role/unassigned tasks.
- [x] 1.3 Extend completion hooks + realtime emitters to accept `{ creditedUserId, triggeredBy }` and persist metadata needed by karma/activity services.

## 2. Backend Tests
- [x] 2.1 Extend tasks e2e suite to cover parent-completes-child success, child-on-child failure (403), and stored `completedBy` pointing to the assignee.
- [x] 2.2 Expand karma integration e2e to prove parent-triggered completion awards/deducts karma for the assignment owner.
- [x] 2.3 Update realtime/task activity tests to assert the new `triggeredBy` payload metadata.

## 3. Frontend State
- [x] 3.1 Introduce helpers/selectors that determine if the viewer can toggle a task and compute the karma recipient ID.
- [x] 3.2 Update `completeTask`/`reopenTask` thunks plus karma slice interactions so increments/decrements target the credited member (including reward-claim refresh paths).

## 4. Frontend UI
- [x] 4.1 Update Tasks page components (card, list, hooks) to disable checkboxes for unauthorized viewers, show explanatory tooltip text, and emit toasts referencing who earned karma.
- [x] 4.2 Apply the same completion guard + messaging to Dashboard pending tasks, ensuring parents can complete on behalf of others and that sidebar karma summaries stay accurate.

## 5. Frontend Tests  
- [x] 5.1 Extend Playwright tasks specs to cover parent-vs-child completion behavior and toast messaging/karma updates.
- [x] 5.2 Extend Playwright dashboard specs to confirm the pending tasks section enforces the new rules.
- [x] 5.3 Add/update Redux unit tests (tasks/karma slices) for the new helpers if coverage gaps exist.

## Implementation Notes

### Completed
- ✅ Backend E2E tests passing (authorization, karma credit, realtime events)
- ✅ Frontend helpers created (`canCompleteTask`, `getTaskCompletionBlockedReason`, `getTaskKarmaRecipient`)
- ✅ Redux thunks updated to pass full task object and use credited user for karma
- ✅ TaskCard component supports disabled checkboxes with title tooltips
- ✅ TaskGroup updated to pass authorization props
- ✅ TasksView integration complete with authorization checks and karma recipient toasts
- ✅ Dashboard components updated with authorization guards
- ✅ Playwright tests added for parent/child completion scenarios and toast messaging

### Key Implementation Details
- Authorization check happens in `handleToggleComplete` before API call
- Disabled checkboxes shown with title attribute tooltip explaining why completion is blocked
- Toast messages differentiate between completing own task vs completing for another family member
- Dashboard silently prevents unauthorized completions (no error toast, user can navigate to tasks page for details)

## 6. Validation
- [x] 6.1 `cd apps/api && pnpm test` (backend tests passing)
- [x] 6.2 `cd apps/web && pnpm run test:e2e`
- [x] 6.3 `pnpm lint`
