# Spec: AI Provider Dropdown in Web Settings UI

## ADDED Requirements

### Requirement: Provider Dropdown in AI Settings Tab
The `AISettingsTab` component SHALL include a dropdown (select) input for selecting the AI provider.

#### Scenario: Dropdown renders with three options
When the `AISettingsTab` component is rendered, a labeled `<select>` element is visible with three options:
- "LM Studio"
- "Ollama"
- "OpenAI"

The label clearly indicates this is for selecting the AI provider.

#### Scenario: Dropdown bound to component state
When the user changes the dropdown value, the selected provider is stored in component state (`aiSettings.provider`) and reflected in the UI immediately.

#### Scenario: Initial value loaded from settings prop
When the component mounts, if `settings?.aiSettings?.provider` exists, the dropdown is pre-selected to that value. Otherwise, it defaults to an empty or first-option selection.

---

### Requirement: Provider Field in Form Submission
The provider value SHALL be included in the API request when the user saves AI settings.

#### Scenario: Provider included in save request
When the user clicks the "Save" button and the form is valid, the `updateFamilySettingsThunk` is dispatched with an `aiSettings` object that includes:
```typescript
{
  apiEndpoint: string,
  apiSecret: string,
  modelName: string,
  aiName: string,
  provider: "LM Studio" | "Ollama" | "OpenAI"
}
```

#### Scenario: Provider field is required for validation
When validating the form before save, if `aiSettings` fields (e.g., `apiEndpoint`, `modelName`) are filled in, the `provider` field must also be selected. If `provider` is empty/null, the save is blocked with a validation error message.

---

### Requirement: Provider in Validation and Error Handling
Form validation SHALL ensure provider is selected when saving AI settings.

#### Scenario: Validation error for missing provider
If the user attempts to save without selecting a provider (even if other fields are filled), a toast error is shown with a message like "Provider is required" or "Please select an AI provider."

#### Scenario: Invalid provider value is rejected
If somehow an invalid provider value appears in state (not one of the three valid options), the validation rejects it and shows an appropriate error.

---

### Requirement: Localization Support
Provider labels and validation messages SHALL support multiple languages via dictionary injection.

#### Scenario: Provider field label is localized
The dropdown label, options, and helper text are sourced from the `dict` prop passed to `AISettingsTab`. The expected structure is:
```typescript
dict.aiSettingsTab.fields.provider = {
  label: string,
  placeholder: string,
  helper: string,
  options: {
    lmStudio: string,
    ollama: string,
    openAI: string
  }
}
```

#### Scenario: Validation messages are localized
Validation error messages (e.g., "Provider is required") are included in the `dict.toast` messages and displayed appropriately in the user's language.

---

## Reference Links
- **Component**: `apps/web/src/components/settings/ai-settings-tab.tsx`
- **API Integration**: `apps/web/src/store/slices/settings.slice.ts` (updateFamilySettingsThunk)
- **Dictionary Files**:
  - `apps/web/src/dictionaries/en-US/dashboard/ai-settings.json`
  - `apps/web/src/dictionaries/nl-NL/dashboard/ai-settings.json`
- **Tests**: `apps/web/tests/e2e/app/settings/ai-settings-form.spec.ts`
