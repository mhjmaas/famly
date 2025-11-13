## MODIFIED Requirements

### Requirement: Collect user profile fields during registration
The registration endpoint MUST require a display name and birthdate for every new account and persist them with the created user. In standalone deployment mode, registration MUST be blocked after onboarding is complete.

#### Scenario: Registration succeeds with name and birthdate
- **GIVEN** a registration payload containing `email`, `password`, `name`, and `birthdate` in ISO `YYYY-MM-DD` format
- **AND** either the deployment mode is 'saas' OR (deployment mode is 'standalone' AND onboarding is not complete)
- **WHEN** the client calls `POST /v1/auth/register`
- **THEN** the user record is created with the provided `name` and `birthdate`
- **AND** the 201 response includes `user.name` and `user.birthdate` matching the request payload

#### Scenario: Registration rejects missing birthdate
- **GIVEN** a registration payload that omits `birthdate`
- **WHEN** the client calls `POST /v1/auth/register`
- **THEN** the API responds with HTTP 400 and a validation message indicating `birthdate` is required

#### Scenario: Registration blocked in standalone mode after onboarding
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is complete (`onboardingCompleted=true`)
- **WHEN** the client calls `POST /v1/auth/register` with valid credentials
- **THEN** the API responds with HTTP 403
- **AND** the response body includes message "Registration is closed. Contact your family administrator to be added."

#### Scenario: Registration allowed in standalone mode before onboarding
- **GIVEN** the deployment mode is 'standalone'
- **AND** onboarding is not complete (`onboardingCompleted=false`)
- **WHEN** the client calls `POST /v1/auth/register` with valid credentials
- **THEN** the user record is created successfully
- **AND** the API responds with HTTP 201

#### Scenario: Registration always allowed in SaaS mode
- **GIVEN** the deployment mode is 'saas'
- **AND** onboarding state is any value
- **WHEN** the client calls `POST /v1/auth/register` with valid credentials
- **THEN** the user record is created successfully
- **AND** the API responds with HTTP 201
