# Spec: AI Provider Field in Family Settings

## ADDED Requirements

### Requirement: AI Provider Field in Settings Domain
The `AISettings` interface SHALL include a `provider` field that specifies the AI service backend.

#### Scenario: Provider field is typed as enum
When defining the `AISettings` interface, the `provider` field is a TypeScript literal union of exactly three values:
```typescript
provider: "LM Studio" | "Ollama" | "OpenAI"
```

#### Scenario: Default AI settings includes provider
When creating default `AISettings`, the `provider` field is set to one of the three valid values (default: `"LM Studio"` for privacy-preserving local-first configuration).

---

### Requirement: Update Settings Request Schema
The `UpdateFamilySettingsRequest` SHALL include an optional `provider` field in the `aiSettings` sub-object.

#### Scenario: Zod schema validates provider enum
When a request body is validated against `updateFamilySettingsSchema`, the `aiSettings.provider` field (if present) must match one of: `"LM Studio"`, `"Ollama"`, or `"OpenAI"`. Invalid values are rejected with a validation error.

#### Scenario: Provider field is required within AI settings
When updating AI settings via the API, if `aiSettings` is provided, the `provider` field must be present and valid. Omitting `provider` while providing other `aiSettings` fields results in a validation error.

---

### Requirement: Persist and Retrieve Provider
The family settings repository and service SHALL correctly store and retrieve the `provider` field from the database.

#### Scenario: Repository persists provider to database
When `FamilySettingsRepository.updateSettings()` is called with `aiSettings` containing a `provider` value, the provider is stored in the MongoDB `family_settings` collection under `aiSettings.provider`.

#### Scenario: Service returns provider in settings view
When `FamilySettingsService.getSettings()` is called, the returned `FamilySettingsView` includes the `provider` field (if previously set). The field is not sensitive and may be returned to authorized API clients.

---

### Requirement: API Endpoint Exposes Provider
The GET and PUT endpoints for family settings SHALL include the `provider` field in their responses.

#### Scenario: GET /families/:familyId/settings returns provider
When a client calls `GET /v1/families/:familyId/settings`, the response includes `aiSettings.provider` if it has been set. If not set, the response includes a default value or omits the field (depending on implementation choice).

#### Scenario: PUT /families/:familyId/settings accepts and returns provider
When a client calls `PUT /v1/families/:familyId/settings` with a request body containing `aiSettings.provider`, the updated settings are persisted and the response includes the `provider` value.

---

## Reference Links
- **Domain**: `apps/api/src/modules/family/domain/family-settings.ts`
- **Validator**: `apps/api/src/modules/family/validators/family-settings.validator.ts`
- **Service**: `apps/api/src/modules/family/services/family-settings.service.ts`
- **Repository**: `apps/api/src/modules/family/repositories/family-settings.repository.ts`
- **GET Route**: `apps/api/src/modules/family/routes/get-settings.route.ts`
- **PUT Route**: `apps/api/src/modules/family/routes/update-settings.route.ts`
