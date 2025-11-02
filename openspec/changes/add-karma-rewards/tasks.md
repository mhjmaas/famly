# Implementation Tasks: Karma Rewards System

## Task Breakdown

### Phase 1: Karma Module Extension (Foundation)
**Goal**: Extend karma system to support deductions before rewards module depends on it

1. **Add reward_redemption karma source**
   - Update `KarmaSource` type in `karma/domain/karma.ts` to include `'reward_redemption'`
   - Update karma event validators to accept new source
   - Write unit tests for source validation
   - **Validation**: Unit tests pass for all three sources

2. **Implement karma deduction service method**
   - Add `deductKarma(input: DeductKarmaInput)` method to `karma.service.ts`
   - Validate sufficient balance before deduction
   - Create negative karma event with `source: 'reward_redemption'`
   - Atomically decrement `member_karma.totalKarma` using `$inc` with negative amount
   - Write unit tests for deduction logic, balance validation, atomicity
   - **Dependencies**: Task 1 (karma source)
   - **Validation**: Unit tests pass, including insufficient balance scenario

3. **Update karma history to handle negative amounts**
   - Ensure karma history endpoint correctly displays negative amounts
   - Update karma mapper to preserve negative amounts in DTOs
   - Write E2E test: create event with negative amount, verify in history
   - **Dependencies**: Task 2
   - **Validation**: E2E test passes showing negative event in history

4. **Add E2E tests for karma deduction**
   - Test: Deduct karma from member with sufficient balance
   - Test: Reject deduction causing negative balance
   - Test: Verify total consistency after multiple additions and deductions
   - **Dependencies**: Task 2, 3
   - **Validation**: All karma deduction E2E tests pass

### Phase 2: Tasks Module Integration (Task Metadata Extension)
**Goal**: Enable tasks to carry claim metadata for completion hooks

5. **Add claimId to task metadata schema**
   - Update `Task` interface in `tasks/domain/task.ts` to include `metadata.claimId?: string`
   - Update task validators to accept claimId in metadata
   - Update task mappers to include claimId in DTOs
   - Write unit tests for metadata validation
   - **Validation**: Unit tests pass, task creation/update with claimId succeeds

6. **Add task completion hook interface**
   - Create `tasks/hooks/` directory
   - Define `TaskCompletionHook` interface: `onTaskCompleted(task: Task, completedBy: ObjectId): Promise<void>`
   - Modify task service `updateTask` method to check for `metadata.claimId` on completion
   - If claimId present, emit event or call hook (design for future extensibility)
   - Write unit tests for hook invocation logic
   - **Dependencies**: Task 5
   - **Validation**: Unit tests confirm hook is called only when task transitions to completed with claimId

### Phase 3: Rewards Module Scaffolding (Domain & Infrastructure)
**Goal**: Create module structure with domain models and repositories

7. **Create rewards module structure**
   - Create directory: `modules/rewards/{domain,repositories,services,routes,validators,lib}`
   - Create `index.ts` for module exports
   - Add rewards router skeleton in `app.ts`
   - **Validation**: Module structure exists, app compiles

8. **Define reward domain models**
   - Create `rewards/domain/reward.ts` with `Reward`, `RewardClaim`, `RewardMetadata` interfaces
   - Include DTOs: `RewardDTO`, `ClaimDTO`, `RewardDetailsDTO`
   - Document all fields with JSDoc comments
   - **Dependencies**: Task 7
   - **Validation**: TypeScript types compile without errors

9. **Implement reward repository**
   - Create `rewards/repositories/reward.repository.ts`
   - Methods: `create`, `findById`, `findByFamily`, `update`, `delete`, `hasPendingClaims`
   - Set up MongoDB collection access: `db.collection<Reward>("rewards")`
   - Write unit tests (mocked DB) for CRUD operations
   - **Dependencies**: Task 8
   - **Validation**: Unit tests pass for all repository methods

10. **Implement claim repository**
    - Create `rewards/repositories/claim.repository.ts`
    - Methods: `create`, `findById`, `findByMember`, `findByFamily`, `updateStatus`, `findPendingByRewardAndMember`
    - Set up MongoDB collection: `db.collection<RewardClaim>("reward_claims")`
    - Write unit tests for claim lifecycle operations
    - **Dependencies**: Task 8
    - **Validation**: Unit tests pass for all claim repository methods

11. **Implement metadata repository**
    - Create `rewards/repositories/metadata.repository.ts`
    - Methods: `upsertFavourite`, `incrementClaimCount`, `findByRewardAndMember`, `findFavouritesByMember`
    - Set up MongoDB collection: `db.collection<RewardMetadata>("reward_metadata")`
    - Use composite key pattern: `_id: ${familyId}_${rewardId}_${memberId}`
    - Write unit tests for metadata operations
    - **Dependencies**: Task 8
    - **Validation**: Unit tests pass, idempotent upserts work correctly

### Phase 4: Rewards Business Logic (Services)
**Goal**: Implement core reward and claim workflows

12. **Implement reward service**
    - Create `rewards/services/reward.service.ts`
    - Methods: `createReward`, `listRewards`, `getReward`, `updateReward`, `deleteReward`
    - Integrate metadata repository to include claim counts and favourite status in responses
    - Write unit tests with mocked repositories
    - **Dependencies**: Tasks 9, 11
    - **Validation**: Unit tests pass, services correctly compose repository calls

13. **Implement claim service - part 1 (claim creation)**
    - Create `rewards/services/claim.service.ts`
    - Implement `createClaim` method:
      - Validate reward exists and member has sufficient karma
      - Check for duplicate pending claims
      - Create claim with `status: 'pending'`
      - Auto-create task via task service with `metadata.claimId`
      - Update claim with `autoTaskId`
    - Write unit tests with mocked karma, task, and reward services
    - **Dependencies**: Tasks 5 (task metadata), 10 (claim repo)
    - **Validation**: Unit tests pass, claim creation flow tested in isolation

14. **Implement claim service - part 2 (cancellation)**
    - Add `cancelClaim` method to claim service
    - Update claim status to `cancelled`
    - Delete auto-task via task service
    - Handle case where task already deleted (log warning, continue)
    - Write unit tests for cancellation scenarios
    - **Dependencies**: Task 13
    - **Validation**: Unit tests pass, including orphaned task scenario

15. **Implement claim service - part 3 (completion)**
    - Add `completeClaimFromTask` method to claim service
    - Validate member still has sufficient karma
    - Update claim status to `completed`
    - Call karma service `deductKarma` method
    - Increment metadata claim count (best-effort, log failures)
    - Write unit tests for completion flow
    - **Dependencies**: Tasks 2 (karma deduction), 11 (metadata), 13
    - **Validation**: Unit tests pass, including insufficient karma at completion

16. **Integrate claim completion with task completion hook**
    - In task service, add logic to call `claimService.completeClaimFromTask` when task with claimId completes
    - Handle errors gracefully (task completion succeeds even if claim processing fails)
    - Write unit tests for task→claim integration
    - **Dependencies**: Tasks 6 (task hook), 15 (claim completion)
    - **Validation**: Unit tests confirm claim completion triggered by task completion

### Phase 5: API Layer (Routes & Validators)
**Goal**: Expose rewards and claims via REST endpoints with validation

17. **Implement reward validators**
    - Create `rewards/validators/create-reward.validator.ts`
    - Create `rewards/validators/update-reward.validator.ts`
    - Validate: name (1-100 chars), karmaCost (1-1000, integer), description (max 500), imageUrl (valid URL, max 500)
    - Write unit tests for all validation rules
    - **Dependencies**: Task 8 (domain models)
    - **Validation**: Unit tests pass for valid/invalid inputs

18. **Implement claim validators**
    - Create `rewards/validators/claim-reward.validator.ts`
    - Validate rewardId format (ObjectId), familyId format
    - Write unit tests
    - **Dependencies**: Task 8
    - **Validation**: Unit tests pass

19. **Implement reward CRUD routes**
    - Create routes: `create-reward`, `list-rewards`, `get-reward`, `update-reward`, `delete-reward`
    - Apply authorization middleware: parent-only for CUD, any member for R
    - Apply family membership middleware
    - Connect to reward service
    - Write route handler unit tests (mocked service)
    - **Dependencies**: Tasks 12 (reward service), 17 (validators)
    - **Validation**: Route unit tests pass

20. **Implement claim routes**
    - Create routes: `claim-reward`, `list-claims`, `cancel-claim`
    - Apply authorization: any member can claim/list own, member+parent can cancel
    - Connect to claim service
    - Write route handler unit tests
    - **Dependencies**: Tasks 13, 14 (claim service), 18 (validators)
    - **Validation**: Route unit tests pass

21. **Implement favourite route**
    - Create route: `toggle-favourite`
    - POST `/v1/families/{familyId}/rewards/{rewardId}/favourite` with body `{ isFavourite: boolean }`
    - Connect to metadata repository via service
    - Write unit tests
    - **Dependencies**: Task 11 (metadata repository)
    - **Validation**: Unit tests pass

22. **Implement reward details route**
    - Create route: `get-reward-details`
    - GET `/v1/families/{familyId}/rewards/{rewardId}` returns reward + aggregated metadata (total claims, favourites)
    - Write unit tests
    - **Dependencies**: Tasks 12 (reward service), 11 (metadata)
    - **Validation**: Unit tests pass

23. **Wire up rewards router in app.ts**
    - Import rewards router
    - Mount at `/v1/families/:familyId/rewards`
    - Mount claims endpoints at `/v1/families/:familyId/claims`
    - **Dependencies**: Tasks 19-22 (all routes)
    - **Validation**: App compiles, routes registered

### Phase 6: Mappers & Utilities
**Goal**: Ensure proper domain↔DTO conversions

24. **Implement reward mappers**
    - Create `rewards/lib/reward.mapper.ts`
    - Methods: `toRewardDTO`, `toClaimDTO`, `toRewardDetailsDTO`
    - Handle ObjectId to string conversions, date to ISO string
    - Write unit tests
    - **Dependencies**: Task 8 (domain models)
    - **Validation**: Unit tests pass, all fields correctly mapped

25. **Update test helpers for rewards**
    - Add `createReward(overrides)` to test data factory
    - Add `createClaimWithTask(reward, member)` helper
    - Add `completeClaimWorkflow(claim)` helper
    - **Dependencies**: Phase 3 (domain models)
    - **Validation**: Test helpers compile and can be used in tests

### Phase 7: End-to-End Testing (Critical Workflows)
**Goal**: Validate full user flows across modules

26. **E2E: Reward CRUD operations**
    - Test: Create reward as parent
    - Test: List rewards as child
    - Test: Update reward as parent
    - Test: Delete reward (no pending claims)
    - Test: Prevent delete with pending claims
    - Test: Authorization (child cannot create/update/delete)
    - **Dependencies**: Phase 5 (routes)
    - **Validation**: All E2E tests pass

27. **E2E: Claim workflow (happy path)**
    - Test: Member with sufficient karma claims reward
    - Test: Verify pending claim created
    - Test: Verify auto-task created for parent
    - Test: Parent completes task
    - Test: Verify claim completed
    - Test: Verify karma deducted
    - Test: Verify claim count incremented
    - **Dependencies**: Phase 5 (routes), Task 16 (task→claim integration)
    - **Validation**: Full workflow E2E test passes

28. **E2E: Claim cancellation workflows**
    - Test: Member cancels own pending claim
    - Test: Parent cancels member's pending claim
    - Test: Verify auto-task deleted on cancellation
    - Test: Child cannot cancel another child's claim
    - **Dependencies**: Phase 5
    - **Validation**: All cancellation E2E tests pass

29. **E2E: Insufficient karma scenarios**
    - Test: Member with insufficient karma cannot claim
    - Test: Member claims, karma drops, parent completes task → error handled gracefully
    - **Dependencies**: Phase 5, Task 2 (karma deduction)
    - **Validation**: E2E tests pass, proper error responses

30. **E2E: Favourite functionality**
    - Test: Member toggles favourite on/off
    - Test: List favourites only
    - Test: Favourite status is member-specific
    - **Dependencies**: Phase 5, Task 21
    - **Validation**: E2E tests pass

31. **E2E: Authorization matrix**
    - Test: All endpoints with parent/child roles
    - Test: Non-family member access denied
    - Test: Unauthenticated requests rejected
    - **Dependencies**: Phase 5
    - **Validation**: Authorization matrix E2E tests pass

32. **E2E: Edge cases and error handling**
    - Test: Reward not found
    - Test: Claim not found
    - Test: Duplicate pending claim prevention
    - Test: Manual task deletion (claim remains pending)
    - Test: Metadata update failure (claim still completes)
    - **Dependencies**: Phase 5, Phase 7 tasks 26-31
    - **Validation**: All edge case E2E tests pass

### Phase 8: Documentation & Cleanup
**Goal**: Finalize documentation and prepare for deployment

33. **Create rewards module README**
    - Document module purpose, architecture, collections
    - Include workflow diagrams (claim lifecycle state machine)
    - Document integration points with karma and tasks modules
    - **Validation**: README is clear and complete

34. **Update API documentation**
    - Add rewards endpoints to Bruno collection or OpenAPI spec
    - Include example requests/responses
    - Document error codes
    - **Validation**: API docs reflect all reward/claim endpoints

35. **Run full test suite and linting**
    - Execute `pnpm test` (unit + E2E)
    - Execute `pnpm run lint`
    - Fix any issues
    - **Dependencies**: All previous tasks
    - **Validation**: All tests pass, no lint errors

36. **Update project tree in CLAUDE.md**
    - Run `pnpm run update:claude:tree`
    - Verify rewards module appears in tree
    - **Dependencies**: All implementation complete
    - **Validation**: Tree updated, CLAUDE.md reflects new structure

## Task Dependencies Summary

```
Phase 1 (Karma): 1 → 2 → 3 → 4
Phase 2 (Tasks): 5 → 6
Phase 3 (Scaffolding): 7 → 8 → [9, 10, 11]
Phase 4 (Services): [9, 11] → 12
                     [5, 10] → 13 → 14
                     [2, 11, 13] → 15
                     [6, 15] → 16
Phase 5 (Routes): [12, 17] → 19
                  [13, 14, 18] → 20
                  11 → 21
                  [12, 11] → 22
                  [19, 20, 21, 22] → 23
Phase 6 (Mappers): 8 → 24
                   Phase 3 → 25
Phase 7 (E2E): Phase 5 → 26
               [Phase 5, 16] → 27
               Phase 5 → [28, 29, 30, 31]
               [Phase 5, 26-31] → 32
Phase 8 (Docs): All → [33, 34, 35, 36]
```

## Parallelization Opportunities

- **Phase 1**: Tasks 1, 2, 3 must be sequential; Task 4 can run after 2-3
- **Phase 3**: Tasks 9, 10, 11 can run in parallel after Task 8
- **Phase 4**: Task 12 independent of Tasks 13-16 chain (can parallelize)
- **Phase 5**: Tasks 19-22 can run in parallel once dependencies met
- **Phase 7**: Tasks 26-31 can run in parallel; Task 32 must run last

## Validation Gates

- **After Phase 1**: All karma deduction tests pass
- **After Phase 4**: All service unit tests pass
- **After Phase 5**: All route unit tests pass
- **After Phase 7**: Full E2E suite passes
- **Before Deployment**: Phase 8 complete, all tests green

## Estimated Effort

- **Phase 1**: 2-3 hours (karma extension)
- **Phase 2**: 1-2 hours (task metadata)
- **Phase 3**: 2-3 hours (scaffolding + repositories)
- **Phase 4**: 4-5 hours (services + integration)
- **Phase 5**: 4-5 hours (routes + validators)
- **Phase 6**: 1-2 hours (mappers + test helpers)
- **Phase 7**: 5-6 hours (comprehensive E2E testing)
- **Phase 8**: 1-2 hours (documentation)

**Total**: ~20-28 hours of focused development
