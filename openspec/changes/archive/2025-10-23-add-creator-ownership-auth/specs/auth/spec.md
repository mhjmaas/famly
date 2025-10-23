# auth Spec Delta

## ADDED Requirements

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
