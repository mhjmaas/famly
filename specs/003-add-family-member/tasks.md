# Tasks: Add Family Members

**Input**: Design documents from `/specs/003-add-family-member/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: TDD required per constitution — write failing tests before implementation.
**Testing Strategy**: Unit tests cover ONLY pure functions (validators, utilities, mappers). Service methods, database operations, and API endpoints are tested via E2E black-box tests.

**Organization**: Tasks are grouped by user story so each slice delivers independent value.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm baseline health before modifying the API service.

- [X] T001 Run baseline API test suite in apps/api to confirm clean state

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introduce reusable authorization primitives required by all stories.

**⚠️ CRITICAL**: Complete these tasks before any user story work.

- [X] T002 [P] Add failing unit tests covering allowed/denied role checks in apps/api/tests/unit/auth/require-family-role.test.ts
- [X] T003 Implement reusable family role guard utility in apps/api/src/modules/auth/lib/require-family-role.ts to satisfy new tests
- [X] T004 Create Express middleware wrapper for the role guard in apps/api/src/modules/auth/middleware/authorize-family-role.ts
- [X] T005 Export the new authorization middleware utilities via apps/api/src/modules/auth/middleware/index.ts for downstream imports

**Checkpoint**: Guard utility and middleware validated; user stories can proceed.

---

## Phase 3: User Story 1 – Parent adds a child (Priority: P1) 🎯 MVP

**Goal**: Permit a parent to add a child account to their family without logging in the new user.

**Independent Test**: Parent hits `POST /v1/families/{familyId}/members` with role `Child` and receives a 201 response linking the child to the family while no new tokens are issued.

### Tests for User Story 1

- [X] T006 [P] [US1] Add validator unit tests for child member payload rules in apps/api/tests/unit/family/add-family-member.validator.test.ts (pure function)
- [X] T007 [P] [US1] ~~Add FamilyService unit tests~~ Covered by E2E test T008 per constitution (services are not pure functions)
- [X] T008 [P] [US1] Add e2e coverage for parent adding a child via POST /v1/families/{familyId}/members in apps/api/tests/e2e/family/add-child-member.e2e.test.ts

### Implementation for User Story 1

- [X] T009 [US1] Extend domain types with AddFamilyMemberRequest/Result in apps/api/src/modules/family/domain/family.ts
- [X] T010 [US1] Update family mapper to emit add-member response shape in apps/api/src/modules/family/lib/family.mapper.ts
- [X] T011 [US1] Persist addedBy metadata when inserting memberships in apps/api/src/modules/family/repositories/family-membership.repository.ts
- [X] T012 [US1] Implement add-family-member validator using zod in apps/api/src/modules/family/validators/add-family-member.validator.ts
- [X] T013 [US1] Implement child member creation flow (better-auth signup, membership insert, duplicate-in-family guard) in apps/api/src/modules/family/services/family.service.ts
- [X] T014 [US1] Add POST /v1/families/:familyId/members handler wiring service logic in apps/api/src/modules/family/routes/families.route.ts
- [X] T015 [US1] Export new validator and route symbols from apps/api/src/modules/family/index.ts and apps/api/src/modules/family/routes/index.ts

**Checkpoint**: Parents can add children end-to-end; route returns expected payload without issuing tokens.

---

## Phase 4: User Story 2 – Parent adds a co-parent (Priority: P2)

**Goal**: Allow a parent to onboard an additional parent while preventing reuse of emails linked to other families.

**Independent Test**: Parent adds a co-parent and receives 201; attempting to reuse an email tied to a different family returns HTTP 409 with guidance.

### Tests for User Story 2

- [X] T016 [P] [US2] Add e2e scenario for parent-role creation and cross-family conflict handling in apps/api/tests/e2e/family/add-parent-member.e2e.test.ts

### Implementation for User Story 2

- [X] T017 [US2] Enhance add-member service to look up existing users by email and block additions when email belongs to another family in apps/api/src/modules/family/services/family.service.ts
- [X] T018 [US2] Allow Parent role selection and tailored validation messaging in apps/api/src/modules/family/validators/add-family-member.validator.ts
- [X] T019 [US2] Ensure route response surfaces parent role result without emitting auth tokens in apps/api/src/modules/family/routes/families.route.ts

**Checkpoint**: Co-parent onboarding works and conflicting emails respond with 409.

---

## Phase 5: User Story 3 – Non-parent is prevented from adding members (Priority: P3)

**Goal**: Block member creation attempts from non-parent roles with clear authorization errors.

**Independent Test**: Non-parent calling POST `/v1/families/{familyId}/members` receives 403 and no side effects.

### Tests for User Story 3

- [X] T020 [P] [US3] Extend e2e coverage to assert 403 for non-parent requests in apps/api/tests/e2e/family/add-member-authorization.e2e.test.ts
- [X] T021 [P] [US3] Add negative guard case asserting forbidden roles in apps/api/tests/unit/auth/require-family-role.test.ts

### Implementation for User Story 3

- [X] T022 [US3] Apply authorization middleware to the add-member route in apps/api/src/modules/family/routes/families.route.ts
- [X] T023 [US3] Harden FamilyService to reject additions when caller lacks parent membership in apps/api/src/modules/family/services/family.service.ts

**Checkpoint**: Non-parent attempts are rejected consistently at middleware and service layers.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation, observability, and regression coverage.

- [X] T024 [P] Update quickstart instructions with parent/child onboarding steps in specs/003-add-family-member/quickstart.md
- [X] T025 Add structured logs for add-member success/failure paths in apps/api/src/modules/family/services/family.service.ts
- [X] T026 Run full lint and test suite for apps/api and record results in specs/003-add-family-member/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** → prerequisite for Foundational.
- **Foundational (Phase 2)** → blocks User Stories 1–3.
- **User Story 1 (Phase 3)** → foundational for later phases (establishes endpoint and core flow).
- **User Story 2 (Phase 4)** → depends on User Story 1 artifacts.
- **User Story 3 (Phase 5)** → depends on User Story 1 (route) and Phase 2 guard.
- **Polish (Phase 6)** → runs after desired user stories are complete.

### User Story Dependency Graph

- US1 (P1) → US2 (P2)
- US1 (P1) → US3 (P3)
- US2 and US3 are independent of each other once US1 is finished.

---

## Parallel Execution Opportunities

- T002 can run in parallel with baseline environment prep.
- Within US1, T006–T008 are parallelizable test tasks once foundational guard is in place.
- Implementation tasks touching different files (e.g., T010 mapper vs. T011 repository) can proceed concurrently after T009.
- US2 test tasks (T016, T017) run in parallel; they depend only on US1 completion.
- US3 tests (T021, T022) parallelize after guard utility exists.
- Polish tasks T025–T027 can be parallelized after all user stories complete.

---

## Implementation Strategy

### MVP First (Deliver User Story 1)

1. Complete Phases 1–2 to establish authorization guard.
2. Execute Phase 3 (US1) to ship child member onboarding.
3. Validate via new unit and e2e tests; deploy/demonstrate as MVP.

### Incremental Delivery

1. MVP (US1) delivers child onboarding.
2. US2 adds co-parent onboarding with cross-family safeguards.
3. US3 locks down authorization to parents only.

### Parallel Team Strategy

After Foundational tasks:
- Developer A owns US1 (tests + implementation).
- Developer B can prepare US2 tests (T016–T017) while A finishes core service.
- Developer C can enhance guard tests (T022) and wire middleware for US3 once route exists.

---

## Summary

- **Total tasks**: 27
- **Tasks per story**: US1 → 10 tasks (T006–T015), US2 → 5 tasks (T016–T020), US3 → 4 tasks (T021–T024)
- **Parallel opportunities**: Foundational guard tests, per-story test tasks, mapper vs. repository updates, US2/US3 test workstreams, polish documentation vs. logging.
- **Independent test criteria**: Defined per story under each phase heading.
- **Suggested MVP scope**: Complete through Phase 3 (User Story 1).
- **Format validation**: All tasks follow `- [ ] T### [P?] [Story?] Description with file path`.
