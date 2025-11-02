## Why

Users need a way to sign in and register for Famly through a web interface. Currently, the backend authentication API exists but there is no frontend UI to consume these endpoints.

## What Changes

- Add sign-in page at `/signin` with email/password form
- Add registration flow at `/get-started` with multi-step onboarding (account creation + family setup)
- Implement protected `/app` route with Next.js 16 middleware-based authentication
- Create reusable authentication UI components using shadcn/ui
- Integrate with existing backend API endpoints (`POST /v1/auth/login`, `POST /v1/auth/register`, `POST /v1/families`)
- Apply design system from reference implementation (color palette, spacing, typography)
- Set up session management using cookies for authenticated state

## Impact

- Affected specs: **web-auth** (new capability)
- Affected code:
  - `apps/web/src/app/` - New pages for signin, get-started, and app
  - `apps/web/src/components/` - New auth form components
  - `apps/web/src/middleware.ts` - Route protection logic
  - `apps/web/src/lib/` - Auth utilities and API client
