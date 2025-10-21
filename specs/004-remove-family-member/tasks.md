# Tasks: Remove Family Members

**Input**: Design documents from `/specs/004-remove-family-member/`
**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm workspace baseline before implementing new removal flow.

- [x] T001 Install workspace dependencies via pnpm to sync `package.json`
- [ ] T002 [P] Run existing family E2E baseline in `apps/api/tests/e2e/family` to ensure clean starting state (skipped due to container runtime limits)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Confirm existing persistence layer supports removals.

- [x] T003 Verify `FamilyMembershipRepository.deleteMembership` handles unlinking without additional schema changes in `apps/api/src/modules/family/repositories/family-membership.repository.ts`
- [x] T004 [P] Ensure `FamilyMembershipRepository.ensureIndexes` remains valid after simplification in `apps/api/src/modules/family/repositories/family-membership.repository.ts`
- [x] T005 No additional exports needed in `apps/api/src/modules/family/index.ts` after retaining a single repository

## Phase 3: User Story 1 - Parent removes a member (Priority: P1) (MVP)

**Goal**: Parent can unlink a member; roster updates immediately.
**Independent Test**: `remove-member.e2e.test.ts` passes when run solo.

### Tests (write first)

- [x] T006 [P] [US1] Create failing E2E happy-path test in `apps/api/tests/e2e/family/remove-member.e2e.test.ts`

### Implementation

- [x] T007 [US1] Prepare `FamilyService` to orchestrate removals using existing membership repository in `apps/api/src/modules/family/services/family.service.ts`
- [x] T008 [US1] Implement `removeFamilyMember` service method enforcing same-family membership and parent guard in `apps/api/src/modules/family/services/family.service.ts`
- [x] T009 [US1] Register `DELETE /v1/families/:familyId/members/:memberId` route with parent auth in `apps/api/src/modules/family/routes/families.route.ts`
- [x] T010 [US1] Ensure roster response mapper excludes removed members by reusing `deleteMembership` flow in `apps/api/src/modules/family/services/family.service.ts`

## Phase 4: User Story 2 - Parent manages co-parent access (Priority: P2)

**Goal**: Prevent removing the final parent while allowing co-parent removal.
**Independent Test**: `remove-parent-guard.e2e.test.ts` fails then passes.

### Tests (write first)

- [x] T011 [P] [US2] Add E2E guard scenarios for removing co-parent vs final parent in `apps/api/tests/e2e/family/remove-parent-guard.e2e.test.ts`

### Implementation

- [x] T012 [US2] Extend `removeFamilyMember` to check remaining parent count using repository queries in `apps/api/src/modules/family/services/family.service.ts`
- [x] T013 [US2] Return descriptive 409 error when last parent removal blocked in `apps/api/src/modules/family/services/family.service.ts`

## Phase 5: User Story 3 - Non-parent cannot remove members (Priority: P3)

**Goal**: Non-parent attempts to remove members are rejected.
**Independent Test**: `remove-non-parent.e2e.test.ts` demonstrates 403.

### Tests (write first)

- [x] T014 [P] [US3] Write E2E test covering non-parent removal attempt in `apps/api/tests/e2e/family/remove-non-parent.e2e.test.ts`

### Implementation

- [x] T015 [US3] Ensure delete route composes `authorizeFamilyRole` middleware in `apps/api/src/modules/family/routes/families.route.ts`
- [x] T016 [US3] Add service-level guard to reject non-parent initiators as defense in depth in `apps/api/src/modules/family/services/family.service.ts`

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, logs, and verification across stories.

- [x] T017 [P] Document removal flow in `specs/004-remove-family-member/quickstart.md`
- [x] T018 Review logging clarity for removal actions in `apps/api/src/modules/family/lib/family.mapper.ts`
- [x] T019 Confirm new OpenAPI contract matches implementation in `specs/004-remove-family-member/contracts/family-member-removal.openapi.yaml`

## Dependencies & Execution Order

1. Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6
2. User story phases follow priority order (US1 -> US2 -> US3) but may proceed in parallel after shared service method finalized.
3. Within each story, complete test task(s) before implementation tasks to honor TDD commitment.

## Parallel Opportunities

- Setup baseline check (T002) can run while dependencies install.
- Repository creation (T004) can proceed alongside domain update reviews after T003.
- E2E test authoring for US2 (T011) and US3 (T014) can begin once delete route skeleton exists.

## Implementation Strategy

1. Deliver MVP by completing Phases 1-3 and validating US1 end-to-end.
2. Layer guardrail logic (US2) to satisfy parent role safety without blocking MVP shipping.
3. Finalize authorization hardening (US3) and polish tasks prior to release.
