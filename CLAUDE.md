# Famly Project

## Project Overview

This is a monorepo project using pnpm workspaces.

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
│   │   │   │   └── http-error.ts
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

36 directories, 69 files
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
