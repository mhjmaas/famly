# Implementation Tasks: Granularize Activity Events

## Phase 1: Backend - Domain Model & Service Updates

### Task 1: Update ActivityEvent Domain Model
**Description**: Add `eventDetail` field to the ActivityEvent domain model

**Work**:
- [x] Update `/apps/api/src/modules/activity-events/domain/activity-event.ts`
  - Add optional `detail?: string` field to ActivityEvent interface
  - Add optional `detail?: string` field to ActivityEventDTO interface
- [x] Verify TypeScript compilation passes
- [x] No database migration needed (schema is flexible in MongoDB)

**Validation**:
- [x] Models compile without errors
- [x] Existing code paths still work (optional field)

---

### Task 2: Update ActivityEventService.recordEvent
**Description**: Modify the activity event recording method to accept and persist `detail` parameter

**Work**:
- [x] Update `/apps/api/src/modules/activity-events/services/activity-event.service.ts`
  - Modify `recordEvent()` method signature to accept optional `detail` parameter
  - Update implementation to include detail in the persisted event
  - Update docstring/comments
- [x] Verify existing calls still work (detail is optional)

**Validation**:
- [x] Method accepts detail parameter
- [x] Detail is persisted in database
- [x] Existing calls without detail still work

---

### Task 3: Update Task Module Event Recording
**Description**: Modify task creation, schedule creation, and completion event recording to include appropriate detail values

**Work**:
- [x] Update `/apps/api/src/modules/tasks/hooks/activity-event.hook.ts` or task service
  - When recording task creation event: add `detail: "CREATED"`
  - When recording task completion event: add `detail: "COMPLETED"`
  - When recording schedule creation event: add `detail: "CREATED"` (or "CREATED" for schedules)
  - When recording auto-generated task event: add `detail: "GENERATED"`
- [x] Ensure correct userId is passed (creator for CREATED, credited member for COMPLETED)
- [x] Ensure metadata.karma is set correctly for each scenario

**Validation**:
- [x] All task event recording calls updated
- [x] Unit tests pass for task service

---

### Task 4: Update Shopping List Event Recording
**Description**: Add detail value to shopping list activity events

**Work**:
- [x] Update `/apps/api/src/modules/shopping-lists/services/shopping-list.service.ts`
  - When recording shopping list creation: add `detail: "CREATED"`
  - Verify userId is the creator

**Validation**:
- [x] Event recording calls include detail
- [x] Tests pass

---

### Task 5: Update Recipe Event Recording
**Description**: Add detail value to recipe activity events

**Work**:
- [x] Update `/apps/api/src/modules/recipes/services/recipe.service.ts`
  - When recording recipe creation: add `detail: "CREATED"`
  - Verify userId is the creator

**Validation**:
- [x] Event recording calls include detail
- [x] Tests pass

---

### Task 6: Update Diary Event Recording
**Description**: Add detail values to diary activity events

**Work**:
- [x] Update `/apps/api/src/modules/diary/services/diary.service.ts`
  - When recording personal diary creation: add `detail: "CREATED"` with type: "DIARY"
  - When recording family diary creation: add `detail: "CREATED"` with type: "FAMILY_DIARY"
  - Verify userId is the entry author

**Validation**:
- [x] Event recording calls include detail
- [x] Tests pass

---

### Task 7: Update Reward Event Recording
**Description**: Add detail values to reward activity events

**Work**:
- [x] Update `/apps/api/src/modules/rewards/services/claim.service.ts`
  - When creating reward claim: add `detail: "CLAIMED"`
  - When completing reward claim: add `detail: "COMPLETED"`
  - When cancelling reward claim: add `detail: "CANCELLED"` (optional)
  - Ensure karma metadata reflects deduction for CLAIMED, no karma for COMPLETED
  - Verify userId is correct for each scenario

**Validation**:
- [x] Event recording calls include detail
- [x] Tests pass

---

### Task 8: Update Karma Event Recording
**Description**: Add detail value to karma activity events

**Work**:
- [x] Update `/apps/api/src/modules/karma/services/karma.service.ts`
  - When recording manual karma grant: add `detail: "AWARDED"`
  - Verify only manual_grant source records activity events (existing behavior)
  - Ensure metadata.karma is positive value

**Validation**:
- [x] Event recording calls include detail
- [x] Tests pass

---

### Task 9: Backend Unit Tests
**Description**: Write/update unit tests for all module changes

**Work**:
- [x] Add tests for ActivityEventService.recordEvent with detail parameter
- [x] Add tests for each module's event recording with correct detail values
- [x] Test that events without detail still work (backward compatibility)
- [x] Test that detail is persisted and retrieved correctly
- [x] Run all tests: `pnpm test:unit`

**Validation**:
- [x] All tests pass
- [x] 100% coverage of modified event recording functions
- [x] Backward compatibility tests pass

---

## Phase 2: Web App - Display Logic Updates

### Task 10: Create Activity Event Helper Function
**Description**: Add helper function to determine which karma indicators should display

**Work**:
- [x] Create or update `/apps/web/src/lib/utils/activity-utils.ts`
  - Add function `shouldShowKarma(event: ActivityEventDTO): boolean`
  - Logic: Show karma if type+detail combination is earning-related
    - Show for: TASK+COMPLETED, REWARD+CLAIMED, KARMA+AWARDED
    - Hide for: All +CREATED events, TASK+GENERATED, REWARD+COMPLETED
    - For backward compatibility: Show if no detail field exists (legacy events)
  - Export function for use in components

**Validation**:
- [x] Function correctly identifies which events should show karma
- [x] Unit tests cover all type+detail combinations

---

### Task 11: Update Activity Timeline Component
**Description**: Modify activity timeline to use type+detail for conditional rendering

**Work**:
- [x] Update `/apps/web/src/components/profile/activity-timeline.tsx`
  - Import `shouldShowKarma` helper
  - In the event rendering section, wrap karma indicators with `{shouldShowKarma(event) && ...}`
  - Ensure karma badges, trending icons, and sparkle icons only render for earning events
  - Test that event display is correct for all event types

**Validation**:
- [x] Karma indicators hidden for TASK+CREATED events
- [x] Karma indicators shown for TASK+COMPLETED with positive karma
- [x] Karma indicators shown for REWARD+CLAIMED with negative karma
- [x] No rendering errors
- [x] Timeline still displays for events without detail field

---

### Task 12: Update Web App Type Definitions
**Description**: Ensure ActivityEventDTO includes detail field in type definitions

**Work**:
- [x] Verify `/apps/web/src/types/api.types.ts` includes optional `detail` field in ActivityEventDTO
  - Add `detail?: string` to the DTO type
  - No other changes needed if already there

**Validation**:
- [x] TypeScript compilation succeeds
- [x] No type errors in activity-related components

---

### Task 13: Web App Unit Tests
**Description**: Write tests for web app display logic

**Work**:
- [x] Add tests for `shouldShowKarma()` function
  - Test TASK+CREATED → false
  - Test TASK+COMPLETED → true
  - Test SHOPPING_LIST+CREATED → false
  - Test REWARD+CLAIMED → true
  - Test KARMA+AWARDED → true
  - Test with undefined detail (legacy) → true
- [x] Add snapshot or DOM tests for activity timeline with various event types
- [x] Run tests: `pnpm test:unit`

**Validation**:
- [x] All tests pass
- [x] shouldShowKarma has 100% coverage

---

## Phase 3: Extend Existing Tests with Detail Field Assertions

> **Note**: Comprehensive e2e tests already exist for activity events. Phase 3 focuses on extending these with assertions for the new `detail` field rather than creating new tests from scratch.

### Existing Test Files to Extend:
1. `/apps/api/tests/e2e/activity-events/task-integration.e2e.test.ts` (342 lines)
2. `/apps/api/tests/e2e/activity-events/family-member-activity.e2e.test.ts` (314 lines)
3. `/apps/api/tests/e2e/activity-events/list-events.e2e.test.ts` (96 lines)
4. `/apps/api/tests/unit/activity-events/activity-event.mapper.test.ts` (152 lines)
5. `/apps/web/tests/unit/store/slices/activities.slice.test.ts` (290 lines)

---

### Task 14: Extend Task Integration Tests with Detail Assertions
**Description**: Add detail field assertions to existing task activity event tests

**Work**:
- [x] Update `/apps/api/tests/e2e/activity-events/task-integration.e2e.test.ts`
  - Find test: "Task creation creates activity event for non-recurring tasks" (line 19)
    - Add assertion: `expect(event.detail).toBe("CREATED")`
  - Find test: "Activity event creation when task is completed" (line 89)
    - Add assertion: `expect(event.detail).toBe("COMPLETED")`
  - Find test: "Member-assigned task completion records event in assignee's timeline" (line 175)
    - Add assertion: `expect(event.detail).toBe("COMPLETED")`
  - Add new test scenario: "Auto-generated task records GENERATED detail"
    - Verify schedule-generated task has `detail: "GENERATED"`
- [x] Run test: `pnpm test:e2e`

**Validation**:
- [x] All task-related assertions pass
- [x] Detail field is correctly populated for all task scenarios

---

### Task 15: Extend Activity Event Mapper Tests
**Description**: Add detail field to DTO mapping tests

**Work**:
- [x] Update `/apps/api/tests/unit/activity-events/activity-event.mapper.test.ts`
  - Add test: "Maps detail field from domain to DTO"
    - Verify ActivityEvent with detail maps to ActivityEventDTO with same detail
  - Add test: "Handles missing detail field (backward compatibility)"
    - Verify events without detail still map correctly
  - Add test: "Maps all event types with appropriate detail values"
    - Test TASK+CREATED, TASK+COMPLETED, REWARD+CLAIMED, etc.
- [x] Run test: `pnpm test:unit`

**Validation**:
- [x] All mapping tests pass
- [x] Detail field correctly transferred to DTO
- [x] Backward compatibility verified

---

### Task 16: Extend Family Member Activity Tests
**Description**: Add detail field assertions to family member activity tests

**Work**:
- [x] Update `/apps/api/tests/e2e/activity-events/family-member-activity.e2e.test.ts`
  - Add assertions to existing tests to verify detail field is present
  - Add test: "Family member activity includes detail for different event types"
    - Retrieve activities for multiple event types
    - Verify each has appropriate detail value
- [x] Run test: `pnpm test:e2e`

**Validation**:
- [x] Tests pass
- [x] Detail field present in cross-family member queries

---

### Task 17: Update Web App Redux Store Tests
**Description**: Add detail field handling to web app state management tests

**Work**:
- [x] Update `/apps/web/tests/unit/store/slices/activities.slice.test.ts`
  - Add test: "Preserves detail field in activities state"
    - Store activity with detail field
    - Verify retrieval maintains detail value
  - Add test: "Handles missing detail field gracefully"
    - Store activity without detail field
    - Verify no errors and state remains valid
  - Add test: "Selectors work with detail-filtered activities"
    - Filter activities by detail value in selector tests
- [x] Run test: `pnpm test:unit`

**Validation**:
- [x] Redux state management tests pass
- [x] Detail field preserved through state updates
- [x] Backward compatibility verified

---

## Phase 4: Validation & Cleanup

### Task 18: Full Test Suite
**Description**: Ensure all tests pass and no regressions introduced

**Work**:
- [x] Run full test suite: `pnpm test`
- [x] Run linting: `pnpm run lint`
- [x] Verify no TypeScript errors: `pnpm run build`

**Validation**:
- [x] All tests pass (including extended activity event tests)
  - **Result**: 1,273 tests passed (935 API + 338 Web)
- [x] No lint errors
  - **Result**: 646 files checked, 0 issues
- [x] Project builds successfully

---

### Task 19: Validate OpenSpec Proposal
**Description**: Validate proposal structure and requirements

**Work**:
- [x] Run: `openspec validate granularize-activity-events --strict`
- [x] Fix any validation errors
- [x] Verify all scenarios have clear acceptance criteria

**Validation**:
- [x] OpenSpec validation passes
  - **Result**: Change 'granularize-activity-events' is valid
- [x] Proposal is well-formed and complete

---

### Task 20: Documentation & Review
**Description**: Review proposal with team and prepare for merging

**Work**:
- [x] Review proposal.md, design.md, and spec.md for clarity
- [x] Ensure all architectural decisions are documented
- [x] Create comprehensive implementation summary
- [x] Include reference to problem statement and user impact
- [x] Document all changes made

**Validation**:
- [x] All documentation complete and reviewed
- [x] Implementation ready for deployment

---

## Summary

- **Phase 1**: 9 tasks (Backend model & service updates)
- **Phase 2**: 4 tasks (Web app display logic)
- **Phase 3**: 4 tasks (Extend existing tests with detail assertions) ← *Lighter than creating new tests*
- **Phase 4**: 3 tasks (Validation & cleanup)

**Total**: 20 implementation tasks

**Estimated Effort**: Well-scoped, parallelizable tasks. Phase 1 backend tasks can be done in parallel, Phase 2 and 3 depend on Phase 1 completion.

**Key Dependencies**:
1. Tasks 1-2 must complete before Tasks 3-8
2. Tasks 3-8 should complete before Phase 2
3. Phase 2 can start once Phase 1 is complete
4. Phase 3 (extend existing tests) depends on both Phase 1 and Phase 2
5. Phase 4 (validation) depends on all previous phases
