<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Famly Project

## Project Overview

This is a monorepo project using pnpm workspaces.

## Active Technologies
- TypeScript 5.6 on Node.js 20 + Express 4, better-auth (bearer + JWT plugins), MongoDB Node driver, Zod, Winston (003-add-family-member)
- MongoDB (`famly` database via `infra/mongo/client`) (003-add-family-member)

## Recent Changes
- 003-add-family-member
- 002-add-family-management: Added TypeScript 5.6 (Node.js 20 runtime) + Express, better-auth (bearer + JWT plugins), MongoDB driver, Zod, Winston
- 001-add-user-auth: Added TypeScript 5.6 (Node.js 20 runtime)

## Project Structure

<!-- TREE START -->
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
│   │   │   │   ├── auth
│   │   │   │   │   ├── better-auth.ts
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── user.ts
│   │   │   │   │   ├── middleware
│   │   │   │   │   │   ├── authenticate.ts
│   │   │   │   │   │   └── jwt-verify.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── auth.router.ts
│   │   │   │   │   │   ├── login.route.ts
│   │   │   │   │   │   ├── me.route.ts
│   │   │   │   │   │   └── register.route.ts
│   │   │   │   │   └── validators
│   │   │   │   │       └── login.validator.ts
│   │   │   │   └── family
│   │   │   │       ├── domain
│   │   │   │       │   └── family.ts
│   │   │   │       ├── index.ts
│   │   │   │       ├── lib
│   │   │   │       │   └── family.mapper.ts
│   │   │   │       ├── repositories
│   │   │   │       │   ├── family-membership.repository.ts
│   │   │   │       │   └── family.repository.ts
│   │   │   │       ├── routes
│   │   │   │       │   ├── families.route.ts
│   │   │   │       │   └── index.ts
│   │   │   │       ├── services
│   │   │   │       │   └── family.service.ts
│   │   │   │       └── validators
│   │   │   │           └── create-family.validator.ts
│   │   │   ├── routes
│   │   │   │   └── health.ts
│   │   │   └── server.ts
│   │   ├── tests
│   │   │   ├── e2e
│   │   │   │   ├── auth
│   │   │   │   │   ├── login.e2e.test.ts
│   │   │   │   │   ├── me.e2e.test.ts
│   │   │   │   │   └── register.e2e.test.ts
│   │   │   │   ├── family
│   │   │   │   │   ├── README.md
│   │   │   │   │   ├── create-family.e2e.test.ts
│   │   │   │   │   └── list-families.e2e.test.ts
│   │   │   │   ├── health.e2e.test.ts
│   │   │   │   ├── helpers
│   │   │   │   │   ├── database.ts
│   │   │   │   │   └── test-app.ts
│   │   │   │   └── setup
│   │   │   │       └── testcontainers-setup.ts
│   │   │   ├── setup
│   │   │   │   ├── global-setup.ts
│   │   │   │   ├── global-teardown.ts
│   │   │   │   └── jest-setup.ts
│   │   │   ├── tsconfig.json
│   │   │   └── unit
│   │   │       ├── family
│   │   │       │   ├── README.md
│   │   │       │   ├── create-family.validator.test.ts
│   │   │       │   ├── family.service.create.test.ts
│   │   │       │   └── family.service.list.test.ts
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
├── bruno
│   └── Famly
│       ├── auth
│       │   ├── folder.bru
│       │   ├── login.bru
│       │   ├── me.bru
│       │   ├── refresh.bru
│       │   └── signup.bru
│       ├── bruno.json
│       ├── environments
│       │   └── local.bru
│       └── family
│           ├── create.bru
│           ├── folder.bru
│           └── get all.bru
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
    ├── 001-add-user-auth
    │   ├── checklists
    │   │   └── requirements.md
    │   ├── contracts
    │   │   └── auth.openapi.yaml
    │   ├── data-model.md
    │   ├── plan.md
    │   ├── quickstart.md
    │   ├── research.md
    │   ├── spec.md
    │   └── tasks.md
    ├── 002-add-family-management
    │   ├── checklists
    │   │   └── requirements.md
    │   ├── contracts
    │   │   └── family.openapi.yaml
    │   ├── data-model.md
    │   ├── plan.md
    │   ├── quickstart.md
    │   ├── research.md
    │   ├── spec.md
    │   └── tasks.md
    └── 003-add-family-member
        ├── checklists
        │   └── requirements.md
        ├── contracts
        │   └── family-members.openapi.yaml
        ├── data-model.md
        ├── plan.md
        ├── quickstart.md
        ├── research.md
        ├── spec.md
        └── tasks.md

57 directories, 114 files
```
<!-- TREE END -->

## Development

### Scripts

- `pnpm run claude` - Update project tree and open Claude
- `pnpm run update:claude:tree` - Update the project tree in this file

### Task management

We track work in Beads instead of Markdown. Run \`bd quickstart\` to see how.

### Document writing

You will not write summary markdown documents unless you are explicitly asked to by the user.
