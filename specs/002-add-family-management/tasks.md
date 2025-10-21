---
description: "Task list for 002-add-family-management feature implementation"
---

# Tasks: Family Management

**Input**: Design documents from `/specs/002-add-family-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per workflow expectations (TDD). Ensure each test is written before corresponding implementation and fails initially.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare project structure for the new family module and its tests.

- [X] T001 Scaffold family module directories (`apps/api/src/modules/family/{domain,repositories,services,routes,validators,lib}`) and add placeholder index exports in `apps/api/src/modules/family/index.ts` to match existing module conventions.
- [X] T002 Create dedicated family test folders (`apps/api/tests/unit/family`, `apps/api/tests/e2e/family`) with README placeholders describing intended coverage focus.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Define shared domain contracts used by all user stories.

- [X] T003 Author TypeScript domain types for families and memberships in `apps/api/src/modules/family/domain/family.ts`, including `Family`, `FamilyMembership`, and `FamilyRole` enum aligned with data-model.md.
- [X] T004 Introduce a reusable DTO mapper in `apps/api/src/modules/family/lib/family.mapper.ts` that converts Mongo documents into the canonical `FamilyMembershipView` shape consumed by routes, JWT claims, and `/v1/auth/me`.

**Checkpoint**: Domain scaffolding ready—user story phases can start.

---

## Phase 3: User Story 1 – Create a new family (Priority: P1) 🎯 MVP

**Goal**: Allow an authenticated user to create a family (optional name) and link themselves as Parent.

**Independent Test**: POST `/v1/families` with and without a name returns 201, persists records, and assigns the creator the Parent role exactly once.

### Tests for User Story 1

- [X] T005 [P] [US1] Add failing unit tests for `FamilyService.createFamily` in `apps/api/tests/unit/family/family.service.create.test.ts` covering optional name normalization and Parent membership creation.
- [X] T006 [P] [US1] Add failing e2e test for `POST /v1/families` in `apps/api/tests/e2e/family/create-family.e2e.test.ts` validating 201 response, response payload shape, and persistence side effects.
- [X] T007 [P] [US1] Extend `apps/api/tests/unit/family/family.service.create.test.ts` with a failing case asserting persisted family and membership records set `createdAt` and `updatedAt` timestamps.

### Implementation for User Story 1

- [X] T008 [US1] Implement `FamilyMembershipRepository` with `insertMembership`, `findByFamilyAndUser`, and index helpers in `apps/api/src/modules/family/repositories/family-membership.repository.ts` using Mongo unique index enforcement.
- [X] T009 [US1] Implement `FamilyRepository` with `createFamily` persistence and projection helpers in `apps/api/src/modules/family/repositories/family.repository.ts`.
- [X] T010 [US1] Implement `FamilyService.createFamily` in `apps/api/src/modules/family/services/family.service.ts` orchestrating validation, duplicate checks, repository writes, and DTO mapping.
- [X] T011 [US1] Create Zod validator for create-family payload (trims name, enforces length, rejects empty string) in `apps/api/src/modules/family/validators/create-family.validator.ts`.
- [X] T012 [US1] Build `createFamiliesRouter` with POST handler in `apps/api/src/modules/family/routes/families.route.ts`, invoking service and returning 201 JSON per OpenAPI contract.
- [X] T013 [US1] Wire the new router into the app by exporting it via `apps/api/src/modules/family/routes/index.ts`, registering it under `/v1/families` in `apps/api/src/app.ts`, and invoking repository index initialization during startup.

**Checkpoint**: `POST /v1/families` is producible and fully tested.

**Parallel execution example**:
```bash
# In parallel after foundational phase:
Task T005 (unit test) & Task T006 (e2e test) & Task T007 (timestamp unit test)
Task T008 (membership repository) & Task T009 (family repository)
```

---

## Phase 4: User Story 2 – View owned families (Priority: P2)

**Goal**: Let users retrieve their families and expose the same list/roles via JWT and `/v1/auth/me`.

**Independent Test**: After creating a family, GET `/v1/families` returns the list; `/v1/auth/me` includes matching `families` array; decoded JWT contains the identical family data.

### Tests for User Story 2

- [X] T014 [P] [US2] Add failing unit tests for `FamilyService.listFamiliesForUser` in `apps/api/tests/unit/family/family.service.list.test.ts` covering multiple memberships ordering and null name handling.
- [X] T015 [P] [US2] Add failing e2e test for `GET /v1/families` in `apps/api/tests/e2e/family/list-families.e2e.test.ts` validating 200 response and payload consistency.
- [ ] T016 [P] [US2] Extend auth E2E specs (`apps/api/tests/e2e/auth/me.e2e.test.ts` and `apps/api/tests/e2e/auth/login.e2e.test.ts`) to assert `/v1/auth/me` and JWT claims include the family membership view.

### Implementation for User Story 2

- [X] T017 [US2] Implement `FamilyService.listFamiliesForUser` and supporting repository query in `apps/api/src/modules/family/services/family.service.ts` and `apps/api/src/modules/family/repositories/family-membership.repository.ts` using indexed lookup.
- [X] T018 [US2] Add `GET /v1/families` handler to `apps/api/src/modules/family/routes/families.route.ts` reusing DTO mapper and enforcing authentication.
- [X] T019 [US2] Update `/v1/auth/me` handler in `apps/api/src/modules/auth/routes/me.route.ts` to include a `families` array derived from `req.user`.
- [X] T020 [US2] Enhance `authenticate` middleware in `apps/api/src/modules/auth/middleware/authenticate.ts` to hydrate `req.user.families` by invoking `FamilyService.listFamiliesForUser` for both JWT and session flows.
- [X] T021 [US2] Extend Better Auth initialization in `apps/api/src/modules/auth/better-auth.ts` to enrich JWT claims with current family memberships using the FamilyService and ensure refreshed tokens stay consistent.
- [X] T022 [US2] Mirror family data in login responses by updating `apps/api/src/modules/auth/routes/login.route.ts` (and any token issue helpers) so API clients receive the `families` array alongside tokens.

**Checkpoint**: `/v1/families`, `/v1/auth/me`, and JWT payloads expose synchronized family membership data.

**Parallel execution example**:
```bash
# Possible parallel workstreams
Task T014 (service unit test) & Task T015 (GET e2e test)
Task T020 (authenticate middleware) & Task T021 (better-auth enrichment) once service list method exists
```

---

## Phase 5: User Story 3 – Prevent invalid role assignments (Priority: P3)

**Goal**: Reject any attempt to assign roles outside Parent/Child across validators and service logic.

**Independent Test**: Payloads or internal calls providing unsupported roles fail with 400/validation errors while valid paths remain unaffected.

### Tests for User Story 3

- [ ] T023 [P] [US3] Add validator unit tests in `apps/api/tests/unit/family/create-family.validator.test.ts` ensuring inputs with unexpected `role` fields or non-string values fail.
- [ ] T024 [P] [US3] Add negative e2e case in `apps/api/tests/e2e/family/create-family.e2e.test.ts` asserting POST requests injecting `role` or invalid enums receive 400 with descriptive error.

### Implementation for User Story 3

- [ ] T025 [US3] Strengthen Zod schemas and shared role guard in `apps/api/src/modules/family/validators/create-family.validator.ts` and `apps/api/src/modules/family/lib/family.mapper.ts` to reject unsupported roles using centralized `FamilyRole` enum.
- [ ] T026 [US3] Apply the role guard within `FamilyService` and repositories (`apps/api/src/modules/family/services/family.service.ts`, `apps/api/src/modules/family/repositories/family-membership.repository.ts`) returning `HttpError.badRequest` for invalid role attempts.

**Checkpoint**: Role validation is centralized; invalid role attempts fail consistently at validation and service layers.

**Parallel execution example**:
```bash
# After US2 service updates
Task T023 (validator tests) & Task T024 (negative e2e) can run together
Task T025 (schema updates) & Task T026 (service enforcement) in parallel once tests exist
```

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation, contracts, and quality gates across stories.

- [ ] T027 [P] Refresh `specs/002-add-family-management/quickstart.md` to document JWT `families` claim verification steps and updated cURL examples.
- [ ] T028 Review `specs/002-add-family-management/contracts/family.openapi.yaml` against implemented responses and adjust examples/error schemas if discrepancies arise.
- [ ] T029 Run `npm test`, `npm run lint`, and document results in `specs/002-add-family-management/quickstart.md` or PR checklist.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)** → Enables Foundational work.
- **Foundational (Phase 2)** → Must finish before any user story (Phases 3–5).
- **User Stories** → Execute in priority order (US1 → US2 → US3) for MVP sequencing; parallelization allowed once shared dependencies are satisfied.
- **Polish (Phase 6)** → Runs after desired user stories are complete.

### User Story Dependencies
- **US1**: Depends on Phases 1–2 only.
- **US2**: Depends on US1 completion (service/repository foundations) to reuse DTOs and creation flow.
- **US3**: Depends on US1/US2 implementations to enforce role guard across all touchpoints.

### Task Dependencies Within Stories
- Tests precede implementation (e.g., T005/T006/T007 before T008–T013).
- Repository implementations (T008, T009) precede service (T010) and route (T012).
- Middleware/JWT updates (T020, T021) require listing service (T017) to exist.
- Role guard changes (T025, T026) rely on enum definitions (T003) and service code from earlier stories.

---

## Implementation Strategy

### MVP First
1. Complete Phases 1–2.
2. Deliver Phase 3 (US1) with full test coverage → MVP ready (create family core flow).
3. Validate with manual smoke tests per quickstart.

### Incremental Enhancements
- Add Phase 4 (US2) to surface membership data through GET/JWT/me without regressing MVP.
- Add Phase 5 (US3) to harden validation, still independently testable.

### Parallel Opportunities
- Different developers can tackle separate user stories after foundational work.
- Within each story, parallelizable tasks are marked `[P]` once prerequisites are satisfied.

---

## Summary Metrics
- **Total Tasks**: 29
- **User Story Task Counts**:
  - US1 (Phase 3): 9 tasks
  - US2 (Phase 4): 9 tasks
  - US3 (Phase 5): 4 tasks
- **Parallel Opportunities**: Explicit `[P]` tasks (8 total) enable concurrent progress post-dependencies.
- **Independent Test Criteria**:
  - US1: POST `/v1/families` success path
  - US2: GET `/v1/families`, `/v1/auth/me`, JWT parity
  - US3: Validation rejects unsupported roles
- **Suggested MVP Scope**: Complete through Phase 3 (US1) for initial release; subsequent stories layer in read capabilities and validation hardening.

**Format Check**: All tasks follow `- [ ] T### [P?] [Story?] Description` with explicit file paths.
