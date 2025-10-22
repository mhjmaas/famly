# Proposal: Add Shopping Lists

## Why
Families need a way to coordinate household shopping and groceries. Currently, Famly supports task management but lacks dedicated shopping list functionality where items can be easily checked off as purchased and shared across all family members.

## What Changes
- Add new `shopping-lists` module following tasks module architecture patterns
- Create `shopping_lists` MongoDB collection with embedded items
- Implement full CRUD operations for shopping lists and individual items
- Add REST API endpoints under `/v1/families/{familyId}/shopping-lists`
- Support list metadata: name and optional tags for categorization
- Enable item check-off functionality for tracking purchased items
- Apply same authorization pattern as tasks: all family members can manage lists

## Impact
- Affected specs: New `shopping-lists` capability
- Affected code:
  - New module: `apps/api/src/modules/shopping-lists/`
  - App registration: `apps/api/src/app.ts` (router mount)
  - Startup: `apps/api/src/server.ts` (index creation)
  - Test suites: Unit tests for validators, E2E tests for all endpoints
  - API documentation: Bruno collection entries
