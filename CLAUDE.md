# Famly Project

## Project Overview

This is a monorepo project using pnpm workspaces.

## Project Structure

<!-- TREE START -->
```
.
├── apps
├── packages
├── scripts
│   └── update-claude-tree.sh
├── package.json
├── pnpm-workspace.yaml
└── .gitignore
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
