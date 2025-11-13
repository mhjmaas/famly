## MODIFIED Requirements

### Requirement: Registration flow
The web application MUST provide a multi-step registration flow at `/get-started` that guides users through account creation and family setup. In standalone mode, the deployment selection step MUST be skipped.

#### Scenario: User accesses registration page
- **GIVEN** an unauthenticated user
- **WHEN** the user navigates to `/get-started`
- **THEN** the page displays deployment options (cloud-hosted and self-hosted) if mode is 'saas'
- **OR** the page skips to account creation step if mode is 'standalone'
- **AND** the page shows a progress indicator

#### Scenario: User selects cloud deployment in SaaS mode
- **GIVEN** a user on the deployment selection step
- **AND** the deployment mode is 'saas'
- **WHEN** the user selects "Cloud Hosted"
- **THEN** the application advances to the account creation step
- **AND** displays a form with fields for name, email, password, and password confirmation
- **AND** updates the progress indicator to show step 1 of 2

#### Scenario: Standalone mode skips deployment selection
- **GIVEN** a user navigating to `/get-started`
- **AND** the deployment mode is 'standalone'
- **WHEN** the page loads
- **THEN** the application displays the account creation step directly
- **AND** does not show deployment selection options
- **AND** updates the progress indicator appropriately

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

## ADDED Requirements

### Requirement: Onboarding flow in standalone mode
The web application MUST display an onboarding flow in standalone mode when onboarding is not complete, and redirect to the app when onboarding is complete.

#### Scenario: Standalone mode with incomplete onboarding shows registration
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is not complete
- **WHEN** an unauthenticated user visits the root path `/`
- **THEN** the application redirects to `/get-started`

#### Scenario: Standalone mode with complete onboarding redirects to app
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is complete
- **WHEN** an unauthenticated user visits the root path `/`
- **THEN** the application redirects to `/signin`

#### Scenario: Standalone mode with complete onboarding redirects authenticated users
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is complete
- **AND** the user is authenticated
- **WHEN** the user visits the root path `/`
- **THEN** the application redirects to `/app`
