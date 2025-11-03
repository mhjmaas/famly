# Add Profile Page - Implementation Tasks

## Overview
Tasks are organized in dependency order. Items marked with 🔄 can be worked in parallel with previous items.

## Phase 1: Foundation & Components (1-6)

### 1. Add missing UI components
**Dependencies:** None
**Validation:** Components render correctly in isolation

- [ ] Run `npx shadcn@latest add avatar dropdown-menu dialog select`
- [ ] Verify all components are properly installed in `src/components/ui/`
- [ ] Create unit tests for Avatar component rendering and fallback
- [ ] Create unit tests for DropdownMenu component interactions
- [ ] Create unit tests for Dialog component open/close behavior
- [ ] Create unit tests for Select component value changes
- [ ] Verify components match design system styling

### 2. Extend API client with profile endpoints
**Dependencies:** None
**Validation:** API client methods work with actual backend

- [ ] Write failing unit tests for `getMe()` function
- [ ] Implement `getMe()` function in `src/lib/api-client.ts`
- [ ] Add TypeScript interfaces for `UserProfile` and `MeResponse`
- [ ] Write failing unit tests for `getKarmaBalance()` function
- [ ] Implement `getKarmaBalance()` function
- [ ] Add TypeScript interface for `KarmaBalance`
- [ ] Write failing unit tests for `getActivityEvents()` function
- [ ] Implement `getActivityEvents()` with optional date filters
- [ ] Add TypeScript interface for `ActivityEvent`
- [ ] Verify all tests pass
- [ ] Test API client with actual backend endpoints

### 3. 🔄 Set up Redux Toolkit store
**Dependencies:** Task 2 (API client)
**Validation:** Redux store provides user and karma data to components

- [ ] Install dependencies: `pnpm add @reduxjs/toolkit react-redux`
- [ ] Create `src/store/` directory
- [ ] Write failing unit tests for user slice
- [ ] Create `src/store/slices/user.slice.ts`
- [ ] Implement user slice with profile, isLoading, error state
- [ ] Implement setUser, clearUser actions
- [ ] Implement fetchUser async thunk
- [ ] Implement user selectors (selectUser, selectUserLoading, selectCurrentFamily)
- [ ] Write failing unit tests for karma slice
- [ ] Create `src/store/slices/karma.slice.ts`
- [ ] Implement karma slice with balances map (userId → balance)
- [ ] Implement setKarma, incrementKarma, decrementKarma actions
- [ ] Implement fetchKarma async thunk
- [ ] Implement karma selectors (selectKarmaBalance, selectKarmaLoading)
- [ ] Create `src/store/store.ts` with makeStore function
- [ ] Configure store with user and karma reducers
- [ ] Add TypeScript types (RootState, AppDispatch, AppStore)
- [ ] Create `src/store/hooks.ts` with typed hooks
- [ ] Implement useAppDispatch, useAppSelector, useAppStore
- [ ] Create `src/store/provider.tsx` StoreProvider component
- [ ] Implement store initialization with preloadedState support
- [ ] Verify all Redux unit tests pass

### 4. 🔄 Add internationalization for profile page
**Dependencies:** None
**Validation:** Translations exist for all profile content

- [ ] Add profile page translations to `src/dictionaries/en-US.json`
- [ ] Add profile section with title, subtitle, karma
- [ ] Add preferences section with language and theme labels
- [ ] Add activity section with timeline labels
- [ ] Add translations for activity event types
- [ ] Add profile page translations to `src/dictionaries/nl-NL.json`
- [ ] Mirror all English translations in Dutch
- [ ] Verify translation keys are consistent across languages
- [ ] Test translations load correctly in both languages

### 5. Create activity timeline utility functions
**Dependencies:** Task 2 (API client interfaces)
**Validation:** Functions correctly group and format events

- [ ] Write failing unit tests for `groupEventsByDate()` function
- [ ] Create `src/lib/activity-utils.ts` file
- [ ] Implement `groupEventsByDate()` function
- [ ] Write failing unit tests for `formatActivityDate()` function
- [ ] Implement `formatActivityDate()` with locale support
- [ ] Write failing unit tests for `formatActivityTime()` function
- [ ] Implement `formatActivityTime()` with locale support
- [ ] Write failing unit tests for `getActivityEventIcon()` function
- [ ] Implement icon selection based on event type
- [ ] Write failing unit tests for `getActivityEventColor()` function
- [ ] Implement color selection based on karma change
- [ ] Verify all utility function tests pass

### 6. Create profile page component structure
**Dependencies:** Tasks 1, 4
**Validation:** Components render with mock data

- [ ] Create `src/components/profile/` directory
- [ ] Write failing tests for UserProfileCard component
- [ ] Create `user-profile-card.tsx` component
- [ ] Implement user info display (avatar, name, age, role, karma)
- [ ] Add proper TypeScript types for props
- [ ] Write failing tests for PreferencesCard component
- [ ] Create `preferences-card.tsx` component
- [ ] Implement theme and language selector integration
- [ ] Write failing tests for ActivityTimeline component
- [ ] Create `activity-timeline.tsx` component
- [ ] Implement event grouping and rendering
- [ ] Implement empty state for no events
- [ ] Write failing tests for ProfileView component
- [ ] Create `profile-view.tsx` main component
- [ ] Integrate all sub-components
- [ ] Verify all component unit tests pass
- [ ] Test components render correctly with mock data

## Phase 2: Integration (7-10)

### 7. Integrate Redux Provider in root layout
**Dependencies:** Task 3 (Redux store)
**Validation:** Redux store hydrates with server-side data

- [ ] Write failing e2e test for authenticated user data loading
- [ ] Update `src/app/[lang]/layout.tsx` to be async
- [ ] Import cookies() from next/headers
- [ ] Fetch user data from getMe() when session exists
- [ ] Fetch karma data from getKarmaBalance() for current user
- [ ] Build preloadedState object with user and karma slices
- [ ] Wrap app children with StoreProvider passing preloadedState
- [ ] Add error handling for failed fetches
- [ ] Write failing e2e test for unauthenticated user handling
- [ ] Verify empty preloadedState works correctly
- [ ] Verify e2e tests pass
- [ ] Test Redux DevTools in browser (development only)

### 8. Update dashboard navigation with Redux selectors
**Dependencies:** Task 7 (Redux Provider integrated)
**Validation:** Navigation shows authenticated user info from Redux

- [ ] Write failing e2e test for desktop nav user data display
- [ ] Update `src/components/layouts/dashboard-layout.tsx` (already client component)
- [ ] Import useAppSelector from '@/store/hooks'
- [ ] Import selectUser, selectUserLoading from user slice
- [ ] Import selectKarmaBalance from karma slice
- [ ] Replace hardcoded name with useAppSelector(selectUser)
- [ ] Replace hardcoded karma with useAppSelector(selectKarmaBalance(userId))
- [ ] Calculate initials from user.name
- [ ] Add loading state handling using selectUserLoading
- [ ] Write failing e2e test for tablet nav user data display
- [ ] Update tablet navigation to use Redux selectors
- [ ] Write failing e2e test for mobile nav user data display
- [ ] Update mobile navigation to use Redux selectors
- [ ] Verify selective re-rendering (only updates when relevant state changes)
- [ ] Verify all navigation e2e tests pass

### 9. Implement settings page with profile view using Redux
**Dependencies:** Tasks 2, 3, 6, 7
**Validation:** Profile page displays real user data from Redux

- [ ] Write failing e2e test for profile page rendering
- [ ] Update `src/app/[lang]/app/settings/page.tsx` to be async
- [ ] Fetch activity events server-side with getActivityEvents()
- [ ] Pass activity events to ProfileView component
- [ ] Add error handling for failed events fetch
- [ ] Update ProfileView to use client component
- [ ] Import useAppSelector from '@/store/hooks'
- [ ] Import selectUser, selectUserLoading from user slice
- [ ] Import selectKarmaBalance from karma slice
- [ ] Write failing e2e test for profile card display
- [ ] Replace props with Redux selectors in ProfileView
- [ ] Pass user and karma from Redux to UserProfileCard
- [ ] Write failing e2e test for karma display
- [ ] Verify karma loads from Redux store
- [ ] Write failing e2e test for activity timeline
- [ ] Verify activity events display correctly
- [ ] Write failing e2e test for empty activity state
- [ ] Verify empty state displays when no events
- [ ] Verify all profile page e2e tests pass

### 10. Implement preferences functionality
**Dependencies:** Task 9 (Settings page)
**Validation:** Theme and language changes work correctly

- [ ] Write failing e2e test for theme switching
- [ ] Verify ThemeToggle component works in preferences card
- [ ] Test theme persists across page reloads
- [ ] Write failing e2e test for language switching
- [ ] Verify LanguageSelector component works in preferences card
- [ ] Test language persists across page reloads
- [ ] Test URL updates with new language locale
- [ ] Verify all preferences e2e tests pass

## Phase 3: Polish & Edge Cases (11-13)

### 11. Implement error handling and loading states
**Dependencies:** Task 9 (Profile page)
**Validation:** Errors display gracefully, loading states work

- [ ] Write failing e2e test for failed user data fetch (401)
- [ ] Add redirect to signin on 401 error
- [ ] Write failing e2e test for failed karma fetch
- [ ] Display "—" fallback for missing karma
- [ ] Write failing e2e test for failed activity events fetch
- [ ] Display empty state message for failed events
- [ ] Add loading skeleton for profile card initial load
- [ ] Add loading state for karma while fetching
- [ ] Add loading state for activity timeline while fetching
- [ ] Write failing unit tests for error boundary
- [ ] Add error boundary for profile page
- [ ] Verify all error handling tests pass

### 12. Implement responsive design
**Dependencies:** Task 9 (Profile page)
**Validation:** Page adapts correctly to all breakpoints

- [ ] Write failing e2e test for mobile layout (< 768px)
- [ ] Hide header theme/language selectors on mobile
- [ ] Ensure cards stack vertically with full width
- [ ] Test avatar size appropriate for mobile
- [ ] Write failing e2e test for tablet layout (768-1024px)
- [ ] Verify layout matches desktop with minor adjustments
- [ ] Write failing e2e test for desktop layout (>= 1024px)
- [ ] Verify header displays with theme/language selectors
- [ ] Test activity timeline optimal width on desktop
- [ ] Verify all responsive e2e tests pass

### 13. Implement accessibility features
**Dependencies:** Task 9 (Profile page)
**Validation:** Page is fully accessible

- [ ] Run automated accessibility audit with @axe-core/playwright
- [ ] Verify proper heading hierarchy (h1 > h2 > h3)
- [ ] Add aria-labels to all icons
- [ ] Add aria-hidden to decorative icons
- [ ] Verify all interactive elements have accessible names
- [ ] Test keyboard navigation through all elements
- [ ] Verify focus indicators are visible on all interactive elements
- [ ] Test screen reader announcements for loading states
- [ ] Verify color contrast meets WCAG AA standards
- [ ] Fix any accessibility issues found
- [ ] Verify accessibility audit passes

## Phase 4: Final Validation (14-15)

### 14. Complete test coverage
**Dependencies:** All previous tasks
**Validation:** All tests pass with good coverage

- [ ] Run all unit tests: `pnpm test:unit`
- [ ] Verify Redux slices have 100% coverage (actions, reducers, selectors, thunks)
- [ ] Verify 80%+ code coverage for new components
- [ ] Run all e2e tests: `pnpm test:e2e`
- [ ] Verify all e2e scenarios pass
- [ ] Test Redux DevTools integration in browser
- [ ] Verify selective re-rendering (use React DevTools Profiler)
- [ ] Review test output for warnings or flaky tests
- [ ] Fix any failing or flaky tests
- [ ] Document any known limitations

### 15. Documentation and code review prep
**Dependencies:** Task 14 (Tests complete)
**Validation:** Code is documented and review-ready

- [ ] Add JSDoc comments to all exported functions
- [ ] Add inline comments for complex logic
- [ ] Update README if necessary
- [ ] Verify all TypeScript types are properly defined
- [ ] Run linter: `pnpm run lint`
- [ ] Fix any linting errors or warnings
- [ ] Run formatter: `pnpm run format`
- [ ] Perform self-review of all changes
- [ ] Create pull request with detailed description
- [ ] Link PR to OpenSpec proposal

## Success Criteria Checklist

- [ ] Profile page matches reference design visually
- [ ] Real user data appears in dashboard navigation
- [ ] Theme selector works and persists
- [ ] Language selector works and persists
- [ ] Activity timeline displays and groups events correctly
- [ ] All API integrations work with proper error handling
- [ ] UserContext provides data to all consuming components
- [ ] Page is responsive on mobile, tablet, and desktop
- [ ] All unit tests pass
- [ ] All e2e tests pass
- [ ] No console errors or warnings
- [ ] Accessibility audit passes
- [ ] Code follows TDD principles (tests written first)
- [ ] Code follows SOLID principles from constitution
- [ ] Code is properly documented

## Estimated Effort

- Phase 1 (Tasks 1-6): ~8-10 hours
- Phase 2 (Tasks 7-10): ~6-8 hours
- Phase 3 (Tasks 11-13): ~4-6 hours
- Phase 4 (Tasks 14-15): ~2-3 hours

**Total: ~20-27 hours**

## Notes

- All tests should be written BEFORE implementation (TDD)
- Each task should result in a working, tested feature
- Commit frequently with descriptive messages
- Reference change ID "add-profile-page" in commit messages
- Run `pnpm test` before committing to ensure no regressions
