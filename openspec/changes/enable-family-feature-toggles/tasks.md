# Tasks: Enable Family Feature Toggles

## Phase 1: Backend Foundation (API)

### 1.1 Family Settings Domain & Data Layer
- [ ] Create `FamilySettings` domain model in `apps/api/src/modules/family/domain/family-settings.ts`
- [ ] Create `FamilySettingsRepository` in `apps/api/src/modules/family/repositories/family-settings.repository.ts`
- [ ] Write unit tests for repository CRUD operations (create, findByFamilyId, update)
- [ ] Create database indexes for `familySettings` collection (`familyId` unique index)
- [ ] Verify repository tests pass with 100% coverage

### 1.2 Family Settings Validators
- [ ] Create `family-settings.validator.ts` with Zod schemas for GET/PUT requests
- [ ] Define schema for `enabledFeatures` array with valid feature keys enum
- [ ] Define schema for `aiSettings` object with URL validation for `apiEndpoint`
- [ ] Write unit tests for all validator edge cases (invalid keys, malformed data, empty arrays)
- [ ] Verify validator tests pass with 100% coverage

### 1.3 Family Settings Service Layer
- [ ] Create `FamilySettingsService` in `apps/api/src/modules/family/services/family-settings.service.ts`
- [ ] Implement `getSettings()` with default fallback (all features enabled)
- [ ] Implement `updateSettings()` with upsert behavior and AI secret encryption
- [ ] Implement `createDefaultSettings()` for new families
- [ ] Write unit tests for service logic (mocking repository)
- [ ] Verify service tests pass with 100% coverage

### 1.4 Family Settings API Routes
- [ ] Create `get-settings.route.ts` with parent authorization middleware
- [ ] Create `update-settings.route.ts` with parent authorization and validation
- [ ] Integrate routes in `apps/api/src/modules/family/routes/families.route.ts`
- [ ] Add mapper `family-settings.mapper.ts` for DTO transformations (omit apiSecret in responses)
- [ ] Test routes with Postman/Bruno to verify 200/400/403 responses

### 1.5 Backend E2E Tests
- [ ] Create `apps/api/tests/e2e/family/get-settings.e2e.test.ts`
  - Test successful GET with existing settings
  - Test GET returns defaults for new family
  - Test GET rejects child role (403)
- [ ] Create `apps/api/tests/e2e/family/update-settings.e2e.test.ts`
  - Test successful PUT with valid data
  - Test PUT creates document if missing (upsert)
  - Test PUT rejects invalid feature keys (400)
  - Test PUT validates AI endpoint URL format (400)
  - Test PUT rejects child role (403)
  - Test AI secret encryption and omission in responses
- [ ] Run all backend E2E tests and verify they pass

### 1.6 Database Migration Script
- [ ] Create `scripts/migrate-family-settings.ts` to initialize settings for existing families
- [ ] Script should create default settings (all features enabled) for families without settings
- [ ] Add dry-run mode and logging
- [ ] Test migration script on local development database
- [ ] Document migration steps in a MIGRATION.md file

## Phase 2: Frontend State Management (Redux)

### 2.1 Settings Redux Slice
- [ ] Create `apps/web/src/store/slices/settings.slice.ts`
- [ ] Define `SettingsState` interface with `settingsByFamily` map
- [ ] Create `fetchFamilySettings` async thunk calling API client
- [ ] Create `updateFamilySettings` async thunk with PUT request
- [ ] Implement reducers for pending/fulfilled/rejected states
- [ ] Create selectors: `selectEnabledFeatures`, `selectIsFeatureEnabled`, `selectAISettings`

### 2.2 Settings Slice Unit Tests
- [ ] Write unit test for initial state
- [ ] Write unit tests for `fetchFamilySettings` (pending, fulfilled, rejected)
- [ ] Write unit tests for `updateFamilySettings` (pending, fulfilled, rejected)
- [ ] Write unit tests for all selectors with various states
- [ ] Write unit test for default behavior when familyId not in state
- [ ] Verify 100% coverage of settings slice code
- [ ] Run tests and verify all pass

### 2.3 API Client Methods
- [ ] Add `getFamilySettings(familyId)` to `apps/web/src/lib/api-client.ts`
- [ ] Add `updateFamilySettings(familyId, settings)` to API client
- [ ] Add TypeScript interfaces for `FamilySettings`, `UpdateSettingsRequest`
- [ ] Test API client methods with backend running

### 2.4 Redux Store Integration
- [ ] Add `settings` reducer to `apps/web/src/store/store.ts`
- [ ] Update `RootState` type to include settings
- [ ] Verify Redux DevTools shows settings slice
- [ ] Test Redux integration in browser

## Phase 3: Frontend Settings UI

### 3.1 Translation Keys
- [ ] Add settings translation keys to `apps/web/src/dictionaries/en-US.json`
  - Page title, description, tab labels
  - All 9 feature labels and descriptions
  - AI settings labels, placeholders, helper text
  - Button labels (Save, Reset)
  - Toast messages (success, error)
- [ ] Add Dutch translations to `apps/web/src/dictionaries/nl-NL.json` (mirror structure)
- [ ] Verify translations load correctly in both locales

### 3.2 Settings Page Structure
- [ ] Create `apps/web/src/app/[lang]/app/settings/page.tsx` (server component)
- [ ] Implement parent role check (redirect if child)
- [ ] Fetch initial settings server-side for SSR
- [ ] Create client component `apps/web/src/components/settings/SettingsView.tsx`
- [ ] Implement two-tab layout (Features | AI Settings) using shadcn Tabs

### 3.3 Features Tab Components
- [ ] Create `apps/web/src/components/settings/FeaturesTab.tsx`
- [ ] Create `apps/web/src/components/settings/FeatureToggleCard.tsx` for individual features
- [ ] Implement toggle logic with immediate Redux dispatch and toast feedback
- [ ] Add "About Features" informational card
- [ ] Add data-testid attributes to all interactive elements
- [ ] Match reference design layout pixel-perfect

### 3.4 AI Settings Tab Components
- [ ] Create `apps/web/src/components/settings/AISettingsTab.tsx`
- [ ] Create `apps/web/src/components/settings/AIConfigForm.tsx`
- [ ] Implement form with validation (required fields, URL format)
- [ ] Implement "Save AI Settings" with loading state and error handling
- [ ] Implement "Reset to Default" button
- [ ] Add "About AI Settings" informational card
- [ ] Add data-testid attributes to all form elements
- [ ] Match reference design layout pixel-perfect

### 3.5 Settings Page Styling & Responsive Design
- [ ] Apply responsive design patterns from existing pages (tasks, family)
- [ ] Test mobile layout (<768px) - single column, full width
- [ ] Test tablet layout (768-1024px) - constrained width
- [ ] Test desktop layout (>1024px) - max-width container
- [ ] Verify tab switcher stays centered at all breakpoints
- [ ] Test with both light and dark themes

### 3.6 Settings Redux Integration
- [ ] Connect SettingsView to Redux using `useAppSelector` and `useAppDispatch`
- [ ] Dispatch `fetchFamilySettings` on component mount
- [ ] Show loading state while fetching
- [ ] Handle fetch errors with user-friendly messages
- [ ] Update localStorage on successful settings update
- [ ] Test Redux state updates in browser DevTools

## Phase 4: Navigation Filtering

### 4.1 LocalStorage Utilities
- [ ] Create utility functions in `apps/web/src/lib/feature-storage.ts`:
  - `getCachedFeatures(familyId): string[] | null`
  - `setCachedFeatures(familyId, features: string[]): void`
  - `clearCachedFeatures(familyId): void`
  - `clearAllCachedFeatures(): void`
- [ ] Add error handling for localStorage read/write failures
- [ ] Write unit tests for storage utilities

### 4.2 Navigation Hook Enhancement
- [ ] Update `apps/web/src/hooks/useDashboardNavigation.ts` to consume Redux settings
- [ ] Add fallback to localStorage when Redux not loaded
- [ ] Implement feature filtering logic with feature-to-route mapping
- [ ] Create `filterNavigationByFeatures()` helper function
- [ ] Ensure Settings and Dashboard items are never filtered
- [ ] Hide empty sections (Family/Personal) when no features enabled
- [ ] Add data-testid attributes to navigation items
- [ ] Test hook with various feature combinations

### 4.3 Route Protection
- [ ] Add feature-enabled check to each feature page (tasks, rewards, shopping-lists, etc.)
- [ ] Implement server-side redirect to `/app` if feature is disabled
- [ ] Show toast notification "This feature is not enabled for your family"
- [ ] Test direct URL access to disabled features
- [ ] Verify no client-side errors when redirecting

### 4.4 Dashboard Layout Integration
- [ ] Update `apps/web/src/components/layouts/dashboard-layout.tsx` to fetch settings on mount
- [ ] Update navigation menu to use `aiIntegration` flag instead of hardcoded "AI Settings" link
- [ ] Rename "AI Settings" to "Settings" in navigation
- [ ] Verify settings are fetched once per session and cached in Redux
- [ ] Test navigation updates when switching families (if user has multiple)

### 4.5 LocalStorage Sync
- [ ] Update settings slice to write to localStorage on `fetchFamilySettings.fulfilled`
- [ ] Update settings slice to write to localStorage on `updateFamilySettings.fulfilled`
- [ ] Implement logout cleanup to clear cached features
- [ ] Test localStorage sync with Redux DevTools
- [ ] Verify no layout shifts on page refresh

## Phase 5: Testing & Quality Assurance

### 5.1 Frontend E2E Tests - Settings Page
- [ ] Create `apps/web/tests/e2e/app/settings/page-load.spec.ts`
  - Test settings page loads for parent
  - Test settings page redirects for child
  - Test tabs switch correctly
- [ ] Create `apps/web/tests/e2e/app/settings/feature-toggles.spec.ts`
  - Test toggle feature on/off
  - Test toast appears after toggle
  - Test toggle persists across page refresh
- [ ] Create `apps/web/tests/e2e/app/settings/ai-settings-form.spec.ts`
  - Test form validation (required fields, URL format)
  - Test successful save
  - Test reset button
- [ ] Create page object `apps/web/tests/e2e/pages/settings.page.ts` with locators and helpers
- [ ] Verify all E2E tests pass with Playwright

### 5.2 Frontend E2E Tests - Navigation Filtering
- [ ] Create `apps/web/tests/e2e/app/navigation-filtering.spec.ts`
  - Test navigation shows only enabled features
  - Test navigation updates after toggling feature
  - Test localStorage prevents layout shift
  - Test direct URL access to disabled feature redirects
- [ ] Use data-testid attributes for reliable element selection
- [ ] Verify all navigation tests pass

### 5.3 Integration Testing
- [ ] Test full flow: parent logs in → toggles feature → sees navigation update → logs out → logs in → sees persisted change
- [ ] Test multi-family scenario: user switches family → navigation updates
- [ ] Test AI settings: parent configures API → settings persist → get request omits secret
- [ ] Test child authorization: child attempts settings access → gets 403/redirect
- [ ] Verify no console errors or warnings in browser

### 5.4 Accessibility Testing
- [ ] Test keyboard navigation through settings page (Tab, Enter, Space)
- [ ] Test screen reader announcements for toggles and form fields
- [ ] Verify all interactive elements have proper ARIA labels
- [ ] Test with browser accessibility tools (Lighthouse, axe DevTools)
- [ ] Fix any accessibility violations found

### 5.5 Performance Testing
- [ ] Measure page load time with settings fetch
- [ ] Verify localStorage read/write is synchronous and fast
- [ ] Test with large number of families (10+) to ensure no N+1 queries
- [ ] Verify navigation filtering does not cause unnecessary re-renders
- [ ] Check bundle size impact of new components (should be lazy-loaded)

## Phase 6: Documentation & Deployment

### 6.1 API Documentation
- [ ] Update API documentation (if existing) with new endpoints:
  - `GET /v1/families/{familyId}/settings`
  - `PUT /v1/families/{familyId}/settings`
- [ ] Document request/response schemas
- [ ] Document error codes (400, 403, 404, 500)
- [ ] Add example requests/responses to Bruno collection

### 6.2 User Documentation
- [ ] Create user guide for settings page in `docs/` folder
- [ ] Document what each feature toggle does
- [ ] Document AI settings configuration steps
- [ ] Add screenshots of settings page
- [ ] Document child vs parent access differences

### 6.3 Developer Documentation
- [ ] Update `design.md` with any implementation deviations
- [ ] Document localStorage key format and sync strategy
- [ ] Document feature-to-route mapping
- [ ] Add comments to complex code sections
- [ ] Update README with new features

### 6.4 Pre-Deployment Checklist
- [ ] All unit tests passing (100% coverage on Redux slice)
- [ ] All E2E tests passing (backend and frontend)
- [ ] Build succeeds without warnings (`pnpm run lint`, `pnpm run build`)
- [ ] Migration script tested on staging database
- [ ] No breaking changes to existing features
- [ ] Translations complete for both locales

### 6.5 Deployment Steps
- [ ] Deploy backend API to staging environment
- [ ] Run migration script on staging database
- [ ] Deploy frontend to staging environment
- [ ] Perform smoke tests on staging (parent toggles feature, child denied access)
- [ ] Monitor staging logs for errors
- [ ] Deploy to production (backend first, then frontend)
- [ ] Run migration script on production database
- [ ] Verify production deployment successful
- [ ] Monitor production metrics and error logs for 24 hours

## Phase 7: Post-Deployment
- [ ] Monitor user feedback for settings page usability
- [ ] Track analytics for feature toggle usage patterns
- [ ] Address any bugs reported in first week
- [ ] Consider future enhancements (user-level preferences, gradual rollouts)
- [ ] Archive this proposal with `openspec archive enable-family-feature-toggles`

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