# Project Context

## Purpose
Famly provides a family management platform that centralizes household organization. The MVP covers family membership management, role-based access, shared chores and allowances, calendar coordination, and household tracking so parents can coordinate responsibilities and keep kids engaged.

## Tech Stack
- Monorepo managed with `pnpm` workspaces
- API: Node.js 20, TypeScript 5.6, Express 4, Zod, MongoDB Node Driver, Better Auth (bearer + JWT plugins), Winston
- Web: Next.js 15 (React 19), Tailwind CSS 4, Biome for linting/formatting
- Tooling: Jest + ts-jest, Testcontainers, Supertest, Docker Compose for local infra

## Project Conventions

### Code Style
TypeScript operates in strict mode with path aliases. Follow SOLID, DRY, and KISS principles from `constitution.md`, keeping functions focused and naming expressive. Use Biome for web linting/formatting and adhere to project-level pnpm scripts for lint/test gates. Prefer small, composable modules with minimal side effects and document non-obvious intent with brief comments.

### Architecture Patterns
API follows modular Express architecture: domain modules encapsulate validators (Zod), services, repositories, and routes. Mongo access is centralized in `infra/mongo/client`. Cross-cutting concerns (auth, logging, error handling) live under `lib` and `middleware`. Web app uses Next.js app router with co-located layout/page components and Tailwind utility styling. Composition and dependency inversion are preferred over deep inheritance.

### Testing Strategy
TDD is required: write failing tests before implementation and keep the red-green-refactor cycle. Unit tests cover validators and business logic (`jest.config.unit.js`), while Jest e2e suites run with Testcontainers-backed MongoDB (`jest.config.e2e.js --runInBand`). All tests must pass via `pnpm test`; lint and format checks run with `pnpm run lint` when available. Critical paths should also have end-to-end coverage via API and web tests as features grow.

### Git Workflow
Work from feature branches named after the OpenSpec change ID or capability (e.g., `add-family-member`). Draft a proposal under `openspec/changes/` before implementation for net-new capabilities. Commits should be concise, reference the change ID when applicable, and merge through reviewed pull requests only after tests and lint pass.

## Domain Context
Families are composed of members with roles (parent, child, etc.) that govern access to chores, allowances, and management features. Parents coordinate household chores, track allowances and rewards, share calendars, and manage household resources. Many future-facing ideas (memories, chat, integrations) exist but MVP focus is on family membership, chores/tasks, allowances, calendars, and household tracking fundamentals.

## Important Constraints
- Uphold constitution principles (SOLID, DRY, KISS, Maintainability, UX consistency, TDD) for every change.
- Tests must be written first and kept green; no feature merges without red-green-refactor evidence.
- Back-end must remain compatible with Node.js 20 and MongoDB 7; avoid unvetted dependencies that conflict with Docker-based local development.
- Specs drive implementation: do not code new capabilities without an approved OpenSpec proposal.

## External Dependencies
- MongoDB (`famly` database) reachable locally via Docker or Testcontainers
- Better Auth for authentication workflows
- Docker and Testcontainers for integration testing infrastructure
- Optional integrations under exploration (calendar sync, messaging) are not yet implemented
