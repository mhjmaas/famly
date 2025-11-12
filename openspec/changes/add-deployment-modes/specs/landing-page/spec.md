## ADDED Requirements

### Requirement: Conditional rendering based on deployment mode
The landing page MUST adapt its behavior based on deployment mode and onboarding status, skipping rendering in standalone mode when onboarding is complete.

#### Scenario: Landing page renders in SaaS mode
- **GIVEN** the deployment mode is 'saas'
- **WHEN** a user visits the root path `/`
- **THEN** the landing page renders with all sections (hero, features, privacy, pricing, navigation, footer)

#### Scenario: Landing page redirects in standalone mode with complete onboarding
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is complete
- **AND** the user is unauthenticated
- **WHEN** the user visits the root path `/`
- **THEN** the application redirects to `/signin`

#### Scenario: Landing page redirects authenticated users in standalone mode
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is complete
- **AND** the user is authenticated
- **WHEN** the user visits the root path `/`
- **THEN** the application redirects to `/app`

#### Scenario: Landing page redirects to onboarding in standalone mode
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is not complete
- **WHEN** a user visits the root path `/`
- **THEN** the application redirects to `/get-started`
