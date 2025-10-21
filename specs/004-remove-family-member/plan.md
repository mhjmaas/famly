# Implementation Plan: Remove Family Members

**Branch**: `004-remove-family-member` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-remove-family-member/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enable parent-role members to unlink existing family members while enforcing guardrails that prevent orphaning families, revoke access immediately, and capture auditable removal events. The feature will extend the existing family service, repositories, and Express routes under `apps/api`, reusing established authorization middleware and validator patterns.

## Technical Context

**Language/Version**: TypeScript 5.6 on Node.js 20  
**Primary Dependencies**: Express 4, better-auth (bearer + JWT plugins), MongoDB Node driver, Zod, Winston  
**Storage**: MongoDB (`famly` database via `infra/mongo/client`)  
**Testing**: Jest unit tests for isolated utilities/validators; E2E coverage with Jest + Supertest + Testcontainers for API flows  
**Testing Philosophy**: Follow red-green-refactor with service logic covered through E2E tests; limit unit specs to pure helpers and validation rules.  
**Target Platform**: Node.js API service (apps/api) deployed via existing backend pipeline  
**Project Type**: Monorepo service under `apps/api` (Express backend)  
**Performance Goals**: Maintain p95 latency under 300 ms for member removal operations, matching add-member benchmarks  
**Constraints**: Removal must be atomic per request, enforce parent-only authorization, and avoid leaving families without an active parent  
**Scale/Scope**: Support families up to >=25 active members with removal bursts of up to 5 requests per minute without manual throttling

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **SOLID**: Removal logic will live within `FamilyService` and reuse repository abstractions, preserving single responsibility and inversion (pass).  
2. **DRY**: Plan reuses existing authorize middleware, repository methods, and logger patterns, avoiding duplicate access checks (pass).  
3. **TDD**: Commit to red-green-refactor for validator/service logic plus E2E coverage validating removal flows per constitution (pass).  
4. **UX Consistency**: API will mirror existing error formats, messaging, and roster responses, ensuring predictable behaviour for parents and removed members (pass).  
5. **Maintainability First**: Changes aligned with existing module layout, keeping methods small and audited, with documentation updates scheduled (pass).  
6. **KISS**: Extend existing service and repository methods without introducing new layers, delivering the minimal change needed for unlinking (pass).

*Re-check after Phase 1 design: No new risks identified; all gates remain in pass status.*

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
|-- plan.md              # This file (/speckit.plan command output)
|-- research.md          # Phase 0 output (/speckit.plan command)
|-- data-model.md        # Phase 1 output (/speckit.plan command)
|-- quickstart.md        # Phase 1 output (/speckit.plan command)
|-- contracts/           # Phase 1 output (/speckit.plan command)
`-- tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
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
`-- api/
    |-- src/
    |   |-- app.ts
    |   |-- config/
    |   |-- infra/
    |   |-- lib/
    |   |-- middleware/
    |   |-- modules/
    |   |   |-- auth/
    |   |   `-- family/
    |   |-- routes/
    |   `-- server.ts
    `-- tests/
        |-- e2e/
        `-- unit/
```

**Structure Decision**: Work is confined to `apps/api` using the current module boundaries. Removal logic will extend `modules/family` (service, repositories, routes), reuse `modules/auth` middleware, and add coverage under `apps/api/tests`.

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | - | - |
