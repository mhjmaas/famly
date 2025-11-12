# Change: Add Deployment Mode Support (SaaS vs Standalone)

## Why
Famly currently operates only as a multi-tenant SaaS application with open registration. Self-hosters who clone the repo for a single family don't need the landing page or public registration—they need a one-time onboarding flow that locks down after the first user and family are created.

## What Changes
- Add new `deployment-config` capability with system-wide settings collection
- Add `DEPLOYMENT_MODE` environment variable (`saas` or `standalone`)
- Add `/v1/status` API endpoint (unauthenticated) returning `{ mode, onboardingCompleted }`
- **BREAKING**: Modify registration endpoint to block new registrations in standalone mode after onboarding completes
- Modify web auth flow to show onboarding instead of landing page in standalone mode
- Modify landing page to skip rendering in standalone mode with completed onboarding
- Seed deployment config on API startup with mode from env and `onboardingCompleted: false`
- Mark onboarding complete when first user creates a family in standalone mode
- Add E2E tests for API behavior in both modes

## Impact
- **Affected specs**: `deployment-config` (new), `auth`, `web-auth`, `landing-page`
- **Affected code**:
  - API: `src/infra/mongo/` (seeding), `src/modules/auth/routes/register.route.ts`, `src/modules/family/routes/create-family.route.ts`, `src/routes/` (new status endpoint)
  - Web: `app/page.tsx`, `app/get-started/`, middleware for route logic
  - Config: `.env.example`, `docker-compose.yml`
  - Tests: New E2E tests for status endpoint and registration blocking
