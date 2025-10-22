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

# famly Development Guidelines
Our core guiding principles are found in the `constitution.md` file.


## Active Technologies
- TypeScript 5.6 on Node.js 20 + Express 4, better-auth (bearer + JWT plugins), MongoDB Node driver, Zod, Winston (003-add-family-member)
- MongoDB (`famly` database via `infra/mongo/client`) (003-add-family-member)

## Project Structure
```
src/
tests/
```

## Commands
pnpm test && pnpm run lint

## Code Style
TypeScript 5.6 (Node.js 20 runtime): Follow standard conventions

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
│   │   │   │   ├── auth
│   │   │   │   │   ├── better-auth.ts
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── user.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── require-family-role.ts
│   │   │   │   │   ├── middleware
│   │   │   │   │   │   ├── authenticate.ts
│   │   │   │   │   │   ├── authorize-family-role.ts
│   │   │   │   │   │   ├── index.ts
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
│   │   │   │           ├── add-family-member.validator.ts
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
│   │   │   │   │   ├── add-child-member.e2e.test.ts
│   │   │   │   │   ├── add-member-authorization.e2e.test.ts
│   │   │   │   │   ├── add-parent-member.e2e.test.ts
│   │   │   │   │   ├── create-family.e2e.test.ts
│   │   │   │   │   ├── list-families.e2e.test.ts
│   │   │   │   │   ├── remove-member.e2e.test.ts
│   │   │   │   │   ├── remove-non-parent.e2e.test.ts
│   │   │   │   │   └── remove-parent-guard.e2e.test.ts
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
│   │   │       ├── auth
│   │   │       │   └── require-family-role.test.ts
│   │   │       ├── family
│   │   │       │   ├── README.md
│   │   │       │   ├── add-family-member.validator.test.ts
│   │   │       │   └── create-family.validator.test.ts
│   │   │       └── lib
│   │   │           └── http-error.test.ts
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
│           ├── add member.bru
│           ├── create.bru
│           ├── delete member.bru
│           ├── folder.bru
│           └── get all.bru
├── docker
│   ├── compose.dev.yml
│   └── scripts
├── openspec
│   ├── AGENTS.md
│   ├── changes
│   │   └── archive
│   ├── project.md
│   └── specs
├── package.json
├── packages
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── scripts
    ├── update-claude-tree.sh
    └── update-codex-tree.sh

53 directories, 103 files
```
