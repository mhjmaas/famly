# Implementation Tasks

## 1. Backend: Shared Realtime Infrastructure
- [ ] 1.1 Create `apps/api/src/modules/realtime/` module structure
- [ ] 1.2 Extract Socket.IO server creation to `realtime/server/socket-server.ts`
- [ ] 1.3 Extract authentication middleware to `realtime/server/auth.middleware.ts`
- [ ] 1.4 Create base event emitter interface in `realtime/events/event-emitter.ts`
- [ ] 1.5 Create room manager utility in `realtime/rooms/room-manager.ts`
- [ ] 1.6 Update `apps/api/src/server.ts` to use new realtime module
- [ ] 1.7 Write unit tests for realtime infrastructure

## 2. Backend: Refactor Chat Module
- [ ] 2.1 Update chat module to import Socket.IO server from realtime module
- [ ] 2.2 Refactor `chat/realtime/events/chat-events.ts` to use shared event emitter pattern
- [ ] 2.3 Run all existing chat E2E tests to verify no regression
- [ ] 2.4 Update chat module documentation

## 3. Backend: Tasks Event Emission
- [ ] 3.1 Create `apps/api/src/modules/tasks/events/task-events.ts`
- [ ] 3.2 Add event emission in `TaskGeneratorService.processSchedule()` for task.created
- [ ] 3.3 Add event emission in `TaskService.createTask()` for task.created and task.assigned
- [ ] 3.4 Add event emission in `TaskService.updateTask()` for task.assigned (when assignment changes)
- [ ] 3.5 Add event emission in task completion hooks for task.completed
- [ ] 3.6 Add event emission in `TaskService.deleteTask()` for task.deleted
- [ ] 3.7 Write unit tests for task event emission
- [ ] 3.8 Write E2E tests for task events (connect WebSocket, verify broadcasts)

## 4. Backend: Karma Event Emission
- [ ] 4.1 Create `apps/api/src/modules/karma/events/karma-events.ts`
- [ ] 4.2 Add event emission in `KarmaService.awardKarma()` for karma.awarded
- [ ] 4.3 Add event emission in `KarmaService.deductKarma()` for karma.deducted
- [ ] 4.4 Write unit tests for karma event emission
- [ ] 4.5 Write E2E tests for karma events

## 5. Backend: Reward Event Emission
- [ ] 5.1 Create `apps/api/src/modules/rewards/events/reward-events.ts`
- [ ] 5.2 Add event emission in `ClaimService.createClaim()` for claim.created and approval_task.created
- [ ] 5.3 Add event emission in `ClaimService.completeClaimFromTask()` for claim.completed
- [ ] 5.4 Add event emission in `ClaimService.cancelClaim()` for claim.cancelled
- [ ] 5.5 Write unit tests for reward event emission
- [ ] 5.6 Write E2E tests for reward events

## 6. Frontend: WebSocket Client Infrastructure
- [ ] 6.1 Create `apps/web/src/lib/realtime/` directory structure
- [ ] 6.2 Implement `use-realtime-connection.ts` hook for Socket.IO connection management
- [ ] 6.3 Create event payload types in `lib/realtime/types.ts`
- [ ] 6.4 Add connection state UI indicator (online/offline badge)
- [ ] 6.5 Handle reconnection and automatic room re-joining

## 7. Frontend: Task Event Subscriptions
- [ ] 7.1 Implement `lib/realtime/use-task-events.ts` hook
- [ ] 7.2 Integrate useTaskEvents in `app/(dashboard)/tasks/page.tsx` to dispatch Redux actions
- [ ] 7.3 Update task event handlers to dispatch `fetchTasks` thunk on events
- [ ] 7.4 Add toast notification (Sonner) for task.assigned events
- [ ] 7.5 Add toast notification for task.created events (when assigned to user)
- [ ] 7.6 Handle task.completed events (dispatch fetchTasks, show toast if user's task)
- [ ] 7.7 Handle task.deleted events (dispatch fetchTasks to sync store)
- [ ] 7.8 Write unit tests for task event handlers with 100% coverage
- [ ] 7.9 Write Playwright E2E tests for task notifications

## 8. Frontend: Karma Event Subscriptions
- [ ] 8.1 Implement `lib/realtime/use-karma-events.ts` hook
- [ ] 8.2 Update karma event handlers to dispatch `setKarma` action on events
- [ ] 8.3 Integrate useKarmaEvents in karma balance displays
- [ ] 8.4 Add toast notification for karma.awarded events
- [ ] 8.5 Add visual indicator when karma balance updates in Redux store
- [ ] 8.6 Write unit tests for karma event handlers with 100% coverage
- [ ] 8.7 Write Playwright E2E tests for karma updates

## 9. Frontend: Reward Event Subscriptions
- [ ] 9.1 Implement `lib/realtime/use-reward-events.ts` hook
- [ ] 9.2 Update reward event handlers to dispatch `fetchRewards` and `fetchClaims` thunks
- [ ] 9.3 Integrate useRewardEvents in `app/(dashboard)/rewards/page.tsx`
- [ ] 9.4 Add toast notification for claim.created events
- [ ] 9.5 Add toast notification for approval_task.created (parent only, dispatch fetchTasks)
- [ ] 9.6 Handle claim.completed events (dispatch fetchClaims and fetchKarma)
- [ ] 9.7 Write unit tests for reward event handlers with 100% coverage
- [ ] 9.8 Write Playwright E2E tests for reward claim flow

## 10. Documentation & Monitoring
- [ ] 10.1 Create README.md in `apps/api/src/modules/realtime/`
- [ ] 10.2 Update API documentation with event contracts
- [ ] 10.3 Create developer guide for adding new real-time events
- [ ] 10.4 Add structured logging for all event emissions
- [ ] 10.5 Document PWA push notification integration path
- [ ] 10.6 Add monitoring for WebSocket connection counts

## 11. Testing & Validation
- [ ] 11.1 Run full test suite (unit + E2E) and verify all pass
- [ ] 11.2 Manual testing: Create recurring tasks and verify notifications
- [ ] 11.3 Manual testing: Grant karma and verify recipient sees update
- [ ] 11.4 Manual testing: Claim reward and verify parent receives task notification
- [ ] 11.5 Test reconnection scenarios (disconnect/reconnect)
- [ ] 11.6 Test multi-device scenarios (same user on multiple devices)
- [ ] 11.7 Performance testing: Verify no memory leaks with long-running connections
