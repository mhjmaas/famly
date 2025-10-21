# Tasks: Remove Family Members

**Input**: Design documents from `/specs/004-remove-family-member/`
**Prerequisites**: plan.md (required), spec.md (user stories), research.md, data-model.md, contracts/

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm workspace baseline before implementing new removal flow.

- [ ] T001 Install workspace dependencies via pnpm to sync `package.json`
- [ ] T002 [P] Run existing family E2E baseline in `apps/api/tests/e2e/family` to ensure clean starting state

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create shared artifacts required by all user stories.

- [ ] T003 Add `FamilyMembershipRemoval` interface to `apps/api/src/modules/family/domain/family.ts`
- [ ] T004 [P] Implement `family-membership-removal.repository.ts` with insert helper and indexes under `apps/api/src/modules/family/repositories`
- [ ] T005 Update `apps/api/src/modules/family/index.ts` to export the removal repository for downstream wiring

## Phase 3: User Story 1 - Parent removes a member (Priority: P1) (MVP)

**Goal**: Parent can unlink a member; roster updates immediately.
**Independent Test**: `remove-member.e2e.test.ts` passes when run solo.

### Tests (write first)

- [ ] T006 [P] [US1] Create failing E2E happy-path test in `apps/api/tests/e2e/family/remove-member.e2e.test.ts`

### Implementation

- [ ] T007 [US1] Wire removal repository into `FamilyService` constructor within `apps/api/src/modules/family/services/family.service.ts`
- [ ] T008 [US1] Implement `removeFamilyMember` service method enforcing same-family membership and audit write in `apps/api/src/modules/family/services/family.service.ts`
- [ ] T009 [US1] Register `DELETE /v1/families/:familyId/members/:memberId` route with parent auth in `apps/api/src/modules/family/routes/families.route.ts`
- [ ] T010 [US1] Ensure roster response mapper excludes removed members by reusing `deleteMembership` flow in `apps/api/src/modules/family/services/family.service.ts`

## Phase 4: User Story 2 - Parent manages co-parent access (Priority: P2)

**Goal**: Prevent removing the final parent while allowing co-parent removal.
**Independent Test**: `remove-parent-guard.e2e.test.ts` fails then passes.

### Tests (write first)

- [ ] T011 [P] [US2] Add E2E guard scenarios for removing co-parent vs final parent in `apps/api/tests/e2e/family/remove-parent-guard.e2e.test.ts`

### Implementation

- [ ] T012 [US2] Extend `removeFamilyMember` to check remaining parent count using repository queries in `apps/api/src/modules/family/services/family.service.ts`
- [ ] T013 [US2] Return descriptive 409 error when last parent removal blocked in `apps/api/src/modules/family/services/family.service.ts`

## Phase 5: User Story 3 - Non-parent cannot remove members (Priority: P3)

**Goal**: Non-parent attempts to remove members are rejected.
**Independent Test**: `remove-non-parent.e2e.test.ts` demonstrates 403.

### Tests (write first)

- [ ] T014 [P] [US3] Write E2E test covering non-parent removal attempt in `apps/api/tests/e2e/family/remove-non-parent.e2e.test.ts`

### Implementation

- [ ] T015 [US3] Ensure delete route composes `authorizeFamilyRole` middleware in `apps/api/src/modules/family/routes/families.route.ts`
- [ ] T016 [US3] Add service-level guard to reject non-parent initiators as defense in depth in `apps/api/src/modules/family/services/family.service.ts`

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, logs, and verification across stories.

- [ ] T017 [P] Document removal flow and audit behavior in `specs/004-remove-family-member/quickstart.md`
- [ ] T018 Validate audit entries by adding logger coverage in `apps/api/src/modules/family/lib/family.mapper.ts`
- [ ] T019 Confirm new OpenAPI contract matches implementation in `specs/004-remove-family-member/contracts/family-member-removal.openapi.yaml`

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
