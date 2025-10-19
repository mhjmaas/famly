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
        └── spec.md

16 directories, 40 files
```

## Task management

We track work in Beads instead of Markdown. Run \`bd quickstart\` to see how.