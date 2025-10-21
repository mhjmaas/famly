# Quickstart - Remove Family Members

## Prerequisites
- Node.js 20 with pnpm installed.
- MongoDB available via `docker/compose.dev.yml` or Testcontainers runtime (required for E2E tests).
- Parent session token available (sign up via `/v1/auth/register`).

## Local Development
1. Launch the API stack:
   ```bash
   pnpm --filter api dev
   ```
2. Create a parent and family if needed:
   ```bash
   curl -X POST http://localhost:3333/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"parent@example.com","password":"parentpass123","name":"Parent"}'
   ```
3. Add at least one additional member so the delete scenarios have targets:
   ```bash
   curl -X POST http://localhost:3333/v1/families/<familyId>/members \
     -H "Authorization: Bearer <parent-session-or-jwt>" \
     -H "Content-Type: application/json" \
     -d '{"email":"child@example.com","password":"childpass123","role":"Child"}'
   ```
4. Remove a member as a parent:
   ```bash
   curl -X DELETE http://localhost:3333/v1/families/<familyId>/members/<memberUserId> \
     -H "Authorization: Bearer <parent-session-or-jwt>"
   ```
   - Expected response: `204 No Content`.
5. Verify removal:
   - `GET /v1/families` should no longer include the removed member.
   - Removed user can no longer access parent-only endpoints (should receive 403).

## Testing
1. Unit tests for validators and helpers:
   ```bash
   pnpm --filter api test:unit
   ```
2. End-to-end suites (require Testcontainers runtime):
   ```bash
   pnpm --filter api test -- remove-member
   pnpm --filter api test -- remove-parent-guard
   pnpm --filter api test -- remove-non-parent
   ```
3. Lint and typecheck before committing:
   ```bash
   pnpm lint && pnpm --filter api typecheck
   ```

## Validation Checklist
- Parent receives 204 response when removing a child or co-parent while another parent remains.
- Attempting to remove the final parent yields HTTP 409 with explanatory message.
- Non-parent removal attempts return HTTP 403.
- Roster returned by `/v1/families` updates immediately after removal.
