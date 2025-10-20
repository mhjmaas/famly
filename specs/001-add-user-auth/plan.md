# Implementation Plan: User Authentication Foundations

**Branch**: `001-add-user-auth` | **Date**: 2025-10-19 | **Spec**: /specs/001-add-user-auth/spec.md
**Input**: Feature specification from `/specs/001-add-user-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the initial email/password authentication slice for the Express TypeScript API by **fully leveraging the better-auth library** for all authentication logic, persisting user accounts in MongoDB (standalone or replica set), and exposing registration, login, and current-user endpoints aligned with the feature spec.

### Implementation Strategy – Better Auth Native with JWT Enhancement
- **100% Better Auth**: All authentication logic (registration, login, session management, password hashing) is handled by better-auth library - no custom implementation
- **Triple Authentication Modes**:
  - **Web (Cookie-based)**: HTTP-only cookies for browser clients with automatic CSRF protection - database lookup
  - **Mobile/API (JWT Token)**: Stateless JWT tokens via `Authorization: Bearer <accessToken>` header using better-auth's JWT plugin - JWKS verification (no DB lookup)
  - **Mobile/API (Session Token)**: Database-backed session tokens via `Authorization: Bearer <sessionToken>` for token refresh only
- **Dual-Token Strategy**: 
  - `accessToken` (JWT): Short-lived (15 min), stateless, verified via JWKS - used for all API requests
  - `sessionToken`: Long-lived (14 days), database-backed, rolling expiration - used only for refreshing access tokens via `/v1/auth/token`
- **Smart Token Detection**: Middleware automatically detects token type (JWT vs session) and routes to appropriate verification (JWKS vs database)
- **Session Management**: Better Auth manages all session storage, validation, and expiration in MongoDB
- **Token Prioritization**: When both cookie and bearer token are present, bearer token takes precedence; JWT tokens verified stateless for performance
- **Simplified Configuration**: Only requires `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` environment variables

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 20 runtime)  
**Primary Dependencies**: express@4.19, better-auth@1.x with bearer + JWT plugins, jose@6.x for JWT verification, mongodb@6.x driver, testcontainers for E2E tests  
**Storage**: MongoDB 7 (standalone) - Better Auth manages all collections and indexes  
**Testing**: Jest 29 + testcontainers for E2E tests with isolated MongoDB instances per test suite  
**Target Platform**: Dockerized Node.js service (linux/amd64)  
**Project Type**: Web backend service within monorepo  
**Performance Goals**: Auth endpoints respond <2s p95 (SC-003); registration success ≥90% first-attempt (SC-001)  
**Constraints**: Better Auth enforces password ≥8 chars; duplicate emails rejected with case-insensitive uniqueness  
**Scale/Scope**: MVP launch (~first 1k users) with design headroom for ~100 concurrent sessions and ~50 simultaneous registrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SOLID Architecture**: PASS – auth routes delegate to better-auth library; middleware handles authentication; clean separation of concerns.  
- **DRY**: PASS – better-auth library handles all authentication logic eliminating code duplication; routes are thin wrappers.  
- **TDD**: PASS – Jest + testcontainers E2E test suite validates all authentication flows with isolated MongoDB instances.  
- **User Experience Consistency**: PASS – unified API error formats/messages wrapped around better-auth responses.  
- **Maintainability First**: PASS – leveraging battle-tested better-auth library reduces maintenance burden and security risks.

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
apps/
├── api/
│   ├── src/
│   │   ├── app.ts
│   │   ├── config/
│   │   │   ├── env.ts           # Environment validation (no SESSION_SECRET)
│   │   │   └── settings.ts      # Settings wrapper
│   │   ├── infra/
│   │   │   └── mongo/
│   │   │       └── client.ts    # MongoDB connection (standalone)
│   │   ├── modules/
│   │   │   └── auth/
│   │   │       ├── better-auth.ts        # Better Auth configuration (bearer + JWT plugins)
│   │   │       ├── middleware/
│   │   │       │   ├── authenticate.ts   # Smart auth middleware (cookie + JWT + session)
│   │   │       │   └── jwt-verify.ts     # Stateless JWT verification via JWKS
│   │   │       └── routes/
│   │   │           ├── auth.router.ts    # Route consolidation + Better Auth handler mount
│   │   │           ├── register.route.ts # Uses auth.api.signUpEmail() + getToken()
│   │   │           ├── login.route.ts    # Uses auth.api.signInEmail() + getToken()
│   │   │           └── me.route.ts       # Protected route (supports all 3 auth types)
│   │   ├── routes/
│   │   │   └── health.ts
│   │   └── server.ts
│   ├── tests/
│   │   └── e2e/
│   │       ├── setup/
│   │       │   └── testcontainers-setup.ts  # Isolated MongoDB per suite
│   │       ├── auth/
│   │       │   ├── register.e2e.test.ts  # 12 tests (all 3 auth types)
│   │       │   ├── login.e2e.test.ts     # 13 tests (all 3 auth types)
│   │       │   └── me.e2e.test.ts        # 12 tests (cookie + JWT + session)
│   │       └── health.e2e.test.ts        # 4 tests
│   └── package.json
└── web/
    └── ... (no changes in this feature)
```

**Structure Decision**: Simplified architecture fully leveraging better-auth library with JWT enhancement for stateless authentication. No custom services, validators, repositories, or crypto implementations. All authentication logic delegated to better-auth, with custom JWT verification middleware using jose library for JWKS-based stateless token validation.

**Test Coverage**: 41 E2E tests across 4 test suites, all passing. Tests verify all three authentication methods (cookie, JWT, session token) and cover all functional requirements from the spec.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
