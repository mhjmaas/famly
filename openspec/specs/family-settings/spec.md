# family-settings Specification

## Purpose
TBD - created by archiving change enable-family-feature-toggles. Update Purpose after archive.
## Requirements
### Requirement: Families maintain feature toggle settings
Each family MUST have configurable settings that determine which features are enabled and optionally store AI integration configuration.

#### Scenario: Create default settings for new family
- **GIVEN** a newly created family with `familyId`
- **WHEN** the system initializes settings for this family
- **THEN** a settings document is created with all features enabled by default
- **AND** `enabledFeatures` contains `["tasks", "rewards", "shoppingLists", "recipes", "locations", "memories", "diary", "chat", "aiIntegration"]`
- **AND** `aiSettings` contains empty default values
- **AND** the document includes `createdAt` and `updatedAt` timestamps

### Requirement: Parents can retrieve family settings
Parents MUST be able to retrieve their family's current feature and AI configuration settings.

#### Scenario: Get settings returns enabled features and AI config
- **GIVEN** a parent authenticated with `familyId`
- **AND** settings exist for this family with some features enabled
- **WHEN** the parent calls `GET /v1/families/{familyId}/settings`
- **THEN** the API responds with HTTP 200
- **AND** the response includes `familyId`, `enabledFeatures` array, and `aiSettings` object
- **AND** `aiSettings.apiSecret` is omitted from the response for security

#### Scenario: Get settings returns defaults for missing settings
- **GIVEN** a parent authenticated with `familyId`
- **AND** no settings document exists for this family
- **WHEN** the parent calls `GET /v1/families/{familyId}/settings`
- **THEN** the API responds with HTTP 200
- **AND** the response includes all features enabled by default
- **AND** `aiSettings` contains empty default values

#### Scenario: Get settings rejects child role
- **GIVEN** a child member authenticated with `familyId`
- **WHEN** the child calls `GET /v1/families/{familyId}/settings`
- **THEN** the API responds with HTTP 403
- **AND** the response includes an error message indicating insufficient permissions

#### Scenario: Get settings validates family membership
- **GIVEN** a parent authenticated with `familyIdA`
- **WHEN** the parent calls `GET /v1/families/{familyIdB}/settings`
- **THEN** the API responds with HTTP 403 or HTTP 404
- **AND** the settings are not disclosed

### Requirement: Parents can update family settings
Parents MUST be able to update which features are enabled and configure AI integration settings for their family.

#### Scenario: Update settings with valid feature toggles
- **GIVEN** a parent authenticated with `familyId`
- **AND** existing settings for this family
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with `{ "enabledFeatures": ["tasks", "diary"], "aiSettings": { "apiEndpoint": "", "apiSecret": "", "modelName": "", "aiName": "Jarvis" } }`
- **THEN** the API responds with HTTP 200
- **AND** the response includes the updated `enabledFeatures` and `aiSettings`
- **AND** the `updatedAt` timestamp reflects the current time
- **AND** subsequent GET requests return the updated settings

#### Scenario: Update settings with all features disabled
- **GIVEN** a parent authenticated with `familyId`
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with `{ "enabledFeatures": [], "aiSettings": { "apiEndpoint": "", "apiSecret": "", "modelName": "", "aiName": "Jarvis" } }`
- **THEN** the API responds with HTTP 200
- **AND** the response includes empty `enabledFeatures` array
- **AND** subsequent GET requests return no enabled features

#### Scenario: Update settings with AI configuration
- **GIVEN** a parent authenticated with `familyId`
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with AI settings including `apiEndpoint`, `apiSecret`, `modelName`, and `aiName`
- **THEN** the API responds with HTTP 200
- **AND** the `apiSecret` is stored encrypted in the database
- **AND** subsequent GET requests omit the `apiSecret` value
- **AND** the AI configuration is persisted for the family

#### Scenario: Update settings creates document if missing
- **GIVEN** a parent authenticated with `familyId`
- **AND** no settings document exists for this family
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with valid settings
- **THEN** the API responds with HTTP 200
- **AND** a new settings document is created
- **AND** the `createdAt` and `updatedAt` timestamps are set

#### Scenario: Update settings rejects invalid feature keys
- **GIVEN** a parent authenticated with `familyId`
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with `{ "enabledFeatures": ["tasks", "invalidFeature"], "aiSettings": { ... } }`
- **THEN** the API responds with HTTP 400
- **AND** the response includes a validation error message indicating invalid feature key
- **AND** the settings remain unchanged

#### Scenario: Update settings rejects non-array feature format
- **GIVEN** a parent authenticated with `familyId`
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with `{ "enabledFeatures": "tasks", "aiSettings": { ... } }`
- **THEN** the API responds with HTTP 400
- **AND** the response includes a validation error message
- **AND** the settings remain unchanged

#### Scenario: Update settings validates AI endpoint URL format
- **GIVEN** a parent authenticated with `familyId`
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with `aiSettings.apiEndpoint` containing an invalid URL
- **THEN** the API responds with HTTP 400
- **AND** the response includes a validation error message
- **AND** the settings remain unchanged

#### Scenario: Update settings rejects child role
- **GIVEN** a child member authenticated with `familyId`
- **WHEN** the child calls `PUT /v1/families/{familyId}/settings` with any settings
- **THEN** the API responds with HTTP 403
- **AND** the response includes an error message indicating insufficient permissions
- **AND** the settings remain unchanged

#### Scenario: Update settings validates family membership
- **GIVEN** a parent authenticated with `familyIdA`
- **WHEN** the parent calls `PUT /v1/families/{familyIdB}/settings` with any settings
- **THEN** the API responds with HTTP 403 or HTTP 404
- **AND** the settings for `familyIdB` remain unchanged

### Requirement: Valid feature keys are strictly enforced
The system MUST only accept a predefined set of feature keys to prevent invalid or deprecated features from being stored.

#### Scenario: Feature key validation allows all valid features
- **GIVEN** the valid feature keys are `["tasks", "rewards", "shoppingLists", "recipes", "locations", "memories", "diary", "chat", "aiIntegration"]`
- **WHEN** a parent updates settings with any combination of these keys
- **THEN** the API accepts and stores the settings
- **AND** no validation errors occur

#### Scenario: Feature key validation rejects unknown keys
- **GIVEN** a feature key that is not in the valid list
- **WHEN** a parent attempts to enable this feature
- **THEN** the API responds with HTTP 400
- **AND** the error message identifies the invalid key

### Requirement: AI settings structure is validated
AI settings MUST conform to a specific structure with required fields when provided.

#### Scenario: AI settings require all fields when not empty
- **GIVEN** a parent provides partial AI settings with only `apiEndpoint`
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings`
- **THEN** the API responds with HTTP 400
- **AND** the error message indicates missing required AI settings fields

#### Scenario: AI settings allow empty configuration
- **GIVEN** a parent provides empty strings for all AI settings fields
- **WHEN** the parent calls `PUT /v1/families/{familyId}/settings` with `{ "enabledFeatures": [...], "aiSettings": { "apiEndpoint": "", "apiSecret": "", "modelName": "", "aiName": "Jarvis" } }`
- **THEN** the API responds with HTTP 200
- **AND** the empty AI settings are stored

### Requirement: Settings changes are audit-logged
All settings modifications MUST be logged with timestamp, user, and changed fields for audit purposes.

#### Scenario: Settings update logs change
- **GIVEN** a parent updates family settings
- **WHEN** the PUT request succeeds
- **THEN** the system logs the change with `userId`, `familyId`, `timestamp`, and summary of changes
- **AND** the log is accessible for audit purposes

