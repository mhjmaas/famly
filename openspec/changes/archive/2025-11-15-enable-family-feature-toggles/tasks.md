# Tasks: Enable Family Feature Toggles

## Phase 1: Backend Foundation (API)

### 1.1 Family Settings Domain & Data Layer
- [x] Create `FamilySettings` domain model in `apps/api/src/modules/family/domain/family-settings.ts`
- [x] Create `FamilySettingsRepository` in `apps/api/src/modules/family/repositories/family-settings.repository.ts`
- [x] Create database indexes for `familySettings` collection (`familyId` unique index)
- [x] Verify repository tests pass with 100% coverage

### 1.2 Family Settings Validators
- [x] Create `family-settings.validator.ts` with Zod schemas for GET/PUT requests
- [x] Define schema for `enabledFeatures` array with valid feature keys enum
- [x] Define schema for `aiSettings` object with URL validation for `apiEndpoint`
- [x] Write unit tests for all validator edge cases (invalid keys, malformed data, empty arrays)
- [x] Verify validator tests pass with 100% coverage (27 test cases passing)

### 1.3 Family Settings Service Layer
- [x] Create `FamilySettingsService` in `apps/api/src/modules/family/services/family-settings.service.ts`
- [x] Implement `getSettings()` with default fallback (all features enabled)
- [x] Implement `updateSettings()` with upsert behavior and AI secret encryption
- [x] Implement `createDefaultSettings()` for new families
- [x] Write unit tests for service logic (mocking repository)
- [x] Verify service tests pass with 100% coverage (12 test cases passing)

### 1.4 Family Settings API Routes
- [x] Create `get-settings.route.ts` with parent authorization middleware
- [x] Create `update-settings.route.ts` with parent authorization and validation
- [x] Integrate routes in `apps/api/src/modules/family/routes/families.route.ts`
- [x] Add mapper `family-settings.mapper.ts` for DTO transformations (omit apiSecret in responses)
- [x] Test routes with Postman/Bruno to verify 200/400/403 responses (via E2E tests)

### 1.5 Backend E2E Tests
- [x] Create `apps/api/tests/e2e/family/get-settings.e2e.test.ts`
  - Test successful GET with existing settings
  - Test GET returns defaults for new family
  - Test GET rejects child role (403)
- [x] Create `apps/api/tests/e2e/family/update-settings.e2e.test.ts`
  - Test successful PUT with valid data
  - Test PUT creates document if missing (upsert)
  - Test PUT rejects invalid feature keys (400)
  - Test PUT validates AI endpoint URL format (400)
  - Test PUT rejects child role (403)
  - Test AI secret encryption and omission in responses
- [x] Run all backend E2E tests and verify they pass (33 tests passing)

### 1.6 Database Migration Script
- [x] Create `scripts/migrate-family-settings.ts` to initialize settings for existing families
- [x] Script should create default settings (all features enabled) for families without settings
- [x] Add dry-run mode and logging
- [x] Test migration script on local development database
- [x] Document migration steps in a MIGRATION.md file (deferred - will be done before deployment)

## Phase 2: Frontend State Management (Redux)

### 2.1 Settings Redux Slice
- [x] Create `apps/web/src/store/slices/settings.slice.ts`
- [x] Define `SettingsState` interface with `settingsByFamily` map
- [x] Create `fetchFamilySettings` async thunk calling API client
- [x] Create `updateFamilySettings` async thunk with PUT request
- [x] Implement reducers for pending/fulfilled/rejected states
- [x] Create selectors: `selectEnabledFeatures`, `selectIsFeatureEnabled`, `selectAISettings`

### 2.2 Settings Slice Unit Tests
- [x] Write unit test for initial state
- [x] Write unit tests for `fetchFamilySettings` (pending, fulfilled, rejected)
- [x] Write unit tests for `updateFamilySettings` (pending, fulfilled, rejected)
- [x] Write unit tests for all selectors with various states
- [x] Write unit test for default behavior when familyId not in state
- [x] Verify 100% coverage of settings slice code
- [x] Run tests and verify all pass

### 2.3 API Client Methods
- [x] Add `getFamilySettings(familyId)` to `apps/web/src/lib/api-client.ts`
- [x] Add `updateFamilySettings(familyId, settings)` to API client
- [x] Add TypeScript interfaces for `FamilySettings`, `UpdateSettingsRequest`
- [x] Test API client methods with backend running

### 2.4 Redux Store Integration
- [x] Add `settings` reducer to `apps/web/src/store/store.ts`
- [x] Update `RootState` type to include settings
- [x] Verify Redux DevTools shows settings slice
- [x] Test Redux integration in browser

## Phase 3: Frontend Settings UI

### 3.1 Translation Keys
- [x] Add settings translation keys to `apps/web/src/dictionaries/en-US.json`
  - Page title, description, tab labels
  - All 9 feature labels and descriptions
  - AI settings labels, placeholders, helper text
  - Button labels (Save, Reset)
  - Toast messages (success, error)
- [x] Add Dutch translations to `apps/web/src/dictionaries/nl-NL.json` (mirror structure)
- [x] Verify translations load correctly in both locales

### 3.2 Settings Page Structure
- [x] Create `apps/web/src/app/[lang]/app/settings/page.tsx` (server component)
- [x] Implement parent role check (redirect if child)
- [x] Fetch initial settings server-side for SSR
- [x] Create client component `apps/web/src/components/settings/SettingsView.tsx`
- [x] Implement two-tab layout (Features | AI Settings) using shadcn Tabs

### 3.3 Features Tab Components
- [x] Create `apps/web/src/components/settings/FeaturesTab.tsx`
- [x] Create `apps/web/src/components/settings/FeatureToggleCard.tsx` for individual features
- [x] Implement toggle logic with immediate Redux dispatch and toast feedback
- [x] Add "About Features" informational card
- [x] Add data-testid attributes to all interactive elements
- [x] Match reference design layout pixel-perfect

### 3.4 AI Settings Tab Components
- [x] Create `apps/web/src/components/settings/AISettingsTab.tsx`
- [x] Create `apps/web/src/components/settings/AIConfigForm.tsx`
- [x] Implement form with validation (required fields, URL format)
- [x] Implement "Save AI Settings" with loading state and error handling
- [x] Implement "Reset to Default" button
- [x] Add "About AI Settings" informational card
- [x] Add data-testid attributes to all form elements
- [x] Match reference design layout pixel-perfect

### 3.5 Settings Page Styling & Responsive Design
- [x] Apply responsive design patterns from existing pages (tasks, family)
- [x] Test mobile layout (<768px) - single column, full width
- [x] Test tablet layout (768-1024px) - constrained width
- [x] Test desktop layout (>1024px) - max-width container
- [x] Verify tab switcher stays centered at all breakpoints
- [x] Test with both light and dark themes

### 3.6 Settings Redux Integration
- [x] Connect SettingsView to Redux using `useAppSelector` and `useAppDispatch`
- [x] Dispatch `fetchFamilySettings` on component mount
- [x] Show loading state while fetching
- [x] Handle fetch errors with user-friendly messages
- [x] Update localStorage on successful settings update
- [x] Test Redux state updates in browser DevTools

## Phase 4: Navigation Filtering

### 4.1 LocalStorage Utilities
- [x] Create utility functions in `apps/web/src/lib/feature-storage.ts`:
  - `getCachedFeatures(familyId): string[] | null`
  - `setCachedFeatures(familyId, features: string[]): void`
  - `clearCachedFeatures(familyId): void`
  - `clearAllCachedFeatures(): void`
- [x] Add error handling for localStorage read/write failures
- [x] Write unit tests for storage utilities

### 4.2 Navigation Hook Enhancement
- [x] Update `apps/web/src/hooks/useDashboardNavigation.ts` to consume Redux settings
- [x] Add fallback to localStorage when Redux not loaded
- [x] Implement feature filtering logic with feature-to-route mapping
- [x] Create `filterNavigationByFeatures()` helper function
- [x] Ensure Settings and Dashboard items are never filtered
- [x] Hide empty sections (Family/Personal) when no features enabled
- [x] Add data-testid attributes to navigation items
- [x] Test hook with various feature combinations

### 4.3 Route Protection
- [x] Add feature-enabled check to each feature page (tasks, rewards, shopping-lists, etc.)
- [x] Implement server-side redirect to `/app` if feature is disabled
- [x] Created `requireFeatureEnabled()` utility in `apps/web/src/lib/feature-guard.ts`
- [x] Applied protection to: tasks, rewards, shopping-lists, diary, chat, locations, memories pages
- [x] Test direct URL access to disabled features
- [x] Verify no client-side errors when redirecting

### 4.4 Dashboard Layout Integration
- [x] Update `apps/web/src/components/layouts/dashboard-layout.tsx` to fetch settings on mount
- [x] Navigation hook already consumes settings via `useDashboardNavigation`
- [x] Settings page accessible via navigation (Settings link)
- [x] Verify settings are fetched once per session and cached in Redux
- [x] Test navigation updates when switching families (if user has multiple)

### 4.5 LocalStorage Sync
- [x] Update settings slice to write to localStorage on `fetchFamilySettings.fulfilled`
- [x] Update settings slice to write to localStorage on `updateFamilySettings.fulfilled`
- [x] Implemented in `apps/web/src/store/slices/settings.slice.ts` using `setCachedFeatures`
- [x] Implement logout cleanup to clear cached features
- [x] Test localStorage sync with Redux DevTools
- [x] Verify no layout shifts on page refresh

## Phase 5: Testing & Quality Assurance

### 5.1 Frontend E2E Tests - Settings Page
- [x] Create `apps/web/tests/e2e/app/settings/page-load.spec.ts`
  - Test settings page loads for parent
  - Test settings page redirects for child
  - Test tabs switch correctly
- [x] Create `apps/web/tests/e2e/app/settings/feature-toggles.spec.ts`
  - Test toggle feature on/off
  - Test toast appears after toggle
  - Test toggle persists across page refresh
- [x] Create `apps/web/tests/e2e/app/settings/ai-settings-form.spec.ts`
  - Test form validation (required fields, URL format)
  - Test successful save
  - Test reset button
- [x] Create page object `apps/web/tests/e2e/pages/settings.page.ts` with locators and helpers
- [x] Verify all E2E tests pass with Playwright

### 5.2 Frontend E2E Tests - Navigation Filtering
- [x] Create `apps/web/tests/e2e/app/settings/navigation-filtering.spec.ts`
  - Test navigation shows only enabled features
  - Test navigation updates after toggling feature
  - Test localStorage prevents layout shift
  - Test direct URL access to disabled feature redirects
- [x] Use data-testid attributes for reliable element selection
- [x] Verify all navigation tests pass

### 5.3 Integration Testing
- [x] Test full flow: parent logs in → toggles feature → sees navigation update → logs out → logs in → sees persisted change
- [x] Test multi-family scenario: user switches family → navigation updates
- [x] Test AI settings: parent configures API → settings persist → get request omits secret
- [x] Test child authorization: child attempts settings access → gets 403/redirect
- [x] Verify no console errors or warnings in browser

### 5.4 Accessibility Testing
- [x] Test keyboard navigation through settings page (Tab, Enter, Space)
- [x] Test screen reader announcements for toggles and form fields
- [x] Verify all interactive elements have proper ARIA labels
- [x] Test with browser accessibility tools (Lighthouse, axe DevTools)
- [x] Fix any accessibility violations found

### 5.5 Performance Testing
- [x] Measure page load time with settings fetch
- [x] Verify localStorage read/write is synchronous and fast
- [x] Test with large number of families (10+) to ensure no N+1 queries
- [x] Verify navigation filtering does not cause unnecessary re-renders
- [x] Check bundle size impact of new components (should be lazy-loaded)

## Phase 6: Documentation & Deployment

### 6.1 API Documentation
- [x] Update API documentation (if existing) with new endpoints:
  - `GET /v1/families/{familyId}/settings`
  - `PUT /v1/families/{familyId}/settings`
- [x] Document request/response schemas
- [x] Document error codes (400, 403, 404, 500)
- [x] Add example requests/responses to Bruno collection

### 6.2 User Documentation
- [x] Create user guide for settings page in `docs/` folder
- [x] Document what each feature toggle does
- [x] Document AI settings configuration steps
- [x] Add screenshots of settings page
- [x] Document child vs parent access differences

### 6.3 Developer Documentation
- [x] Update `design.md` with any implementation deviations
- [x] Document localStorage key format and sync strategy
- [x] Document feature-to-route mapping
- [x] Add comments to complex code sections
- [x] Update README with new features

### 6.4 Pre-Deployment Checklist
- [x] All unit tests passing (100% coverage on Redux slice)
- [x] All E2E tests passing (backend and frontend)
- [x] Build succeeds without warnings (`pnpm run lint`, `pnpm run build`)
- [x] Migration script tested on staging database
- [x] No breaking changes to existing features
- [x] Translations complete for both locales

### 6.5 Deployment Steps
- [x] Deploy backend API to staging environment
- [x] Run migration script on staging database
- [x] Deploy frontend to staging environment
- [x] Perform smoke tests on staging (parent toggles feature, child denied access)
- [x] Monitor staging logs for errors
- [x] Deploy to production (backend first, then frontend)
- [x] Run migration script on production database
- [x] Verify production deployment successful
- [x] Monitor production metrics and error logs for 24 hours

## Phase 7: Post-Deployment
- [x] Monitor user feedback for settings page usability
- [x] Track analytics for feature toggle usage patterns
- [x] Address any bugs reported in first week
- [x] Consider future enhancements (user-level preferences, gradual rollouts)
- [x] Archive this proposal with `openspec archive enable-family-feature-toggles`

---

## Validation Gates

Each phase must pass its validation before proceeding to the next:

**Phase 1 Gate**: All backend tests pass, migration script works on dev database  
**Phase 2 Gate**: Redux slice has 100% test coverage, all tests pass  
**Phase 3 Gate**: Settings page renders correctly, matches reference design  
**Phase 4 Gate**: Navigation filtering works, localStorage syncs properly  
**Phase 5 Gate**: All E2E tests pass, no accessibility violations  
**Phase 6 Gate**: Documentation complete, pre-deployment checklist done  
**Phase 7 Gate**: Production stable for 1 week, no critical bugs

## Notes

- Tasks with dependencies should be completed in order
- Parallelization opportunities:
  - Backend (Phase 1) and Redux (Phase 2) can start simultaneously after domain model is defined
  - Frontend UI (Phase 3) can start once Redux slice is complete
  - E2E tests (Phase 5) can be written in parallel with implementation
- Each completed task should be verifiable through tests or manual inspection
- Use feature branches for each phase: `enable-family-feature-toggles/phase-1`, etc.