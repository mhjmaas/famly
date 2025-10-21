# Implementation Plan: Add Family Members

**Branch**: `003-add-family-member` | **Date**: 2025-10-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-add-family-member/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable parents to add new family members (parents or children) without auto-login, while enforcing role-based authorization via a reusable guard that can be used as middleware or utility. Extend the families API to expose the add-member endpoint under the existing `/v1/families` route, orchestrating user creation, membership linkage, and audit logging.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20  
**Primary Dependencies**: Express 4, better-auth (bearer + JWT plugins), MongoDB Node driver, Zod, Winston  
**Storage**: MongoDB (`famly` database via `infra/mongo/client`)  
**Testing**: Jest unit tests for pure functions/validators only; E2E tests with Testcontainers for all service/integration logic
**Testing Philosophy**: Per constitution, unit tests cover only pure functions (validators, utilities, mappers). All service methods, database interactions, and API endpoints are tested via black-box E2E tests.  
**Target Platform**: Node.js API service deployed via existing backend pipeline  
**Project Type**: Monorepo with `apps/api` Express backend  
**Performance Goals**: Maintain p95 latency under 300 ms for add-member operations  
**Constraints**: Single-request atomic flow leveraging better-auth hashing; prevent leaking auth tokens when provisioning members  
**Scale/Scope**: Support ≥25 active members per family and up to 5 additions per family per minute without manual throttling

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **SOLID**: Planned authorization utility will encapsulate role checks with single responsibility and be injected where needed to avoid modifying existing consumers (pass).  
2. **DRY**: Reusable guard prevents duplicated role-checking logic across routes/services (pass).  
3. **TDD**: Commit to writing failing tests (unit + integration) before implementation for new guard, service method, and endpoint (pass).  
4. **UX Consistency**: API will return existing error formats with actionable messaging, aligning with current routes (pass).  
5. **Maintainability First**: Changes scoped to `apps/api` modules with clear abstractions and audit logging; documentation updates planned (pass).  
6. **KISS**: Leverage existing Express + service pattern, avoiding unnecessary abstraction beyond shared guard utility (pass).

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
└── api/
    ├── src/
    │   ├── app.ts
    │   ├── config/
    │   ├── infra/
    │   ├── lib/
    │   ├── middleware/
    │   ├── modules/
    │   │   ├── auth/
    │   │   └── family/
    │   ├── routes/
    │   └── server.ts
    └── tests/
        ├── e2e/
        └── unit/
```

**Structure Decision**: Feature work centers on `apps/api`, reusing existing module boundaries for auth and family. New authorization guard will live under `modules/auth` (utility + middleware), and family membership endpoint will extend `modules/family`.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | — | — |
