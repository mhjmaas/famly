# Add Landing Page

## Why

Famly currently has no public-facing web presence. Users need a marketing landing page that introduces the product, explains its privacy-first approach, showcases features, and provides clear calls-to-action for self-hosting or cloud beta signup. This is the first frontend feature for the web application and establishes patterns for future web development.

## What Changes

- Create a visually polished landing page matching the reference design in `reference/v0-famly`
- Implement Hero, Features, Privacy, Pricing, Navigation, and Footer sections using shadcn/ui components
- Set up Playwright E2E testing infrastructure with Docker Compose for isolated test environments
- Establish web testing patterns following the same testcontainers approach used in the API
- Ensure all components follow SOLID, DRY, KISS principles from the constitution
- Create reusable UI components that can be leveraged for future features

## Impact

- **Affected specs**: New capability `landing-page` (no existing specs modified)
- **Affected code**: 
  - `apps/web/src/app/page.tsx` - Replace default Next.js page with landing page
  - `apps/web/src/components/` - New directory for landing page components (hero, features, navigation, footer, privacy, pricing)
  - `apps/web/src/components/ui/` - shadcn/ui components (already initialized)
  - `apps/web/tests/` - New E2E test suite with Playwright
  - `docker/compose.test.yml` - New Docker Compose configuration for E2E test environment
- **Testing strategy**: Playwright E2E tests running against isolated Docker Compose environment (API + MongoDB + Web)
- **Dependencies**: Playwright, Docker Compose for test orchestration
