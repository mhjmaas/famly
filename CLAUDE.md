# Famly Project

## Project Overview

This is a monorepo project using pnpm workspaces.

## Project Structure

<!-- TREE START -->
```
.
├── CLAUDE.md
├── README.md
├── apps
│   ├── api
│   │   ├── jest.config.js
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── app.ts
│   │   │   ├── routes
│   │   │   │   └── health.ts
│   │   │   └── server.ts
│   │   ├── tests
│   │   │   ├── health.test.ts
│   │   │   └── tsconfig.json
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
├── package.json
├── packages
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── scripts
    └── update-claude-tree.sh

12 directories, 31 files
```
<!-- TREE END -->

## Getting Started

To use this file with Claude, run:

```bash
pnpm run claude
```

This will generate an up-to-date project tree and open Claude.

## Development

### Scripts

- `pnpm run claude` - Update project tree and open Claude
- `pnpm run update:claude:tree` - Update the project tree in this file
