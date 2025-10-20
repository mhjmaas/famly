# famly Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-19

## Active Technologies
- TypeScript 5.6 (Node.js 20 runtime) (001-add-user-auth)

## Project Structure
```
src/
tests/
```

## Commands
npm test && npm run lint

## Code Style
TypeScript 5.6 (Node.js 20 runtime): Follow standard conventions

## Recent Changes
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
│   │   ├── TESTING.md
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
│   │   │   │       ├── client.ts
│   │   │   │       └── indexes.ts
│   │   │   ├── lib
│   │   │   │   └── http-error.ts
│   │   │   ├── middleware
│   │   │   │   └── error-handler.ts
│   │   │   ├── modules
│   │   │   │   └── auth
│   │   │   │       ├── better-auth.ts
│   │   │   │       ├── middleware
│   │   │   │       │   └── authenticate.ts
│   │   │   │       └── routes
│   │   │   │           ├── auth.router.ts
│   │   │   │           ├── login.route.ts
│   │   │   │           ├── me.route.ts
│   │   │   │           └── register.route.ts
│   │   │   ├── routes
│   │   │   │   └── health.ts
│   │   │   └── server.ts
│   │   ├── tests
│   │   │   ├── e2e
│   │   │   │   ├── auth
│   │   │   │   │   ├── login.e2e.test.ts
│   │   │   │   │   ├── me.e2e.test.ts
│   │   │   │   │   └── register.e2e.test.ts
│   │   │   │   └── setup
│   │   │   │       └── testcontainers-setup.ts
│   │   │   ├── health.test.ts
│   │   │   ├── integration
│   │   │   │   └── auth
│   │   │   │       ├── register-conflict.test.ts
│   │   │   │       └── register-success.test.ts
│   │   │   ├── setup
│   │   │   │   ├── global-setup.ts
│   │   │   │   ├── global-teardown.ts
│   │   │   │   ├── jest-setup.ts
│   │   │   │   └── test-app.ts
│   │   │   ├── tsconfig.json
│   │   │   └── unit
│   │   │       ├── modules
│   │   │       │   └── auth
│   │   │       │       └── user.repository.test.ts
│   │   │       └── validators
│   │   │           ├── login.validator.test.ts
│   │   │           └── register.validator.test.ts
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
│       └── mongo-init.js
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

38 directories, 73 files
```
