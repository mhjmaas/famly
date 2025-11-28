# Design: AI Provider Selection

## Architecture Overview

### Data Model Changes
The `AISettings` interface in `apps/api/src/modules/family/domain/family-settings.ts` will be extended with a `provider` field:

```typescript
export interface AISettings {
  apiEndpoint: string;
  apiSecret: string; // Encrypted at rest (TODO)
  modelName: string;
  aiName: string;
  provider: "LM Studio" | "Ollama" | "OpenAI"; // NEW
}
```

This change propagates through:
- **UpdateFamilySettingsRequest**: adds optional `provider` field to request schema
- **FamilySettings** (stored document): includes provider in persisted `aiSettings` subdocument
- **FamilySettingsView** (API response): includes provider (safe to expose, not sensitive)
- **Validators**: Zod schema extended with provider enum validation

### Why This Approach
1. **Minimal footprint**: Single string field with fixed enum values; no complex nesting
2. **Backward compatible**: Existing settings without provider continue to work; new requests can include provider
3. **Type-safe**: TypeScript literals and Zod enum ensure only valid values are accepted
4. **Expressive**: Self-documenting; indicates intent and enables future provider-specific features

### API Contract
- **GET** `/v1/families/:familyId/settings` → includes `provider` in response if set
- **PUT** `/v1/families/:familyId/settings` → accepts optional `provider` in request body; updates if provided

### Web UI Changes
The `AISettingsTab` component gains a new `<select>` dropdown:
- Populated with three fixed options: "LM Studio", "Ollama", "OpenAI"
- Bound to state `aiSettings.provider`
- Included in validation (required if aiSettings are being configured)
- Synced to Redux thunk on save, sent to API

### Validation Strategy
- **Field is required**: If a family configures AI settings, they must select a provider
- **Enum constraint**: Only three valid values; enforced at Zod schema and UI
- **No format constraints**: Provider is a simple string choice, no URL or encryption needed

### Testing Approach
1. **Domain/Unit**: Zod schema validates provider enum values correctly
2. **Service/Integration**: Provider is persisted and retrieved correctly via repository
3. **API E2E**: GET/PUT routes correctly store and return provider in response
4. **Web E2E**: Dropdown renders, changes state, and sends provider to API on save

## Decision Log

### Q: Should provider be required or optional?
**A**: Required when configuring AI settings. If you're setting up a custom AI endpoint, you should declare which provider it is. Existing records without provider are acceptable (graceful degradation).

### Q: Should provider choices be extensible?
**A**: No. Fixed enum of three options for now. If new providers are needed, it's a design-time change (new OpenSpec change). Simplifies validation, testing, and UI.

### Q: Does this require data migration?
**A**: No explicit migration needed. New settings records will include provider; existing records can be lazily updated when next saved, or left as-is if the field is optional during reads.

### Q: What should be the default provider value?
**A**: `"LM Studio"` is chosen as the default because it aligns with Famly's privacy-first philosophy—it runs locally on the user's device without sending data to external cloud services. This demonstrates our commitment to user privacy while still allowing families to choose OpenAI or Ollama if they prefer.

## Backwards Compatibility
- **Old API clients**: Can still call GET/PUT without sending provider; field will be missing in their responses until they upgrade
- **Old UI**: Will need upgrade to show provider dropdown, but basic setting functionality remains intact
- **Database**: New field is additive; old documents without provider are still valid
