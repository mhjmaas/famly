# Landing Page Design

## Context

This is the first frontend feature for Famly's web application. The landing page serves as the public-facing entry point and establishes patterns for future web development. We need to:

1. Match the visual design from `reference/v0-famly` exactly
2. Set up E2E testing infrastructure using Playwright
3. Follow the constitution's SOLID, DRY, KISS, TDD, and maintainability principles
4. Establish reusable component patterns for future features

**Constraints:**
- Must use Next.js 16 with React 19 (already initialized)
- Must use shadcn/ui components (already initialized)
- Must use Tailwind CSS 4 for styling
- E2E tests must run in isolated Docker environment (similar to API testcontainers pattern)
- Must meet WCAG 2.1 AA accessibility standards
- Must achieve good Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)

## Goals / Non-Goals

**Goals:**
- Create a visually polished, performant landing page matching the reference design
- Establish E2E testing patterns for web features using Playwright + Docker Compose
- Build reusable UI components following SOLID principles
- Ensure full accessibility compliance (WCAG 2.1 AA)
- Set up test infrastructure that mirrors API's testcontainers approach

**Non-Goals:**
- Authentication flows (Sign In / Get Started pages) - future work
- Backend integration for the landing page (static content only)
- Mobile app development
- CMS or content management system
- Analytics or tracking (privacy-first approach)

## Decisions

### Decision 1: Component Architecture
**What:** Use Next.js App Router with co-located components following atomic design principles.

**Structure:**
```
apps/web/src/
├── app/
│   ├── page.tsx              # Landing page composition
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── landing/              # Landing-specific components
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── privacy.tsx
│   │   ├── pricing.tsx
│   │   ├── navigation.tsx
│   │   └── footer.tsx
│   └── ui/                   # shadcn/ui components (already exists)
└── lib/
    └── utils.ts              # Utility functions (cn, etc.)
```

**Why:**
- Follows Next.js 16 conventions (App Router)
- Clear separation between landing-specific and reusable UI components
- Easy to test individual components in isolation
- Aligns with SOLID (Single Responsibility) - each component has one clear purpose

**Alternatives considered:**
- Pages Router: Rejected - App Router is the modern Next.js standard
- Monolithic page component: Rejected - violates SRP, hard to test and maintain
- Feature-based structure: Deferred - premature for first feature, revisit when we have 3+ features

### Decision 2: E2E Testing with Playwright + Docker Compose
**What:** Use Playwright for E2E tests with Docker Compose orchestrating the full stack (Web + API + MongoDB).

**Architecture:**
```
docker/
├── compose.dev.yml           # Existing dev environment
└── compose.test.yml          # New test environment

apps/web/
├── tests/
│   ├── e2e/
│   │   ├── landing-page.spec.ts
│   │   └── setup/
│   │       └── docker-setup.ts
│   └── playwright.config.ts
└── package.json              # Add Playwright scripts
```

**Test Flow:**
1. `pnpm test:e2e` starts Docker Compose with test profile
2. Playwright waits for services to be healthy
3. Tests run against isolated environment (separate DB, ports)
4. Teardown stops all containers and cleans up

**Why:**
- Mirrors API's testcontainers pattern - consistent testing approach across stack
- Docker Compose provides full stack isolation (no shared state between test runs)
- Playwright is industry standard for modern web E2E testing
- Can test web + API integration flows in future
- Simpler than Testcontainers for web (no need for programmatic container management)

**Alternatives considered:**
- Testcontainers for web: Rejected - overkill for frontend, Docker Compose is simpler
- Jest + Testing Library only: Rejected - doesn't test real browser behavior, integration with API
- Cypress: Rejected - Playwright has better TypeScript support and modern features
- No E2E tests: Rejected - violates TDD principle, landing page is critical user journey

### Decision 3: Component Testing Strategy
**What:** Use Playwright component testing for isolated component tests, E2E tests for full page flows.

**Test Pyramid:**
```
E2E Tests (Playwright)
├── Full landing page flow
├── Navigation interactions
├── Responsive behavior
└── Accessibility checks

Component Tests (Playwright CT)
├── Hero animations
├── Feature card interactions
├── Pricing card display
└── Footer links

Unit Tests (Vitest - future)
└── Utility functions
```

**Why:**
- Playwright supports both E2E and component testing - single tool, consistent API
- Component tests are faster than full E2E, good for iteration
- E2E tests validate real user flows and integration
- Follows TDD principle with multiple test levels

**Alternatives considered:**
- Jest + React Testing Library: Rejected - doesn't test in real browser, Playwright CT is better
- Only E2E tests: Rejected - too slow for component iteration
- Storybook + Chromatic: Deferred - visual regression testing is valuable but not MVP

### Decision 4: Styling Approach
**What:** Use Tailwind CSS 4 with shadcn/ui components, following the reference design's utility-first approach.

**Patterns:**
- Use Tailwind utility classes directly in components
- Extract repeated patterns into shadcn/ui components
- Use CSS variables for theming (already set up by shadcn)
- Animations via Tailwind's animation utilities and CSS keyframes

**Why:**
- Tailwind 4 is already initialized in the project
- shadcn/ui provides accessible, composable components
- Reference design uses utility-first approach
- Follows DRY principle through component extraction, not CSS classes

**Alternatives considered:**
- CSS Modules: Rejected - Tailwind is already set up and more maintainable
- Styled Components: Rejected - adds runtime overhead, Tailwind is faster
- Plain CSS: Rejected - harder to maintain, no design system

### Decision 5: Accessibility Implementation
**What:** Build accessibility in from the start, not as an afterthought.

**Approach:**
- Use semantic HTML elements (header, nav, main, section, footer)
- Ensure proper heading hierarchy (h1 -> h2 -> h3)
- Add ARIA labels where semantic HTML isn't sufficient
- Test with keyboard navigation and screen readers
- Respect `prefers-reduced-motion` for animations
- Ensure color contrast meets WCAG AA standards

**Validation:**
- Playwright accessibility tests using `@axe-core/playwright`
- Manual keyboard navigation testing
- Manual screen reader testing (VoiceOver on macOS)

**Why:**
- Constitution requires WCAG 2.1 AA compliance
- Accessibility is easier to build in than retrofit
- Good accessibility improves UX for everyone
- Legal and ethical requirement

## Risks / Trade-offs

### Risk 1: Docker Compose complexity for E2E tests
**Risk:** Docker Compose setup might be complex for developers to run locally.

**Mitigation:**
- Provide clear documentation in README
- Add `pnpm test:e2e` script that handles all setup
- Use health checks to ensure services are ready before tests run
- Provide troubleshooting guide for common issues

### Risk 2: Reference design might not be fully responsive
**Risk:** The v0-generated design might have responsive issues we need to fix.

**Mitigation:**
- Test on multiple device sizes during implementation
- Use Tailwind's responsive utilities to fix issues
- Document any deviations from reference design with rationale

### Risk 3: Performance with animations
**Risk:** Heavy animations might impact Core Web Vitals.

**Mitigation:**
- Use CSS transforms and opacity for GPU acceleration
- Lazy load animations below the fold
- Test with Lighthouse and real devices
- Respect `prefers-reduced-motion` to disable animations when needed

### Risk 4: First frontend feature sets precedents
**Risk:** Patterns established here will influence all future web development.

**Mitigation:**
- Follow constitution principles strictly
- Document architectural decisions in this design.md
- Get team review before implementation
- Be willing to refactor if patterns prove problematic

## Migration Plan

**N/A** - This is a new feature, no migration needed.

**Rollout:**
1. Implement landing page components
2. Set up E2E testing infrastructure
3. Write tests first (TDD)
4. Implement components to pass tests
5. Deploy to staging for review
6. Deploy to production

**Rollback:**
- If critical issues found, revert to default Next.js page
- No data migration concerns (static content only)

## Open Questions

1. **Theme Toggle:** Should we implement dark/light mode toggle on landing page?
   - Reference design has theme toggle in footer
   - Decision: Implement basic toggle, defer full theme system to future work

2. **Analytics:** Do we want any privacy-respecting analytics on landing page?
   - Decision: Defer to future work, stay true to "Zero Tracking" promise for MVP

3. **Internationalization:** Should we plan for i18n from the start?
   - Decision: Defer to future work, English-only for MVP

4. **Content Management:** How will we update landing page content in future?
   - Decision: Hardcoded for MVP, consider CMS in future if needed

5. **API Integration:** Will landing page need any API calls?
   - Decision: No API calls for MVP (static content only), future features may need it
