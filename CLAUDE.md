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

## Development guidelines
Our core guiding principles are found in the `constitution.md` file.

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
│   │   ├── biome.json
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
│   │   │   │   │   ├── lib
│   │   │   │   │   │   ├── require-creator-ownership.ts
│   │   │   │   │   │   └── require-family-role.ts
│   │   │   │   │   ├── middleware
│   │   │   │   │   │   ├── authenticate.ts
│   │   │   │   │   │   ├── authorize-creator-ownership.ts
│   │   │   │   │   │   ├── authorize-family-role.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   └── jwt-verify.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── auth.router.ts
│   │   │   │   │   │   ├── login.route.ts
│   │   │   │   │   │   ├── me.route.ts
│   │   │   │   │   │   └── register.route.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── login.validator.ts
│   │   │   │   │       └── register.validator.ts
│   │   │   │   ├── diary
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── diary-entry.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── diary-entry.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   └── diary.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── create-entry.route.ts
│   │   │   │   │   │   ├── delete-entry.route.ts
│   │   │   │   │   │   ├── diary.router.ts
│   │   │   │   │   │   ├── get-entry.route.ts
│   │   │   │   │   │   ├── list-entries.route.ts
│   │   │   │   │   │   └── update-entry.route.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── create-entry.validator.ts
│   │   │   │   │       └── update-entry.validator.ts
│   │   │   │   ├── family
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── family.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── family.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   ├── family-membership.repository.ts
│   │   │   │   │   │   └── family.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── add-member.route.ts
│   │   │   │   │   │   ├── create-family.route.ts
│   │   │   │   │   │   ├── families.route.ts
│   │   │   │   │   │   ├── index.ts
│   │   │   │   │   │   ├── list-families.route.ts
│   │   │   │   │   │   └── remove-member.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   └── family.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── add-family-member.validator.ts
│   │   │   │   │       └── create-family.validator.ts
│   │   │   │   ├── shopping-lists
│   │   │   │   │   ├── domain
│   │   │   │   │   │   └── shopping-list.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── lib
│   │   │   │   │   │   └── shopping-list.mapper.ts
│   │   │   │   │   ├── repositories
│   │   │   │   │   │   └── shopping-list.repository.ts
│   │   │   │   │   ├── routes
│   │   │   │   │   │   ├── add-item.route.ts
│   │   │   │   │   │   ├── create-list.route.ts
│   │   │   │   │   │   ├── delete-item.route.ts
│   │   │   │   │   │   ├── delete-list.route.ts
│   │   │   │   │   │   ├── get-list.route.ts
│   │   │   │   │   │   ├── list-lists.route.ts
│   │   │   │   │   │   ├── shopping-lists.router.ts
│   │   │   │   │   │   ├── update-item.route.ts
│   │   │   │   │   │   └── update-list.route.ts
│   │   │   │   │   ├── services
│   │   │   │   │   │   └── shopping-list.service.ts
│   │   │   │   │   └── validators
│   │   │   │   │       ├── add-item.validator.ts
│   │   │   │   │       ├── create-list.validator.ts
│   │   │   │   │       ├── update-item.validator.ts
│   │   │   │   │       └── update-list.validator.ts
│   │   │   │   └── tasks
│   │   │   │       ├── domain
│   │   │   │       │   ├── task-schedule.ts
│   │   │   │       │   └── task.ts
│   │   │   │       ├── index.ts
│   │   │   │       ├── lib
│   │   │   │       │   ├── schedule-matcher.ts
│   │   │   │       │   ├── task-schedule.mapper.ts
│   │   │   │       │   ├── task-scheduler.ts
│   │   │   │       │   └── task.mapper.ts
│   │   │   │       ├── repositories
│   │   │   │       │   ├── schedule.repository.ts
│   │   │   │       │   └── task.repository.ts
│   │   │   │       ├── routes
│   │   │   │       │   ├── create-schedule.route.ts
│   │   │   │       │   ├── create-task.route.ts
│   │   │   │       │   ├── delete-schedule.route.ts
│   │   │   │       │   ├── delete-task.route.ts
│   │   │   │       │   ├── get-schedule.route.ts
│   │   │   │       │   ├── get-task.route.ts
│   │   │   │       │   ├── list-schedules.route.ts
│   │   │   │       │   ├── list-tasks.route.ts
│   │   │   │       │   ├── tasks.router.ts
│   │   │   │       │   ├── update-schedule.route.ts
│   │   │   │       │   └── update-task.route.ts
│   │   │   │       ├── services
│   │   │   │       │   ├── schedule.service.ts
│   │   │   │       │   ├── task-generator.service.ts
│   │   │   │       │   └── task.service.ts
│   │   │   │       └── validators
│   │   │   │           ├── create-schedule.validator.ts
│   │   │   │           ├── create-task.validator.ts
│   │   │   │           ├── update-schedule.validator.ts
│   │   │   │           └── update-task.validator.ts
│   │   │   ├── routes
│   │   │   │   └── health.ts
│   │   │   └── server.ts
│   │   ├── tests
│   │   │   ├── e2e
│   │   │   │   ├── auth
│   │   │   │   │   ├── login.e2e.test.ts
│   │   │   │   │   ├── me.e2e.test.ts
│   │   │   │   │   └── register.e2e.test.ts
│   │   │   │   ├── diary
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── create-entry.e2e.test.ts
│   │   │   │   │   ├── delete-entry.e2e.test.ts
│   │   │   │   │   ├── get-entry.e2e.test.ts
│   │   │   │   │   ├── list-entries.e2e.test.ts
│   │   │   │   │   └── update-entry.e2e.test.ts
│   │   │   │   ├── family
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
│   │   │   │   ├── setup
│   │   │   │   │   └── testcontainers-setup.ts
│   │   │   │   ├── shopping-lists
│   │   │   │   │   ├── add-item.e2e.test.ts
│   │   │   │   │   ├── authorization.e2e.test.ts
│   │   │   │   │   ├── create-list.e2e.test.ts
│   │   │   │   │   ├── delete-item.e2e.test.ts
│   │   │   │   │   ├── delete-list.e2e.test.ts
│   │   │   │   │   ├── get-list.e2e.test.ts
│   │   │   │   │   ├── list-lists.e2e.test.ts
│   │   │   │   │   ├── update-item.e2e.test.ts
│   │   │   │   │   └── update-list.e2e.test.ts
│   │   │   │   └── tasks
│   │   │   │       ├── create-schedule.e2e.test.ts
│   │   │   │       ├── create-task.e2e.test.ts
│   │   │   │       ├── delete-schedule.e2e.test.ts
│   │   │   │       ├── delete-task.e2e.test.ts
│   │   │   │       ├── get-schedule.e2e.test.ts
│   │   │   │       ├── get-task.e2e.test.ts
│   │   │   │       ├── list-schedules.e2e.test.ts
│   │   │   │       ├── list-tasks.e2e.test.ts
│   │   │   │       ├── update-schedule.e2e.test.ts
│   │   │   │       └── update-task.e2e.test.ts
│   │   │   ├── setup
│   │   │   │   ├── global-setup.ts
│   │   │   │   ├── global-teardown.ts
│   │   │   │   └── jest-setup.ts
│   │   │   ├── tsconfig.json
│   │   │   └── unit
│   │   │       ├── auth
│   │   │       │   ├── require-creator-ownership.test.ts
│   │   │       │   └── require-family-role.test.ts
│   │   │       ├── diary
│   │   │       │   ├── create-entry.validator.test.ts
│   │   │       │   ├── diary-entry.mapper.test.ts
│   │   │       │   └── update-entry.validator.test.ts
│   │   │       ├── family
│   │   │       │   ├── README.md
│   │   │       │   ├── add-family-member.validator.test.ts
│   │   │       │   └── create-family.validator.test.ts
│   │   │       ├── lib
│   │   │       │   └── http-error.test.ts
│   │   │       ├── shopping-lists
│   │   │       │   ├── add-item.validator.test.ts
│   │   │       │   ├── create-list.validator.test.ts
│   │   │       │   ├── shopping-list.mapper.test.ts
│   │   │       │   ├── update-item.validator.test.ts
│   │   │       │   └── update-list.validator.test.ts
│   │   │       └── tasks
│   │   │           ├── create-schedule.validator.test.ts
│   │   │           ├── create-task.validator.test.ts
│   │   │           ├── schedule-matcher.test.ts
│   │   │           ├── task-schedule.mapper.test.ts
│   │   │           ├── task.mapper.test.ts
│   │   │           ├── update-schedule.validator.test.ts
│   │   │           └── update-task.validator.test.ts
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
│       ├── diary
│       │   ├── create entry.bru
│       │   ├── delete entry.bru
│       │   ├── folder.bru
│       │   ├── get entry.bru
│       │   ├── list entries.bru
│       │   └── update entry.bru
│       ├── environments
│       │   └── local.bru
│       ├── family
│       │   ├── add member.bru
│       │   ├── create.bru
│       │   ├── delete member.bru
│       │   ├── folder.bru
│       │   └── get all.bru
│       ├── shopping-lists
│       │   ├── add item.bru
│       │   ├── create list.bru
│       │   ├── delete item.bru
│       │   ├── delete list.bru
│       │   ├── folder.bru
│       │   ├── get list.bru
│       │   ├── list lists.bru
│       │   ├── update item.bru
│       │   └── update list.bru
│       └── tasks
│           ├── complete-task.bru
│           ├── create-schedule.bru
│           ├── create-task.bru
│           ├── delete-schedule.bru
│           ├── delete-task.bru
│           ├── folder.bru
│           ├── get-task.bru
│           ├── list-schedules.bru
│           ├── list-tasks.bru
│           ├── update-schedule.bru
│           └── update-task.bru
├── constitution.md
├── docker
│   ├── compose.dev.yml
│   └── scripts
├── openspec
│   ├── AGENTS.md
│   ├── changes
│   ├── project.md
│   └── specs
│       ├── auth
│       │   └── spec.md
│       ├── diary
│       │   └── spec.md
│       ├── family
│       │   └── spec.md
│       ├── shopping-lists
│       │   └── spec.md
│       └── tasks
│           └── spec.md
├── package.json
├── packages
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── scripts
    ├── update-claude-tree.sh
    └── update-codex-tree.sh

86 directories, 239 files
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
