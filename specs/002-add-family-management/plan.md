# Implementation Plan: Family Management

**Branch**: `[002-add-family-management]` | **Date**: 2025-10-20 | **Spec**: specs/002-add-family-management/spec.md
**Input**: Feature specification from `/specs/002-add-family-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement core family management for the API: allow authenticated users to create families, persist memberships with Parent/Child roles, and expose family membership data through new `/v1/families` endpoints. Reuse existing auth module patterns to enrich JWTs and the `/v1/auth/me` response with the creator's family list and roles without introducing new libraries.

## Technical Context

**Language/Version**: TypeScript 5.6 (Node.js 20 runtime)  
**Primary Dependencies**: Express, better-auth (bearer + JWT plugins), MongoDB driver, Zod, Winston  
**Storage**: MongoDB (shared `famly` database via `infra/mongo/client`)  
**Testing**: Jest + Supertest + Testcontainers (existing setup)  
**Target Platform**: Node.js API service deployed from `apps/api`  
**Project Type**: Backend API within pnpm monorepo (`apps/api`)  
**Performance Goals**: Maintain existing auth latency; newly enriched `/v1/auth/me` and JWT issuance deliver family data within existing 5s success criterion (target <500ms p95 under test load)  
**Constraints**: No new libraries; follow existing Express module patterns; ensure JWT remains stateless; honor Parent/Child role restriction  
**Scale/Scope**: Support multiple families per user with single-role memberships and future extensibility for invitations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **SOLID**: Plan introduces `FamilyService` + repositories mirroring auth structure; keeps controllers thin and adheres to SRP (PASS).
- **DRY**: Shared DTOs and membership fetch logic reused across routes, JWT enrichment, and `/me`; avoids duplicate transforms (PASS).
- **TDD**: Plan enumerates unit + integration + e2e coverage leveraging existing Jest suites; tests precede implementation (PASS).
- **UX Consistency**: API responses reuse established JSON envelope style and error handling through `HttpError` + middleware (PASS).
- **Maintainability**: Module placement under `modules/family`, typed models, and documented assumptions keep codebase cohesive (PASS).
- **KISS**: Avoid new abstractions beyond service/repository; reuse Express patterns and Better Auth hooks (PASS).

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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
apps/
└── api/
    ├── src/
    │   ├── app.ts
    │   ├── config/
    │   ├── infra/
    │   ├── lib/
    │   ├── middleware/
    │   ├── modules/
    │   │   ├── auth/
    │   │   └── family/          # new module for this feature
    │   ├── routes/
    │   └── server.ts
    └── tests/
        ├── unit/
        │   └── family/          # new unit specs
        ├── e2e/
        │   ├── auth/
        │   └── family/          # new e2e specs
        └── setup/
```

**Structure Decision**: Continue using the existing `apps/api` layered layout. Add a dedicated `modules/family` subtree (domain, repositories, services, routes, validators) alongside `modules/auth`, and mirror the testing structure under `apps/api/tests`.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _None_ | — | — |
