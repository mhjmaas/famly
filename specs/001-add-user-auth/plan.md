# Implementation Plan: User Authentication Foundations

**Branch**: `001-add-user-auth` | **Date**: 2025-10-19 | **Spec**: /specs/001-add-user-auth/spec.md
**Input**: Feature specification from `/specs/001-add-user-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement the initial email/password authentication slice for the Express TypeScript API by integrating the better-auth library, persisting user accounts in a Docker-managed MongoDB instance, and exposing registration, login, and current-user endpoints aligned with the feature spec.

### Strategy Update – Session + Bearer Tokens
- Keep the existing better-auth, database-backed httpOnly session for the web UI to preserve automatic CSRF mitigation and silent refresh.
- Enable the better-auth `bearer()` plugin so mobile and other non-cookie clients receive a short-lived JWT (`Authorization: Bearer`) on sign-in and refresh.
- Encode the `sessionId` and a rotation `tokenVersion` claim inside every issued access token; validate both the signature (Better Auth) and the session row on each request.
- Anchor refresh tokens to the same session record (persist hashed value) so revoking or deleting the session invalidates cookie, access token, and refresh token paths simultaneously.
- Surface a `/auth/token` endpoint for clients to exchange credentials for access/refresh tokens, and document that mobile clients must poll refresh prior to expiry.
- Add test coverage to ensure a revoked session row (deleted or flagged) causes bearer access token checks to fail even if the JWT is otherwise valid.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 20 runtime)  
**Primary Dependencies**: express@4.19, better-auth core + Express middleware, mongodb@6.x Node.js driver (wrapped in repositories), supertest for integration tests  
**Storage**: MongoDB 7 single-node replica set orchestrated via `docker/compose.dev.yml` (API consumes `MONGODB_URI`)  
**Testing**: Jest 29 + ts-jest with supertest-powered HTTP integration suite and targeted repository unit tests  
**Target Platform**: Dockerized Node.js service (linux/amd64)  
**Project Type**: Web backend service within monorepo  
**Performance Goals**: Auth endpoints respond <2s p95 (SC-003); registration success ≥90% first-attempt (SC-001)  
**Constraints**: Manage secure httpOnly cookie sessions backed by MongoDB TTL indexes; enforce password ≥8 chars; reject duplicate emails with case-insensitive uniqueness  
**Scale/Scope**: MVP launch (~first 1k users) with design headroom for ~100 concurrent sessions and ~50 simultaneous registrations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SOLID Architecture**: PASS – auth flows will be split across controllers, services, better-auth façade, and Mongo repositories to keep responsibilities focused.  
- **DRY**: PASS – shared validation, hashing, and session helpers (derived from better-auth) will prevent duplication across register/login/me endpoints.  
- **TDD**: PASS – Jest + supertest integration suite and repository unit tests will be authored first, failing before implementation proceeds; bearers flows gain regression tests for revocation + refresh.  
- **User Experience Consistency**: PASS – unify API error formats/messages so clients receive predictable responses.  
- **Maintainability First**: PASS – introduce typed interfaces for user entities and encapsulate MongoDB access behind repositories for future swaps.

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
│   │   ├── modules/
│   │   │   └── auth/            # planned: controllers, services, repositories
│   │   ├── routes/
│   │   │   └── health.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── integration/         # planned: Supertest auth flows
│   │   └── unit/
│   ├── docker/                  # planned: service Dockerfile & compose snippets
│   └── package.json
└── web/
    └── ... (no changes in this feature)

docker/
└── compose.dev.yml              # planned: API + MongoDB services
```

**Structure Decision**: Extend the existing `apps/api` backend with a dedicated `modules/auth` area, colocated tests, and shared Docker tooling at the root to orchestrate the API and MongoDB services.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
