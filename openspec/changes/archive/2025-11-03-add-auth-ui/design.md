## Context

The Famly web application needs authentication UI to allow users to sign in and register. The backend API already provides authentication endpoints via Better Auth (`POST /v1/auth/login`, `POST /v1/auth/register`), and the reference design in `reference/v0-famly` demonstrates the desired UX and visual design.

This change introduces the frontend authentication layer using Next.js 16 App Router with middleware-based route protection.

## Goals / Non-Goals

**Goals:**
- Implement sign-in and registration flows matching the reference design
- Protect `/app` routes using Next.js 16 middleware best practices
- Use shadcn/ui components for consistency with the design system
- Integrate with existing backend authentication API
- Support multi-step registration (account creation → family creation)
- Apply the reference color palette and design tokens

**Non-Goals:**
- Implementing password reset or email verification (future work)
- Social authentication providers (future work)
- Two-factor authentication (future work)
- Mobile-specific authentication flows

## Decisions

### Decision: Use Next.js Middleware for Route Protection
**Rationale:** Next.js 16 middleware provides edge-runtime route protection that runs before page rendering, enabling efficient authentication checks and redirects. This is the recommended approach per Next.js documentation.

**Implementation:**
- Create `middleware.ts` at project root
- Check for session cookie on protected routes
- Redirect unauthenticated users to `/signin`
- Redirect authenticated users away from auth pages to `/app`

**Alternatives considered:**
- Client-side route guards: Rejected due to flash of unauthenticated content
- Server Components with redirect: Less efficient than middleware for auth checks

### Decision: Cookie-Based Session Management
**Rationale:** The backend API sets session cookies via Better Auth. The web app will read these cookies to determine authentication state.

**Implementation:**
- Backend sets `better-auth.session_token` cookie on login/register
- Middleware reads cookie to verify authentication
- No client-side token storage needed

**Alternatives considered:**
- localStorage tokens: Rejected due to XSS vulnerability and SSR incompatibility
- Server-side session verification: Adds latency; cookie presence is sufficient for route protection

### Decision: Multi-Step Registration Flow
**Rationale:** The reference design shows a three-step onboarding: deployment choice → account creation → family creation. This provides better UX than a single long form.

**Implementation:**
- Step 1: Choose deployment (cloud/self-hosted) - for MVP, only cloud proceeds
- Step 2: Create account (`POST /v1/auth/register`)
- Step 3: Create family (`POST /v1/families`)
- Progress indicator shows current step

**Alternatives considered:**
- Single-step registration: Rejected due to poor UX for complex onboarding
- Separate family creation after login: Rejected; family is core to the app experience

### Decision: Fetch API with Proxy Pattern
**Rationale:** Direct fetch calls to the backend API with proper error handling and cookie forwarding.

**Implementation:**
- Create `lib/api-client.ts` utility for API calls
- Use `credentials: 'include'` for cookie forwarding
- Handle API errors consistently across forms

**Alternatives considered:**
- React Query/SWR: Overkill for simple form submissions
- Server Actions: Not suitable for authentication flows that need client-side state

### Decision: shadcn/ui Components
**Rationale:** shadcn/ui provides accessible, customizable components that match the reference design aesthetic. Already used in the reference implementation.

**Components needed:**
- Card, Input, Label, Button, Alert, Progress
- All components styled with Tailwind CSS matching the color palette

**Alternatives considered:**
- Custom components: More work, less accessibility guarantees
- Other UI libraries: Don't match the design system

## Risks / Trade-offs

**Risk: Session cookie not set correctly**
- Mitigation: Test cookie setting in e2e tests; verify `Set-Cookie` headers from API

**Risk: Middleware performance impact**
- Mitigation: Middleware runs on edge; minimal latency. Use matcher to exclude static assets

**Trade-off: Client-side routing vs. full page redirects**
- Decision: Use Next.js router for smooth transitions, but middleware redirects are full-page
- Impact: Acceptable; auth redirects are infrequent

**Risk: Design drift from reference**
- Mitigation: Extract color tokens from reference CSS; use exact values in Tailwind config

## Migration Plan

No migration needed - this is net-new functionality. Users will access the new auth pages immediately upon deployment.

## Open Questions

None - all design decisions are clear based on reference implementation and Next.js 16 best practices.
