# Tasks: AI Provider Selection Implementation

All tasks require:
- TDD: Write tests first, verify red state, implement to green
- Validation: Run relevant test suites before marking complete
- Code review: Changes follow project constitution and code style

---

## Backend Tasks

### Task 1: Add Provider Field to AISettings Domain
**Objective**: Extend the `AISettings` interface with `provider` field.

**Steps**:
1. Open `apps/api/src/modules/family/domain/family-settings.ts`
2. Add `provider: "LM Studio" | "Ollama" | "OpenAI"` to `AISettings` interface
3. Update `DEFAULT_AI_SETTINGS` constant to include `provider: "LM Studio"` as the default (privacy-first, local-first approach)
4. Update `UpdateFamilySettingsRequest` interface to include optional `provider` field in `aiSettings` sub-object
5. Run `pnpm --filter api test:unit` to verify no breaks in existing unit tests

**Validation**:
- TypeScript compiles without errors
- Existing unit tests pass
- New interface structure matches design.md

---

### Task 2: Update Zod Validator for Provider Field
**Objective**: Extend the `updateFamilySettingsSchema` to validate the `provider` enum.

**Steps**:
1. Open `apps/api/src/modules/family/validators/family-settings.validator.ts`
2. Add `provider` field to `aiSettingsSchema` Zod object with `.enum(["LM Studio", "Ollama", "OpenAI"])`
3. Make `provider` required within the `aiSettings` block (use `.refine()` if needed to enforce: if aiSettings is provided, provider must be present)
4. Update `UpdateFamilySettingsPayload` type inference to include provider
5. Write unit tests:
   - Valid provider values pass validation
   - Invalid provider values are rejected
   - Missing provider when aiSettings is provided fails validation
6. Run `pnpm --filter api test:unit` to verify

**Validation**:
- Zod validator correctly rejects invalid provider values
- Valid enum values pass
- Unit tests demonstrate all three scenarios

---

### Task 3: Update Family Settings Service
**Objective**: Ensure the service correctly handles the provider field in getSettings and updateSettings.

**Steps**:
1. Open `apps/api/src/modules/family/services/family-settings.service.ts`
2. Review `updateSettings()` method: confirm provider is passed through from input to repository call (no transformation needed)
3. No changes to `getSettings()` or `createDefaultSettings()` required—provider is already included via DEFAULT_AI_SETTINGS
4. Add/update unit tests:
   - updateSettings correctly persists provider
   - getSettings returns provider in FamilySettingsView
   - Default settings include default provider value
5. Run `pnpm --filter api test:unit` to verify

**Validation**:
- Service tests pass
- Provider flows through from request → service → repository → database

---

### Task 4: Verify Family Settings Repository Handles Provider
**Objective**: Confirm the repository's MongoDB operations correctly handle the new provider field.

**Steps**:
1. Open `apps/api/src/modules/family/repositories/family-settings.repository.ts`
2. Review `updateSettings()` and `createDefaultSettings()`: no code changes needed—MongoDB will naturally store provider as part of aiSettings subdocument
3. Add integration test (e2e test using Testcontainers):
   - Create a settings record with provider via updateSettings()
   - Retrieve it via findByFamilyId()
   - Verify provider field is correctly persisted and retrieved
4. Run `pnpm --filter api test:e2e --testPathPattern="family-settings"` (create this test file if needed)

**Validation**:
- E2E test passes
- Provider is persisted in MongoDB and correctly retrieved

---

### Task 5: Update Family Settings Mapper
**Objective**: Ensure `toFamilySettingsView()` includes provider in API responses.

**Steps**:
1. Open `apps/api/src/modules/family/lib/family-settings.mapper.ts`
2. Add `provider: settings.aiSettings.provider` to the returned `aiSettings` object in `toFamilySettingsView()`
3. Add unit test to verify provider is included in the mapped response
4. Run `pnpm --filter api test:unit` to verify

**Validation**:
- Provider field is present in FamilySettingsView
- Unit test confirms mapping

---

### Task 6: Verify API Routes (GET & PUT) Expose Provider
**Objective**: Confirm GET and PUT routes correctly expose provider in responses.

**Steps**:
1. Open `apps/api/src/modules/family/routes/get-settings.route.ts` and `update-settings.route.ts`
2. No code changes needed—routes already return the result of service/mapper, which now includes provider
3. Add/update API e2e tests:
   - PUT /families/:familyId/settings with aiSettings including provider → response includes provider
   - GET /families/:familyId/settings after PUT → returns provider
4. Run `pnpm --filter api test:e2e --testPathPattern="settings"` to verify

**Validation**:
- E2E tests pass
- API contracts include provider in requests and responses

---

## Web/Frontend Tasks

### Task 7: Add Provider Dropdown to AISettingsTab Component
**Objective**: Extend the `AISettingsTab` component with a provider select dropdown.

**Steps**:
1. Open `apps/web/src/components/settings/ai-settings-tab.tsx`
2. Add `provider` to the `aiSettings` state:
   ```typescript
   const [aiSettings, setAISettings] = useState({
     ...
     provider: settings?.aiSettings?.provider || "",
   });
   ```
3. Add a new form section with a `<select>` element:
   - Label: from `dict.aiSettingsTab.fields.provider.label`
   - Options: "LM Studio", "Ollama", "OpenAI"
   - onChange handler updates state
4. Update form validation in `handleSave()`:
   - Check that `aiSettings.provider` is selected if other aiSettings fields are provided
   - Add validation error to toast if provider is missing
5. Update the dispatch to `updateFamilySettingsThunk()` to include `provider` in the aiSettings object
6. Write component unit/snapshot tests:
   - Dropdown renders with correct options
   - Selected value is stored in state
   - Validation error shown if provider missing
7. Run `pnpm --filter web test:unit --testPathPattern="ai-settings"` to verify

**Validation**:
- Component renders dropdown correctly
- State management works
- Validation passes all scenarios
- Tests pass

---

### Task 8: Update Translation Dictionaries
**Objective**: Add localized strings for provider field labels and validation messages.

**Steps**:
1. Open `apps/web/src/dictionaries/en-US/dashboard/ai-settings.json`
2. Add provider field labels under `aiSettingsTab.fields.provider`:
   ```json
   "provider": {
     "label": "AI Provider",
     "placeholder": "Select your AI provider",
     "helper": "Choose which AI service backend you are using",
     "options": {
       "lmStudio": "LM Studio",
       "ollama": "Ollama",
       "openAI": "OpenAI"
     }
   }
   ```
3. Add validation message for missing provider under `toast`:
   ```json
   "providerRequired": "AI provider must be selected"
   ```
4. Repeat for `apps/web/src/dictionaries/nl-NL/dashboard/ai-settings.json` with Dutch translations
5. Verify dictionary type definitions are updated if needed
6. Run `pnpm --filter web test:unit` to verify no type issues

**Validation**:
- Translations added for both languages
- No TypeScript type errors
- Dictionary imports work

---

### Task 9: Update AI Settings Form E2E Tests
**Objective**: Add end-to-end tests for the new provider dropdown.

**Steps**:
1. Open `apps/web/tests/e2e/app/settings/ai-settings-form.spec.ts`
2. Add test scenario: "User selects provider and saves settings"
   - Navigate to AI settings page
   - Fill in existing fields (API endpoint, secret, model name, AI name)
   - Select provider from dropdown
   - Click save
   - Verify settings are saved via API call
   - Verify form shows saved provider value on reload
3. Add test scenario: "Form validation fails without provider selection"
   - Fill in other fields
   - Attempt to save without selecting provider
   - Verify validation error is displayed
4. Run `pnpm --filter web test:e2e --testPathPattern="ai-settings"` to verify

**Validation**:
- E2E tests pass
- Provider selection and validation work correctly

---

## Summary & Integration

### Task 10: Full Integration Test
**Objective**: Verify the complete feature works end-to-end.

**Steps**:
1. Ensure all previous tasks are complete and tests pass
2. Manually test the flow:
   - Open web app settings page
   - Navigate to AI settings tab
   - Fill in all fields including selecting a provider
   - Click save
   - Verify API call includes provider
   - Reload page and verify provider is still selected
3. Run full test suites:
   - `pnpm test:unit` (API)
   - `pnpm test:unit` (Web)
   - `pnpm test:e2e` (API)
   - `pnpm test:e2e` (Web) - at least ai-settings tests
4. Check lint: `pnpm lint`
5. Verify no console errors or warnings

**Validation**:
- All tests pass
- Manual testing confirms feature works
- No lint errors
- Ready for PR

---

## Sequencing Notes
- **Backend first (Tasks 1-6)**: Domain → Validators → Service → Repository → Mapper → Routes
  - Ensures API is fully functional before frontend touches it
  - Allows parallel web development while backend tests run
- **Frontend second (Tasks 7-9)**: Component → Dictionary → E2E Tests
  - Depends on backend being ready
  - Can be worked in parallel with Task 10
- **Integration last (Task 10)**: Full validation and manual testing
  - Confirms end-to-end flow before merging
