## 1. Specs & Design
- [x] 1.1 Align specs for API, domain, and web to add recurring flag and weekly re-creation behavior
- [x] 1.2 Document edge cases (deletions, updates mid-week, zero-remaining karma) in design

## 2. Backend
- [x] 2.1 Update domain/repository to store `recurring` flag and copy it to DTOs
- [x] 2.2 Extend validators and routes for create/update to accept recurring
- [x] 2.3 Update processor to recreate next week's goal when recurring is true (after award)
- [x] 2.4 Add/adjust unit + e2e tests (weekly processing, CRUD)

## 3. Frontend
- [x] 3.1 Add toggle UI to create/edit goal dialog/drawer with labels in dictionaries
- [x] 3.2 Wire API client + Redux slice to send/receive `recurring`
- [x] 3.3 Update web tests (unit + e2e page object flows)

## 4. Validation
- [x] 4.1 Run openspec validate add-recurring-contribution-goals --strict
- [x] 4.2 Run pnpm test && pnpm run lint
