# Tasks: User Authentication Foundations

**Input**: Design documents from `/specs/001-add-user-auth/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

All tasks follow the `[ID] [P?] [Story] Description` convention with explicit file paths.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare environment scaffolding and local tooling required by all downstream work.

- [ ] T001 Create auth environment template in apps/api/.env.example with MONGODB_URI, SESSION_SECRET, and BETTER_AUTH secrets
- [ ] T002 Author Docker Compose stack for API and Mongo services in docker/compose.dev.yml
- [ ] T003 Add Node 20 API Dockerfile for local and CI builds in apps/api/docker/Dockerfile
- [ ] T004 Create Docker ignore rules to shrink build context in apps/api/docker/.dockerignore

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared libraries, configuration, and testing infrastructure required before any user story begins.

**⚠️ CRITICAL**: Complete this phase before starting user stories.

- [ ] T005 Upgrade apps/api/package.json with better-auth adapters, MongoDB driver, cookie-parser, zod, supertest, mongodb-memory-server, and matching @types
- [ ] T006 [P] Enable path aliases and stricter compiler options in apps/api/tsconfig.json
- [ ] T007 [P] Mirror test compiler settings and paths in apps/api/tsconfig.spec.json
- [ ] T008 [P] Introduce runtime environment schema using zod in apps/api/src/config/env.ts
- [ ] T009 [P] Export typed configuration wrapper in apps/api/src/config/settings.ts
- [ ] T010 [P] Implement shared MongoDB client lifecycle in apps/api/src/infra/mongo/client.ts
- [ ] T011 [P] Seed Mongo indexes for users and sessions in apps/api/src/infra/mongo/indexes.ts
- [ ] T012 [P] Configure better-auth core with Mongo repositories and bearer plugin in apps/api/src/modules/auth/better-auth.ts
- [ ] T013 [P] Add HttpError utility for consistent API failures in apps/api/src/lib/http-error.ts
- [ ] T014 [P] Add Express error handling middleware emitting JSON envelopes in apps/api/src/middleware/error-handler.ts
- [ ] T015 Wire JSON parsing, cookie handling, and base middleware in apps/api/src/app.ts
- [ ] T016 Register Jest global lifecycle hooks and module aliases in apps/api/jest.config.js
- [ ] T017 [P] Provision Jest global setup to bootstrap in-memory Mongo in apps/api/tests/setup/global-setup.ts
- [ ] T018 [P] Provide Jest global teardown to dispose test resources in apps/api/tests/setup/global-teardown.ts
- [ ] T019 [P] Create reusable test app factory and DB reset helpers in apps/api/tests/setup/test-app.ts

---

## Phase 3: User Story 1 - Create Account With Email (Priority: P1) 🎯 MVP

**Goal**: Allow visitors to register new accounts with a unique email and compliant password so they can start using the product.  
**Independent Test**: Submit a registration request with a fresh email and confirm the created user persists; repeat with a duplicate email and expect a 409 response.

### Tests for User Story 1 (write first, expect red) ⚠️

- [ ] T020 [P] [US1] Assert happy-path registration flow in apps/api/tests/integration/auth/register-success.test.ts
- [ ] T021 [P] [US1] Assert duplicate email rejection in apps/api/tests/integration/auth/register-conflict.test.ts
- [ ] T022 [P] [US1] Cover user repository create behaviour in apps/api/tests/unit/modules/auth/user.repository.test.ts

### Implementation for User Story 1

- [ ] T023 [P] [US1] Model user domain types and serialization in apps/api/src/modules/auth/domain/user.ts
- [ ] T024 [P] [US1] Implement password hashing helper using better-auth utilities in apps/api/src/modules/auth/crypto/password-hasher.ts
- [ ] T025 [P] [US1] Validate register payloads and password policy in apps/api/src/modules/auth/validators/register.validator.ts
- [ ] T026 [P] [US1] Implement user repository for create/findLowercasedEmail in apps/api/src/modules/auth/repositories/user.repository.ts
- [ ] T027 [US1] Implement register service orchestrating validation, hashing, and persistence in apps/api/src/modules/auth/services/register.service.ts
- [ ] T028 [US1] Add register controller and handler wiring better-auth session creation in apps/api/src/modules/auth/routes/register.route.ts
- [ ] T029 [US1] Compose auth router exporting register route in apps/api/src/modules/auth/routes/auth.router.ts
- [ ] T030 [US1] Mount /v1/auth router and trigger ensureAuthIndexes on boot in apps/api/src/app.ts

**Checkpoint**: Registration works end-to-end; tests for User Story 1 pass independently.

---

## Phase 4: User Story 2 - Sign In With Existing Credentials (Priority: P2)

**Goal**: Enable returning users to authenticate with existing credentials and receive active sessions/tokens.  
**Independent Test**: Use valid credentials to obtain session cookies and bearer tokens; invalid credentials must be rejected without side effects.

### Tests for User Story 2 (write first, expect red) ⚠️

- [ ] T031 [P] [US2] Assert successful login returns session and bearer token in apps/api/tests/integration/auth/login-success.test.ts
- [ ] T032 [P] [US2] Assert invalid password is rejected with 401 in apps/api/tests/integration/auth/login-invalid.test.ts
- [ ] T033 [P] [US2] Assert freshly registered user can log in immediately in apps/api/tests/integration/auth/login-after-register.test.ts

### Implementation for User Story 2

- [ ] T034 [P] [US2] Add session repository with lookup and revocation helpers in apps/api/src/modules/auth/repositories/session.repository.ts
- [ ] T035 [P] [US2] Validate login payloads and normalize email in apps/api/src/modules/auth/validators/login.validator.ts
- [ ] T036 [US2] Implement login service bridging better-auth sign-in and session persistence in apps/api/src/modules/auth/services/login.service.ts
- [ ] T037 [US2] Add login route wiring service responses and cookies in apps/api/src/modules/auth/routes/login.route.ts
- [ ] T038 [US2] Register login route within auth router in apps/api/src/modules/auth/routes/auth.router.ts
- [ ] T039 [US2] Extend better-auth config with bearer/token rotation policies in apps/api/src/modules/auth/better-auth.ts
- [ ] T040 [US2] Implement /auth/token exchange route for bearer refresh in apps/api/src/modules/auth/routes/token.route.ts
- [ ] T041 [US2] Register token route within auth router and document outputs in apps/api/src/modules/auth/routes/auth.router.ts

**Checkpoint**: Login flows succeed with valid credentials, reject invalid attempts, and token exchange complies with strategy.

---

## Phase 5: User Story 3 - View Current Account Details (Priority: P3)

**Goal**: Allow authenticated users to confirm their account context by fetching their current profile email.  
**Independent Test**: Authenticated request returns the user email; unauthenticated request receives a 401 with standard error body.

### Tests for User Story 3 (write first, expect red) ⚠️

- [ ] T042 [P] [US3] Assert /auth/me returns email for valid session in apps/api/tests/integration/auth/me-success.test.ts
- [ ] T043 [P] [US3] Assert /auth/me rejects missing or expired session in apps/api/tests/integration/auth/me-unauthorized.test.ts

### Implementation for User Story 3

- [ ] T044 [P] [US3] Implement requireAuth middleware checking session + token version in apps/api/src/modules/auth/middleware/require-auth.ts
- [ ] T045 [P] [US3] Implement current user service projecting profile DTO in apps/api/src/modules/auth/services/current-user.service.ts
- [ ] T046 [US3] Add /auth/me route guarded by requireAuth in apps/api/src/modules/auth/routes/me.route.ts
- [ ] T047 [US3] Register me route within auth router in apps/api/src/modules/auth/routes/auth.router.ts
- [ ] T048 [P] [US3] Add profile presenter formatting response envelope in apps/api/src/modules/auth/presenters/profile.presenter.ts

**Checkpoint**: Current-user endpoint reliably identifies authenticated sessions and blocks anonymous calls.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finalize documentation, shared error handling, and security hygiene across user stories.

- [ ] T049 Document auth setup and endpoint catalogue in apps/api/README.md
- [ ] T050 [P] Centralize reusable auth error messages in apps/api/src/modules/auth/errors.ts
- [ ] T051 Update developer quickstart with token exchange guidance in specs/001-add-user-auth/quickstart.md

---

## Dependencies & Execution Order

- **Phase Order**: Setup → Foundational → US1 → US2 → US3 → Polish
- **User Story Graph**: US1 (Register) ➝ US2 (Login) ➝ US3 (Current User)
- **Blocking Tasks**: T005–T019 gate all user story work; ensure they finish before T020.
- **Runtime Dependencies**: T029 must precede T030; T038/T041 depend on T029; T047 depends on T038 and T044.

---

## Parallel Execution Examples

**User Story 1**

```bash
Parallel tests: T020, T021, T022
Parallel implementations: T023, T024, T025, T026
```

**User Story 2**

```bash
Parallel tests: T031, T032, T033
Parallel implementations: T034, T035
```

**User Story 3**

```bash
Parallel tests: T042, T043
Parallel implementations: T044, T045, T048
```

---

## Implementation Strategy

1. **MVP First**: Deliver Phase 1 → Phase 2 → Phase 3 to ship registration MVP; validate with T020–T022 before moving on.
2. **Incremental Depth**: After MVP, complete Phase 4 to unlock authenticated sessions, then Phase 5 for profile retrieval.
3. **Iterative Hardening**: Finish with Phase 6 polish tasks, updating docs and shared error surfaces once core flows are stable.
4. **Testing Cadence**: Keep integration suites (apps/api/tests/integration/auth/*.test.ts) green before merging each story.
