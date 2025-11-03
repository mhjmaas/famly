## ADDED Requirements

### Requirement: Sign-in page
The web application MUST provide a sign-in page at `/signin` that allows users to authenticate with email and password.

#### Scenario: User accesses sign-in page
- **GIVEN** an unauthenticated user
- **WHEN** the user navigates to `/signin`
- **THEN** the page displays a sign-in form with email and password fields
- **AND** the form includes a "Sign In" button
- **AND** the page includes a link to the registration flow at `/get-started`

#### Scenario: User submits valid credentials
- **GIVEN** an unauthenticated user on the `/signin` page
- **WHEN** the user enters valid email and password
- **AND** submits the form
- **THEN** the application calls `POST /v1/auth/login` with the credentials
- **AND** stores the session cookie returned by the API
- **AND** redirects the user to `/app`

#### Scenario: User submits invalid credentials
- **GIVEN** an unauthenticated user on the `/signin` page
- **WHEN** the user enters invalid credentials
- **AND** submits the form
- **THEN** the application displays an error message
- **AND** the user remains on the `/signin` page

#### Scenario: Authenticated user accesses sign-in page
- **GIVEN** an authenticated user with a valid session cookie
- **WHEN** the user navigates to `/signin`
- **THEN** the application redirects the user to `/app`

### Requirement: Registration flow
The web application MUST provide a multi-step registration flow at `/get-started` that guides users through account creation and family setup.

#### Scenario: User accesses registration page
- **GIVEN** an unauthenticated user
- **WHEN** the user navigates to `/get-started`
- **THEN** the page displays deployment options (cloud-hosted and self-hosted)
- **AND** the page shows a progress indicator

#### Scenario: User selects cloud deployment
- **GIVEN** a user on the deployment selection step
- **WHEN** the user selects "Cloud Hosted"
- **THEN** the application advances to the account creation step
- **AND** displays a form with fields for name, email, password, and password confirmation
- **AND** updates the progress indicator to show step 1 of 2

#### Scenario: User creates account successfully
- **GIVEN** a user on the account creation step
- **WHEN** the user fills in name, email, password, and password confirmation
- **AND** submits the form
- **THEN** the application calls `POST /v1/auth/register` with the user data
- **AND** stores the session cookie returned by the API
- **AND** advances to the family creation step
- **AND** updates the progress indicator to show step 2 of 2

#### Scenario: User enters mismatched passwords
- **GIVEN** a user on the account creation step
- **WHEN** the user enters different values for password and password confirmation
- **AND** submits the form
- **THEN** the application displays an error message indicating passwords do not match
- **AND** does not call the registration API
- **AND** the user remains on the account creation step

#### Scenario: User creates family successfully
- **GIVEN** an authenticated user on the family creation step
- **WHEN** the user enters a family name
- **AND** submits the form
- **THEN** the application calls `POST /v1/families` with the family name
- **AND** redirects the user to `/app`

#### Scenario: Authenticated user accesses registration page
- **GIVEN** an authenticated user with a valid session cookie
- **WHEN** the user navigates to `/get-started`
- **THEN** the application redirects the user to `/app`

### Requirement: Protected app route
The web application MUST protect the `/app` route and all sub-routes, ensuring only authenticated users can access them.

#### Scenario: Authenticated user accesses app
- **GIVEN** an authenticated user with a valid session cookie
- **WHEN** the user navigates to `/app` or any sub-route
- **THEN** the application allows access
- **AND** renders the requested page

#### Scenario: Unauthenticated user accesses app
- **GIVEN** an unauthenticated user without a session cookie
- **WHEN** the user navigates to `/app` or any sub-route
- **THEN** the application redirects the user to `/signin`

#### Scenario: App page displays placeholder content
- **GIVEN** an authenticated user
- **WHEN** the user accesses `/app`
- **THEN** the page displays "app goes here" text as a placeholder

### Requirement: Middleware-based route protection
The web application MUST use Next.js middleware to enforce authentication rules across all routes.

#### Scenario: Middleware protects app routes
- **GIVEN** a request to any route under `/app`
- **WHEN** the middleware executes
- **THEN** it checks for the presence of a session cookie
- **AND** redirects to `/signin` if no valid session cookie exists
- **AND** allows the request to proceed if a valid session cookie exists

#### Scenario: Middleware redirects authenticated users from auth pages
- **GIVEN** a request to `/signin` or `/get-started`
- **WHEN** the middleware executes
- **AND** a valid session cookie exists
- **THEN** it redirects the user to `/app`

#### Scenario: Middleware excludes static assets
- **GIVEN** a request to static assets (images, fonts, API routes)
- **WHEN** the middleware executes
- **THEN** it does not perform authentication checks
- **AND** allows the request to proceed immediately

### Requirement: Design system consistency
The web application MUST apply the design system from the reference implementation, including color palette, typography, and component styling.

#### Scenario: Auth pages use reference color palette
- **GIVEN** any authentication page (`/signin`, `/get-started`)
- **WHEN** the page renders
- **THEN** it uses the color tokens defined in the reference CSS
- **AND** applies the same background, foreground, primary, and accent colors

#### Scenario: Auth forms use shadcn/ui components
- **GIVEN** any authentication form
- **WHEN** the form renders
- **THEN** it uses shadcn/ui components (Card, Input, Label, Button, Alert)
- **AND** components are styled with Tailwind CSS matching the design system

#### Scenario: Registration flow shows progress indicator
- **GIVEN** a user in the registration flow
- **WHEN** the user is on the account creation or family creation step
- **THEN** the page displays a progress bar showing current step and total steps
- **AND** the progress bar uses the design system's primary color

### Requirement: API integration
The web application MUST integrate with the existing backend authentication API endpoints.

#### Scenario: Login calls backend API
- **GIVEN** a user submitting the sign-in form
- **WHEN** the form is submitted
- **THEN** the application makes a `POST` request to `/v1/auth/login`
- **AND** includes `email` and `password` in the request body
- **AND** includes `credentials: 'include'` to forward cookies

#### Scenario: Registration calls backend API
- **GIVEN** a user submitting the account creation form
- **WHEN** the form is submitted
- **THEN** the application makes a `POST` request to `/v1/auth/register`
- **AND** includes `name`, `email`, `password`, and `birthdate` in the request body
- **AND** includes `credentials: 'include'` to forward cookies

#### Scenario: Family creation calls backend API
- **GIVEN** an authenticated user submitting the family creation form
- **WHEN** the form is submitted
- **THEN** the application makes a `POST` request to `/v1/families`
- **AND** includes the family name in the request body
- **AND** includes `credentials: 'include'` to forward the session cookie

#### Scenario: API errors are displayed to user
- **GIVEN** any API call fails with an error response
- **WHEN** the error is received
- **THEN** the application displays a user-friendly error message
- **AND** does not navigate away from the current form
