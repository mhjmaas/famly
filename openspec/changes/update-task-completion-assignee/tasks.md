## 1. Backend Logic
- [ ] 1.1 Update `TaskService.updateTask` + repository to compute/store the credited member (`completedBy`) based on assignment and capture the triggering actor separately.
- [ ] 1.2 Add authorization guard so only the assignee or a parent can complete member-assigned tasks; keep existing behavior for role/unassigned tasks.
- [ ] 1.3 Extend completion hooks + realtime emitters to accept `{ creditedUserId, triggeredBy }` and persist metadata needed by karma/activity services.

## 2. Backend Tests
- [ ] 2.1 Extend tasks e2e suite to cover parent-completes-child success, child-on-child failure (403), and stored `completedBy` pointing to the assignee.
- [ ] 2.2 Expand karma integration e2e to prove parent-triggered completion awards/deducts karma for the assignment owner.
- [ ] 2.3 Update realtime/task activity tests to assert the new `triggeredBy` payload metadata.

## 3. Frontend State
- [ ] 3.1 Introduce helpers/selectors that determine if the viewer can toggle a task and compute the karma recipient ID.
- [ ] 3.2 Update `completeTask`/`reopenTask` thunks plus karma slice interactions so increments/decrements target the credited member (including reward-claim refresh paths).

## 4. Frontend UI
- [ ] 4.1 Update Tasks page components (card, list, hooks) to disable checkboxes for unauthorized viewers, show explanatory tooltip text, and emit toasts referencing who earned karma.
- [ ] 4.2 Apply the same completion guard + messaging to Dashboard pending tasks, ensuring parents can complete on behalf of others and that sidebar karma summaries stay accurate.

## 5. Frontend Tests
- [ ] 5.1 Extend Playwright tasks specs to cover parent-vs-child completion behavior and toast messaging/karma updates.
- [ ] 5.2 Extend Playwright dashboard specs to confirm the pending tasks section enforces the new rules.
- [ ] 5.3 Add/update Redux unit tests (tasks/karma slices) for the new helpers if coverage gaps exist.

## 6. Validation
- [ ] 6.1 `cd apps/api && pnpm test --filter e2e`
- [ ] 6.2 `cd apps/web && pnpm run test:e2e`
- [ ] 6.3 `pnpm lint`
