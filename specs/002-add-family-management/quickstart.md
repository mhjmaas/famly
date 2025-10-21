# Quickstart: Family Management Feature

## Prerequisites
- Node.js 20.x installed (aligns with repo toolchain)
- MongoDB accessible locally or via docker-compose (Testcontainers handles tests automatically)
- Environment variables configured as per `apps/api/README.md` (`MONGODB_URI`, `BETTER_AUTH_*`)

## Install & Build
```bash
cd /Users/marcelmaas/Developer/famly/apps/api
npm install
npm run build
```

## Test Strategy
1. **Unit tests** (services, validators):
   ```bash
   npm run test:unit -- family
   ```
2. **Integration + E2E tests** (routes, authentication flows):
   ```bash
   npm run test:e2e -- family
   ```
   These spin up MongoDB via Testcontainers; allow a few seconds for startup.
3. **Full suite** (before merge):
   ```bash
   npm test
   npm run lint
   ```

## Manual Verification (Smoke Test)
1. Start the API locally:
   ```bash
   npm run dev
   ```
2. Register a user and login (reuse existing `/v1/auth/register` + `/v1/auth/login`). Capture the returned `accessToken`.
3. Create a family:
   ```bash
   curl -X POST http://localhost:4000/v1/families \
     -H "Authorization: Bearer <accessToken>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Demo Family"}'
   ```
   Expect HTTP 201 with `{ family: { familyId, name, role:"Parent", linkedAt } }`.
4. List families:
   ```bash
   curl http://localhost:4000/v1/families \
     -H "Authorization: Bearer <accessToken>"
   ```
   Response should include the created family.
5. Verify `/v1/auth/me` echoes the same `families` array (using either cookie or bearer token).
6. Decode the JWT (e.g., jwt.io) and ensure the `families` claim matches the API response.

## Deployment Checklist
- Run `npm test && npm run lint` in `apps/api`.
- Confirm MongoDB indexes for `family_memberships` (unique compound + user lookup) created via migration/startup script.
- Communicate JWT schema change (`families` claim) to downstream consumers.
