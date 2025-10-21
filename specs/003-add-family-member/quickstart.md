# Quickstart – Add Family Members

## Prerequisites
- Node.js 20, pnpm installed.
- MongoDB accessible via existing `docker/compose.dev.yml` or Testcontainers.
- `.env` configured with Better Auth credentials (see `apps/api/README.md`).

## Local Development
1. Start the API stack (MongoDB + API):
   ```bash
   pnpm --filter api dev
   ```
2. Seed/create a parent account via `/v1/auth/register` or existing fixtures.
3. Create a family using `POST /v1/families` and note the returned `familyId`.
4. Invoke the new endpoint to add a child:
   ```bash
   curl -X POST http://localhost:3333/v1/families/<familyId>/members \
     -H "Authorization: Bearer <parent-session-or-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"email":"child@example.com","password":"hunter2!!","role":"Child"}'
   ```
5. Add a co-parent by changing the role:
   ```bash
   curl -X POST http://localhost:3333/v1/families/<familyId>/members \
     -H "Authorization: Bearer <parent-session-or-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"email":"coparent@example.com","password":"hunter2!!","role":"Parent"}'
   ```
6. Confirm response contains `memberId`, `familyId`, `role`, `linkedAt`, `addedBy` and that no new tokens are issued in headers.

## Testing
1. Unit tests (role guard, service logic):
   ```bash
   pnpm --filter api test:unit -- family
   ```
2. Integration tests (route + repositories):
   ```bash
   pnpm --filter api test -- create-family-member
   ```
3. Lint and typecheck:
   ```bash
   pnpm lint && pnpm --filter api typecheck
   ```

## Validation Checklist
- Parent with valid token can add parent/child roles.
- Non-parent requests receive HTTP 403 with descriptive message.
- Duplicate email within same family yields 409 conflict.
- Emails linked to other families are rejected with guidance.
- MongoDB record contains `addedBy` and timestamps for auditing.
