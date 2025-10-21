# Quickstart - Remove Family Members

## Prerequisites
- Node.js 20 with pnpm installed.
- MongoDB running via `docker/compose.dev.yml` or Testcontainers.
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
3. Add at least two parents or a parent plus child to the family using the existing add-member endpoint.
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
1. Unit tests for validator/service helpers:
   ```bash
   pnpm --filter api test:unit -- family
   ```
2. End-to-end tests covering happy path, authorization, and guardrails:
   ```bash
   pnpm --filter api test -- remove-family-member
   ```
3. Lint and typecheck before committing:
   ```bash
   pnpm lint && pnpm --filter api typecheck
   ```

## Validation Checklist
- Parent receives 204 response when removing a child or co-parent while another parent remains.
- Attempting to remove the final parent yields HTTP 409 with explanatory message.
- Non-parent removal attempts return HTTP 403.
- Audit collection `family_membership_removals` stores `familyId`, `userId`, `removedBy`, `removedAt`.
- Roster returned by `/v1/families` updates immediately after removal.
