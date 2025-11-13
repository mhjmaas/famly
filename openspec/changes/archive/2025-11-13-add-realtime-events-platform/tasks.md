# Implementation Tasks

## 1. Backend: Shared Realtime Infrastructure
- [x] 1.1 Create `apps/api/src/modules/realtime/` module structure
- [x] 1.2 Extract Socket.IO server creation to `realtime/server/socket-server.ts`
- [x] 1.3 Extract authentication middleware to `realtime/server/auth.middleware.ts`
- [x] 1.4 Create base event emitter interface in `realtime/events/event-emitter.ts`
- [x] 1.5 Create room manager utility in `realtime/rooms/room-manager.ts`
- [x] 1.6 Update `apps/api/src/server.ts` to use new realtime module

## 2. Backend: Refactor Chat Module
- [x] 2.1 Update chat module to import Socket.IO server from realtime module
- [x] 2.2 Refactor `chat/realtime/events/chat-events.ts` to use shared event emitter pattern
- [x] 2.3 Run all existing chat E2E tests to verify no regression
- [x] 2.4 Update chat module documentation

## 3. Backend: Tasks Event Emission
- [x] 3.1 Create `apps/api/src/modules/tasks/events/task-events.ts`
- [x] 3.2 Add event emission in `TaskGeneratorService.processSchedule()` for task.created
- [x] 3.3 Add event emission in `TaskService.createTask()` for task.created and task.assigned
- [x] 3.4 Add event emission in `TaskService.updateTask()` for task.assigned (when assignment changes)
- [x] 3.5 Add event emission in task completion hooks for task.completed
- [x] 3.6 Add event emission in `TaskService.deleteTask()` for task.deleted
- [x] 3.7 Write E2E tests for task events (connect WebSocket, verify broadcasts)

## 4. Backend: Karma Event Emission
- [x] 4.1 Create `apps/api/src/modules/karma/events/karma-events.ts`
- [x] 4.2 Add event emission in `KarmaService.awardKarma()` for karma.awarded
- [x] 4.3 Add event emission in `KarmaService.deductKarma()` for karma.deducted
- [x] 4.4 Write E2E tests for karma events

## 5. Backend: Reward Event Emission
- [x] 5.1 Create `apps/api/src/modules/rewards/events/reward-events.ts`
- [x] 5.2 Add event emission in `ClaimService.createClaim()` for claim.created and approval_task.created
- [x] 5.3 Add event emission in `ClaimService.completeClaimFromTask()` for claim.completed
- [x] 5.4 Add event emission in `ClaimService.cancelClaim()` for claim.cancelled
- [x] 5.5 Write E2E tests for reward events

## 6. Frontend: WebSocket Client Infrastructure
- [x] 6.1 Create `apps/web/src/lib/realtime/` directory structure
- [x] 6.2 Implement `use-realtime-connection.ts` hook for Socket.IO connection management
- [x] 6.3 Create event payload types in `lib/realtime/types.ts`
- [x] 6.4 Add connection state UI indicator (online/offline badge)
- [x] 6.5 Handle reconnection and automatic room re-joining

## 7. Frontend: Task Event Subscriptions
- [x] 7.1 Implement `lib/realtime/use-task-events.ts` hook
- [x] 7.2 Integrate useTaskEvents via RealtimeProvider to dispatch Redux actions
- [x] 7.3 Update task event handlers to dispatch `fetchTasks` thunk on events
- [x] 7.4 Add toast notification (Sonner) for task.assigned events
- [x] 7.5 Add toast notification for task.created events (when assigned to user)
- [x] 7.6 Handle task.completed events (dispatch fetchTasks, show toast if user's task)
- [x] 7.7 Handle task.deleted events (dispatch fetchTasks to sync store)

## 8. Frontend: Karma Event Subscriptions
- [x] 8.1 Implement `lib/realtime/use-karma-events.ts` hook
- [x] 8.2 Update karma event handlers to dispatch `fetchKarma` thunk on events
- [x] 8.3 Integrate useKarmaEvents via RealtimeProvider
- [x] 8.4 Add toast notification for karma.awarded events
- [x] 8.5 Add visual indicator when karma balance updates in Redux store

## 9. Frontend: Reward Event Subscriptions
- [x] 9.1 Implement `lib/realtime/use-reward-events.ts` hook
- [x] 9.2 Update reward event handlers to dispatch `fetchRewards` and `fetchClaims` thunks
- [x] 9.3 Integrate useRewardEvents via RealtimeProvider
- [x] 9.4 Add toast notification for claim.created events
- [x] 9.5 Add toast notification for approval_task.created (parent only, dispatch fetchTasks)
- [x] 9.6 Handle claim.completed events (dispatch fetchClaims and fetchKarma)
- [x] 9.7 Implement reward CRUD event emission (reward.created, reward.updated, reward.deleted)
- [x] 9.8 Update use-reward-events hook to handle reward CRUD events
- [x] 9.9 Write Playwright E2E tests for reward claim flow

## 10. Backend: Family Member Event Emission
- [x] 10.1 Create `apps/api/src/modules/family/events/family-events.ts`
- [x] 10.2 Add event emission in `FamilyService.addFamilyMember()` for family.member.added
- [x] 10.3 Add event emission in `FamilyService.removeFamilyMember()` for family.member.removed
- [x] 10.4 Add event emission in `FamilyService.updateMemberRole()` for family.member.role.updated
- [x] 10.5 Write E2E tests for family member events

## 11. Frontend: Family Member Event Subscriptions
- [x] 11.1 Implement `lib/realtime/use-family-events.ts` hook
- [x] 11.2 Update family event handlers to dispatch `fetchFamilies` thunk
- [x] 11.3 Integrate useFamilyEvents via RealtimeProvider
- [x] 11.4 Add toast notifications for family member events
- [x] 11.5 Fix loading state flickering on family member updates
- [x] 11.6 Write Playwright E2E tests for family member updates

## 12. Backend: Activity Event Emission
- [x] 12.1 Create `apps/api/src/modules/activity-events/events/activity-events.ts`
- [x] 12.2 Add event emission in `ActivityEventService.recordEvent()` for activity.created
- [x] 12.3 Activities are automatically emitted when tasks complete, karma awarded, rewards claimed

## 13. Frontend: Activity Event Subscriptions
- [x] 13.1 Create `apps/web/src/store/slices/activities.slice.ts` Redux slice
- [x] 13.2 Implement `lib/realtime/use-activity-events.ts` hook
- [x] 13.3 Update activity event handlers to dispatch `fetchActivityEvents` thunk
- [x] 13.4 Integrate useActivityEvents via RealtimeProvider
- [x] 13.5 Update profile page to use Redux state for activities
- [x] 13.6 Add context-aware toast notifications for activity events (Task, Karma, Reward)
- [x] 13.7 Write comprehensive unit tests for activities slice with 96%+ coverage
- [x] 13.8 Write Playwright E2E tests for activity timeline updates

## 14. Documentation & Monitoring
- [x] 14.1 Create README.md in `apps/api/src/modules/realtime/`
- [x] 14.2 Update API documentation with event contracts
- [x] 14.3 Create developer guide for adding new real-time events
- [x] 14.4 Add structured logging for all event emissions

## 15. Testing & Validation
- [x] 15.1 Run full test suite (unit + E2E) and verify all pass
- [x] 15.2 Manual testing: Create recurring tasks and verify notifications
- [x] 15.3 Manual testing: Grant karma and verify recipient sees update
- [x] 15.4 Manual testing: Claim reward and verify parent receives task notification
- [x] 15.5 Manual testing: Add family members and verify notifications
- [x] 15.6 Manual testing: Check activity timeline updates in real-time
- [x] 15.7 Test reconnection scenarios (disconnect/reconnect) with E2E
- [x] 15.8 Test multi-device scenarios (same user on multiple devices)
- [x] 15.9 Performance testing: Verify no memory leaks with long-running connections
