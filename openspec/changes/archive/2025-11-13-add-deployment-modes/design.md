# Design: Deployment Mode Support

## Context
Famly needs to support two deployment scenarios:
1. **SaaS mode**: Multi-tenant cloud hosting with public landing page and open registration
2. **Standalone mode**: Single-family self-hosting with one-time onboarding and locked registration

The system must determine its mode at startup and enforce different behaviors for registration, routing, and UI rendering.

## Goals / Non-Goals

**Goals:**
- Enable self-hosters to run Famly for a single family without landing page or public registration
- Provide one-time onboarding flow in standalone mode
- Lock down registration after first user/family creation in standalone mode
- Keep SaaS mode behavior unchanged
- Make mode switchable via environment variable
- Ensure status endpoint is fast and cacheable for web SSR

**Non-Goals:**
- Multi-tenancy removal (standalone still uses same DB schema)
- Dynamic mode switching at runtime (requires restart)
- Migration tooling between modes
- Advanced onboarding customization

## Decisions

### Decision 1: Single MongoDB collection for deployment config
**What:** Create `deploymentConfig` collection with singleton document containing `{ mode, onboardingCompleted, updatedAt }`

**Why:**
- Centralized source of truth accessible to all API instances
- Supports future expansion (feature flags, instance metadata)
- Simpler than env-only approach for tracking onboarding state

**Alternatives considered:**
- Env variable only: Can't track onboarding completion persistently
- User collection flag: Mixes concerns, harder to query

### Decision 2: Seed on startup, not on first request
**What:** API startup script checks for deployment config document and creates it if missing, using `DEPLOYMENT_MODE` env var (default: `saas`)

**Why:**
- Guarantees config exists before any request
- Avoids race conditions with concurrent requests
- Clear initialization point for debugging

**Alternatives considered:**
- Lazy initialization: Adds complexity to every config read
- Migration script: Overkill for single document

### Decision 3: Unauthenticated `/v1/status` endpoint
**What:** Public endpoint returning `{ mode, onboardingCompleted }` without auth checks

**Why:**
- Web app needs this before user authentication
- Future mobile apps need it for initial routing
- No sensitive data exposed (mode is public knowledge)

**Alternatives considered:**
- Direct DB access in Next.js: Breaks API-first architecture, duplicates logic
- Separate web-only endpoint: Violates DRY, harder to maintain

### Decision 4: Block registration in standalone after onboarding
**What:** `POST /v1/auth/register` checks deployment config and returns 403 if `mode=standalone` and `onboardingCompleted=true`

**Why:**
- Enforces single-family constraint
- Clear error message for misconfigured clients
- Allows family members to still be added via `/v1/families/:id/members`

**Alternatives considered:**
- Middleware-based blocking: Harder to test, less explicit
- Count users in DB: Race conditions, performance overhead

### Decision 5: Mark onboarding complete on family creation
**What:** When first family is created in standalone mode, update `deploymentConfig.onboardingCompleted = true`

**Why:**
- Family creation is the final onboarding step
- Atomic operation with family insert
- Clear completion signal

**Alternatives considered:**
- Mark on user registration: User without family is incomplete onboarding
- Separate completion endpoint: Extra API call, more complex flow

### Decision 6: Web app uses status endpoint for routing
**What:** Next.js middleware or page-level logic calls `/v1/status` to determine whether to show landing page or onboarding

**Why:**
- Single source of truth (API)
- Supports SSR and client-side rendering
- Cacheable response (rarely changes)

**Alternatives considered:**
- Env variable in web: Doesn't reflect onboarding state
- Cookie-based state: Stale, not authoritative

## Data Model

### deploymentConfig Collection
```typescript
{
  _id: ObjectId,
  mode: 'saas' | 'standalone',
  onboardingCompleted: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Constraints:**
- Singleton collection (only one document)
- `mode` immutable after creation (requires restart to change)
- `onboardingCompleted` can only transition from `false` to `true`

## API Changes

### New Endpoint: GET /v1/status
**Response:**
```json
{
  "mode": "standalone",
  "onboardingCompleted": false
}
```

**Caching:** Web app should cache for 60s (onboarding completion is rare event)

### Modified Endpoint: POST /v1/auth/register
**New behavior in standalone mode:**
- If `onboardingCompleted = true`, return 403 with message: "Registration is closed. Contact your family administrator to be added."
- Otherwise, proceed with normal registration

**SaaS mode:** No change

### Modified Logic: POST /v1/families
**New behavior in standalone mode:**
- After successful family creation, if `onboardingCompleted = false`, update to `true`

**SaaS mode:** No change

## Web App Changes

### Landing Page (/)
**Standalone mode with onboarding complete:**
- Redirect to `/app` (or `/signin` if not authenticated)

**Standalone mode with onboarding incomplete:**
- Redirect to `/get-started` (onboarding flow)

**SaaS mode:**
- Render landing page as normal

### Registration Flow (/get-started)
**Standalone mode:**
- Skip deployment selection step (always standalone)
- Show onboarding-specific copy
- After family creation, user is redirected to `/app`

**SaaS mode:**
- Show deployment selection (cloud vs self-hosted)
- Existing flow unchanged

## Risks / Trade-offs

**Risk:** Deployment config document deleted accidentally
- **Mitigation:** Startup script recreates with defaults, log warning

**Risk:** Mode mismatch between env and DB after mode change
- **Mitigation:** Document that mode changes require DB reset or manual update

**Risk:** Status endpoint becomes performance bottleneck
- **Mitigation:** Extremely lightweight query, consider in-memory cache if needed

**Trade-off:** Breaking change to registration endpoint
- **Impact:** Existing clients in standalone mode will see 403 after onboarding
- **Mitigation:** This is desired behavior, document in migration notes

## Migration Plan

### For Existing Deployments
1. Add `DEPLOYMENT_MODE=saas` to `.env` (default, no behavior change)
2. API startup creates deployment config document on first run
3. Existing users unaffected (SaaS mode allows continued registration)

### For New Standalone Deployments
1. Set `DEPLOYMENT_MODE=standalone` in `.env`
2. First startup creates config with `onboardingCompleted=false`
3. First user completes onboarding, registration locks

### Rollback
- Remove `DEPLOYMENT_MODE` env var (defaults to `saas`)
- Delete `deploymentConfig` document to reset onboarding state
- Restart API

## Testing Strategy

### Unit Tests
- Deployment config repository CRUD operations
- Onboarding completion logic

### E2E Tests (API)
- Status endpoint returns correct mode and onboarding state
- Registration blocked in standalone after onboarding
- Registration allowed in standalone before onboarding
- Registration always allowed in SaaS mode
- Family creation marks onboarding complete in standalone
- Family creation doesn't affect onboarding in SaaS mode

### E2E Tests (Web)
- Skipped per user request (focus on API tests)

## Open Questions
None—requirements are clear from user request.
