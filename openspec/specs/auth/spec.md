# auth Specification

## Purpose
TBD - created by archiving change add-user-profile-fields. Update Purpose after archive.
## Requirements
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

### Requirement: /v1/auth/me returns stored profile fields
The authenticated profile endpoint MUST surface the persisted name and birthdate for the signed-in user.

#### Scenario: /me returns name and birthdate
- **GIVEN** an authenticated user who has `name` and `birthdate` stored on their profile
- **WHEN** the client calls `GET /v1/auth/me`
- **THEN** the response includes `user.name` and `user.birthdate`
- **AND** the values match what was stored at registration or through profile updates

### Requirement: Creator ownership verification utility
The auth module MUST provide a reusable utility function to verify that a user is the creator of a resource, supporting both direct object checks and repository-based lookups.

#### Scenario: Verify creator ownership with direct createdBy check
- **GIVEN** a user ID and a resource with a `createdBy` field
- **WHEN** `requireCreatorOwnership` is called with the user ID and the resource's `createdBy` value
- **THEN** the function returns `true` if the user ID matches `createdBy`
- **AND** throws `HttpError.forbidden` with message "You do not have permission to access this resource" if the IDs do not match

#### Scenario: Verify creator ownership via repository lookup
- **GIVEN** a user ID, a resource ID, and a repository that can fetch the resource
- **WHEN** `requireCreatorOwnership` is called with a repository lookup function
- **THEN** the function fetches the resource from the repository
- **AND** returns `true` if the resource's `createdBy` matches the user ID
- **AND** throws `HttpError.notFound` if the resource does not exist
- **AND** throws `HttpError.forbidden` if the resource exists but `createdBy` does not match

#### Scenario: Handle missing resource in repository lookup
- **GIVEN** a user ID and a resource ID that does not exist in the repository
- **WHEN** `requireCreatorOwnership` is called with a repository lookup function that returns `null`
- **THEN** the function throws `HttpError.notFound` with an appropriate error message

### Requirement: Creator ownership Express middleware
The auth module MUST provide an Express middleware factory for route-level creator ownership authorization.

#### Scenario: Middleware authorizes creator access to their resource
- **GIVEN** an authenticated user accessing a route with a resource ID parameter
- **AND** a repository that can fetch the resource by ID
- **WHEN** the `authorizeCreatorOwnership` middleware executes
- **THEN** the middleware fetches the resource using the provided repository function
- **AND** calls `next()` without error if the authenticated user's ID matches the resource's `createdBy`

#### Scenario: Middleware blocks non-creator access
- **GIVEN** an authenticated user accessing a route with a resource ID parameter
- **AND** a repository that returns a resource created by a different user
- **WHEN** the `authorizeCreatorOwnership` middleware executes
- **THEN** the middleware calls `next(HttpError.forbidden)` with message "You do not have permission to access this resource"

#### Scenario: Middleware handles non-existent resources
- **GIVEN** an authenticated user accessing a route with a non-existent resource ID
- **AND** a repository that returns `null` for the given ID
- **WHEN** the `authorizeCreatorOwnership` middleware executes
- **THEN** the middleware calls `next(HttpError.notFound)`

#### Scenario: Middleware requires authentication
- **GIVEN** an unauthenticated request
- **WHEN** the `authorizeCreatorOwnership` middleware executes
- **THEN** the middleware calls `next(HttpError.unauthorized)` with message "Authentication required"

#### Scenario: Middleware validates resource ID parameter
- **GIVEN** an authenticated request with an invalid ObjectId in the resource ID parameter
- **WHEN** the `authorizeCreatorOwnership` middleware executes
- **THEN** the middleware calls `next(HttpError.badRequest)` with message "Invalid {paramName} format"

