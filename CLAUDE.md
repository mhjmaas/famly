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


## Important notes
We use NextJS 16. In NextJS middleware.ts is replaced by proxy.ts

## Project Structure

<!-- TREE START -->
```
.
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── apps
│   ├── api
│   │   ├── *
│   └── web
│       ├── *
├── constitution.md
├── docker
│   ├── compose.dev.yml
│   ├── compose.test.yml
│   └── scripts
├── openspec
│   ├── AGENTS.md
│   ├── changes
│   │   └── *
│   ├── project.md
│   └── specs
│       ├── *
├── package.json
├── packages
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── reference
│   └── *
└── scripts
    ├── update-claude-tree.sh
    └── update-codex-tree.sh

243 directories, 751 files
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
