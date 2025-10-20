# famly Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-19

## Active Technologies
- TypeScript 5.6 (Node.js 20 runtime) (001-add-user-auth)
- TypeScript 5.6 (Node.js 20 runtime) + Express, better-auth (bearer + JWT plugins), MongoDB driver, Zod, Winston (002-add-family-management)
- MongoDB (shared `famly` database via `infra/mongo/client`) (002-add-family-management)

## Project Structure
```
src/
tests/
```

## Commands
pnpm test && pnpm run lint

## Code Style
TypeScript 5.6 (Node.js 20 runtime): Follow standard conventions

## Recent Changes
- 002-add-family-management: Added TypeScript 5.6 (Node.js 20 runtime) + Express, better-auth (bearer + JWT plugins), MongoDB driver, Zod, Winston
- 001-add-user-auth: Added TypeScript 5.6 (Node.js 20 runtime)

<!-- MANUAL ADDITIONS START -->
```
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── apps
│   ├── api
│   │   ├── README.md
│   │   ├── docker
│   │   │   └── Dockerfile
│   │   ├── jest.config.e2e.js
│   │   ├── jest.config.js
│   │   ├── jest.config.unit.js
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── app.ts
│   │   │   ├── config
│   │   │   │   ├── env.ts
│   │   │   │   └── settings.ts
│   │   │   ├── infra
│   │   │   │   └── mongo
│   │   │   │       └── client.ts
│   │   │   ├── lib
│   │   │   │   ├── http-error.ts
│   │   │   │   └── logger.ts
│   │   │   ├── middleware
│   │   │   │   └── error-handler.ts
│   │   │   ├── modules
│   │   │   │   └── auth
│   │   │   │       ├── better-auth.ts
│   │   │   │       ├── domain
│   │   │   │       │   └── user.ts
│   │   │   │       ├── middleware
│   │   │   │       │   ├── authenticate.ts
│   │   │   │       │   └── jwt-verify.ts
│   │   │   │       ├── routes
│   │   │   │       │   ├── auth.router.ts
│   │   │   │       │   ├── login.route.ts
│   │   │   │       │   ├── me.route.ts
│   │   │   │       │   └── register.route.ts
│   │   │   │       └── validators
│   │   │   │           └── login.validator.ts
│   │   │   ├── routes
│   │   │   │   └── health.ts
│   │   │   └── server.ts
│   │   ├── tests
│   │   │   ├── e2e
│   │   │   │   ├── auth
│   │   │   │   │   ├── login.e2e.test.ts
│   │   │   │   │   ├── me.e2e.test.ts
│   │   │   │   │   └── register.e2e.test.ts
│   │   │   │   ├── health.e2e.test.ts
│   │   │   │   └── setup
│   │   │   │       └── testcontainers-setup.ts
│   │   │   ├── setup
│   │   │   │   ├── global-setup.ts
│   │   │   │   ├── global-teardown.ts
│   │   │   │   └── jest-setup.ts
│   │   │   ├── tsconfig.json
│   │   │   └── unit
│   │   │       └── lib
│   │   │           ├── http-error.test.ts
│   │   │           └── logger.test.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.spec.json
│   └── web
│       ├── README.md
│       ├── biome.json
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── public
│       │   ├── file.svg
│       │   ├── globe.svg
│       │   ├── next.svg
│       │   ├── vercel.svg
│       │   └── window.svg
│       ├── src
│       │   └── app
│       │       ├── favicon.ico
│       │       ├── globals.css
│       │       ├── layout.tsx
│       │       └── page.tsx
│       └── tsconfig.json
├── docker
│   ├── compose.dev.yml
│   └── scripts
├── package.json
├── packages
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts
│   ├── update-claude-tree.sh
│   └── update-codex-tree.sh
└── specs
    └── 001-add-user-auth
        ├── checklists
        │   └── requirements.md
        ├── contracts
        │   └── auth.openapi.yaml
        ├── data-model.md
        ├── plan.md
        ├── quickstart.md
        ├── research.md
        ├── spec.md
        └── tasks.md

36 directories, 70 files
```
