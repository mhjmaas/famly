## 1. Setup and Configuration
- [ ] 1.1 Extract color palette from reference CSS and add to Tailwind config
- [ ] 1.2 Install required shadcn/ui components (Card, Input, Label, Button, Alert, Progress)
- [ ] 1.3 Create API client utility in `src/lib/api-client.ts` with error handling

## 2. Middleware Implementation
- [ ] 2.1 Create `middleware.ts` at project root with route protection logic
- [ ] 2.2 Implement session cookie check for `/app/*` routes
- [ ] 2.3 Implement redirect logic for authenticated users on auth pages
- [ ] 2.4 Configure matcher to exclude static assets and API routes
- [ ] 2.5 Write unit tests for middleware logic

## 3. Sign-In Page
- [ ] 3.1 Create `/signin/page.tsx` with layout matching reference design
- [ ] 3.2 Create `SignInForm` component with email and password fields
- [ ] 3.3 Implement form validation (required fields, email format)
- [ ] 3.4 Integrate with `POST /v1/auth/login` API endpoint
- [ ] 3.5 Handle success (redirect to `/app`) and error states
- [ ] 3.6 Add link to registration flow
- [ ] 3.7 Write e2e tests for sign-in flow

## 4. Registration Flow
- [ ] 4.1 Create `/get-started/page.tsx` with multi-step layout
- [ ] 4.2 Create `GetStartedFlow` component with step state management
- [ ] 4.3 Implement deployment selection step (cloud/self-hosted options)
- [ ] 4.4 Implement account creation step with form fields (name, email, password, birthdate, confirm password)
- [ ] 4.5 Add password matching validation
- [ ] 4.6 Integrate with `POST /v1/auth/register` API endpoint
- [ ] 4.7 Implement family creation step with family name field
- [ ] 4.8 Integrate with `POST /v1/families` API endpoint
- [ ] 4.9 Add progress indicator showing current step
- [ ] 4.10 Handle API errors at each step
- [ ] 4.11 Write e2e tests for complete registration flow

## 5. Protected App Route
- [ ] 5.1 Create `/app/page.tsx` with placeholder content
- [ ] 5.2 Add "app goes here" text as specified
- [ ] 5.3 Verify middleware protection works for `/app` route
- [ ] 5.4 Write e2e tests for protected route access

## 6. Shared Components and Utilities
- [ ] 6.1 Create reusable form components if needed (error display, loading states)
- [ ] 6.2 Create session utility functions for cookie management
- [ ] 6.3 Ensure all components use design system tokens consistently

## 7. Testing and Validation
- [ ] 7.1 Run all e2e tests and verify they pass
- [ ] 7.2 Test authentication flow end-to-end manually
- [ ] 7.3 Verify design matches reference pixel-perfect
- [ ] 7.4 Test error handling for all API failure scenarios
- [ ] 7.5 Verify middleware redirects work correctly
- [ ] 7.6 Test with different viewport sizes (mobile, tablet, desktop)
- [ ] 7.7 Run `pnpm run lint` and fix any issues
