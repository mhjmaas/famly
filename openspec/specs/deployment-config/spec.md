# deployment-config Specification

## Purpose
TBD - created by archiving change add-deployment-modes. Update Purpose after archive.
## Requirements
### Requirement: Deployment configuration storage
The system MUST persist deployment configuration in a MongoDB collection with mode and onboarding state.

#### Scenario: Deployment config document structure
- **GIVEN** the system is running
- **WHEN** the deployment config is stored
- **THEN** it contains fields: `_id`, `mode` ('saas' or 'standalone'), `onboardingCompleted` (boolean), `createdAt`, `updatedAt`
- **AND** the collection contains exactly one document (singleton pattern)

#### Scenario: Seed deployment config on startup
- **GIVEN** the API server starts
- **AND** no deployment config document exists
- **WHEN** the seeding logic runs
- **THEN** a deployment config document is created with `mode` from `DEPLOYMENT_MODE` env variable (default: 'saas')
- **AND** `onboardingCompleted` is set to `false`
- **AND** `createdAt` and `updatedAt` are set to current timestamp

#### Scenario: Skip seeding if config exists
- **GIVEN** the API server starts
- **AND** a deployment config document already exists
- **WHEN** the seeding logic runs
- **THEN** no new document is created
- **AND** the existing document is not modified

### Requirement: Status endpoint
The system MUST provide an unauthenticated endpoint that returns deployment mode and onboarding status.

#### Scenario: Status endpoint returns current state
- **GIVEN** the deployment config exists with `mode='standalone'` and `onboardingCompleted=false`
- **WHEN** a client calls `GET /v1/status`
- **THEN** the response is HTTP 200
- **AND** the response body is `{ "mode": "standalone", "onboardingCompleted": false }`

#### Scenario: Status endpoint does not require authentication
- **GIVEN** an unauthenticated client
- **WHEN** the client calls `GET /v1/status`
- **THEN** the response is HTTP 200
- **AND** the response includes mode and onboarding status

#### Scenario: Status endpoint in SaaS mode
- **GIVEN** the deployment config has `mode='saas'` and `onboardingCompleted=false`
- **WHEN** a client calls `GET /v1/status`
- **THEN** the response body is `{ "mode": "saas", "onboardingCompleted": false }`

### Requirement: Onboarding completion tracking
The system MUST mark onboarding as complete when the first family is created in standalone mode.

#### Scenario: Mark onboarding complete in standalone mode
- **GIVEN** the deployment mode is 'standalone'
- **AND** `onboardingCompleted` is `false`
- **WHEN** the first family is created via `POST /v1/families`
- **THEN** the deployment config is updated with `onboardingCompleted=true`
- **AND** `updatedAt` is set to the current timestamp

#### Scenario: Onboarding state unchanged in SaaS mode
- **GIVEN** the deployment mode is 'saas'
- **AND** `onboardingCompleted` is `false`
- **WHEN** a family is created via `POST /v1/families`
- **THEN** the deployment config `onboardingCompleted` remains `false`

#### Scenario: Onboarding state unchanged if already complete
- **GIVEN** the deployment mode is 'standalone'
- **AND** `onboardingCompleted` is `true`
- **WHEN** a family is created via `POST /v1/families`
- **THEN** the deployment config `onboardingCompleted` remains `true`

### Requirement: Environment variable configuration
The system MUST support a `DEPLOYMENT_MODE` environment variable to configure the deployment mode.

#### Scenario: Default to SaaS mode
- **GIVEN** the `DEPLOYMENT_MODE` environment variable is not set
- **WHEN** the API server starts
- **THEN** the deployment config is seeded with `mode='saas'`

#### Scenario: Standalone mode from environment
- **GIVEN** the `DEPLOYMENT_MODE` environment variable is set to 'standalone'
- **WHEN** the API server starts
- **THEN** the deployment config is seeded with `mode='standalone'`

#### Scenario: Reject invalid mode values
- **GIVEN** the `DEPLOYMENT_MODE` environment variable is set to an invalid value (not 'saas' or 'standalone')
- **WHEN** the API server starts
- **THEN** the server logs an error and fails to start

