# Add Profile Page - Implementation Tasks

## Overview
Tasks are organized in dependency order. Items marked with 🔄 can be worked in parallel with previous items.

## Phase 1: Foundation & Components (1-6)

### 1. Add missing UI components
**Dependencies:** None
**Validation:** Components render correctly in isolation

- [x] Run `npx shadcn@latest add avatar dropdown-menu dialog select`
- [x] Verify all components are properly installed in `src/components/ui/`
- [x] Create unit tests for Avatar component rendering and fallback
- [x] Create unit tests for DropdownMenu component interactions
- [x] Create unit tests for Dialog component open/close behavior
- [x] Create unit tests for Select component value changes
- [ ] Verify components match design system styling

### 2. Extend API client with profile endpoints
**Dependencies:** None
**Validation:** API client methods work with actual backend

- [x] Write failing unit tests for `getMe()` function
- [x] Implement `getMe()` function in `src/lib/api-client.ts`
- [x] Add TypeScript interfaces for `UserProfile` and `MeResponse`
- [x] Write failing unit tests for `getKarmaBalance()` function
- [x] Implement `getKarmaBalance()` function
- [x] Add TypeScript interface for `KarmaBalance`
- [x] Write failing unit tests for `getActivityEvents()` function
- [x] Implement `getActivityEvents()` with optional date filters
- [x] Add TypeScript interface for `ActivityEvent`
- [x] Verify all tests pass
- [x] Test API client with actual backend endpoints

### 3. 🔄 Set up Redux Toolkit store
**Dependencies:** Task 2 (API client)
**Validation:** Redux store provides user and karma data to components

- [x] Install dependencies: `pnpm add @reduxjs/toolkit react-redux`
- [x] Create `src/store/` directory
- [x] Write failing unit tests for user slice
- [x] Create `src/store/slices/user.slice.ts`
- [x] Implement user slice with profile, isLoading, error state
- [x] Implement setUser, clearUser actions
- [x] Implement fetchUser async thunk
- [x] Implement user selectors (selectUser, selectUserLoading, selectCurrentFamily)
- [x] Write failing unit tests for karma slice
- [x] Create `src/store/slices/karma.slice.ts`
- [x] Implement karma slice with balances map (userId → balance)
- [x] Implement setKarma, incrementKarma, decrementKarma actions
- [x] Implement fetchKarma async thunk
- [x] Implement karma selectors (selectKarmaBalance, selectKarmaLoading)
- [x] Create `src/store/store.ts` with makeStore function
- [x] Configure store with user and karma reducers
- [x] Add TypeScript types (RootState, AppDispatch, AppStore)
- [x] Create `src/store/hooks.ts` with typed hooks
- [x] Implement useAppDispatch, useAppSelector, useAppStore
- [x] Create `src/store/provider.tsx` StoreProvider component
- [x] Implement store initialization with preloadedState support
- [x] Verify all Redux unit tests pass

### 4. 🔄 Add internationalization for profile page
**Dependencies:** None
**Validation:** Translations exist for all profile content

- [x] Add profile page translations to `src/dictionaries/en-US.json`
- [x] Add profile section with title, subtitle, karma
- [x] Add preferences section with language and theme labels
- [x] Add activity section with timeline labels
- [x] Add translations for activity event types
- [x] Add profile page translations to `src/dictionaries/nl-NL.json`
- [x] Mirror all English translations in Dutch
- [x] Verify translation keys are consistent across languages
- [x] Test translations load correctly in both languages

### 5. Create activity timeline utility functions
**Dependencies:** Task 2 (API client interfaces)
**Validation:** Functions correctly group and format events

- [x] Write failing unit tests for `groupEventsByDate()` function
- [x] Create `src/lib/activity-utils.ts` file
- [x] Implement `groupEventsByDate()` function
- [x] Write failing unit tests for `formatActivityDate()` function
- [x] Implement `formatActivityDate()` with locale support
- [x] Write failing unit tests for `formatActivityTime()` function
- [x] Implement `formatActivityTime()` with locale support
- [x] Write failing unit tests for `getActivityEventIcon()` function
- [x] Implement icon selection based on event type
- [x] Write failing unit tests for `getActivityEventColor()` function
- [x] Implement color selection based on karma change
- [x] Verify all utility function tests pass

### 6. Create profile page component structure
**Dependencies:** Tasks 1, 4
**Validation:** Components render with mock data

- [x] Create `src/components/profile/` directory
- [x] Write failing tests for UserProfileCard component
- [x] Create `user-profile-card.tsx` component
- [x] Implement user info display (avatar, name, age, role, karma)
- [x] Add proper TypeScript types for props
- [x] Write failing tests for PreferencesCard component
- [x] Create `preferences-card.tsx` component
- [x] Implement theme and language selector integration
- [x] Write failing tests for ActivityTimeline component
- [x] Create `activity-timeline.tsx` component
- [x] Implement event grouping and rendering
- [x] Implement empty state for no events
- [x] Write failing tests for ProfileView component
- [x] Create `profile-view.tsx` main component
- [x] Integrate all sub-components
- [x] Verify all component unit tests pass
- [x] Test components render correctly with mock data

## Phase 2: Integration (7-10)

### 7. Integrate Redux Provider in root layout
**Dependencies:** Task 3 (Redux store)
**Validation:** Redux store hydrates with server-side data

- [x] Write failing e2e test for authenticated user data loading
- [x] Write failing e2e test for authenticated user data loading
- [x] Update `src/app/[lang]/layout.tsx` to be async
- [x] Import cookies() from next/headers
- [x] Fetch user data from getMe() when session exists
- [x] Fetch karma data from getKarmaBalance() for current user
- [x] Build preloadedState object with user and karma slices
- [x] Wrap app children with StoreProvider passing preloadedState
- [x] Add error handling for failed fetches
- [x] Write failing e2e test for unauthenticated user handling
- [x] Verify empty preloadedState works correctly
- [x] Verify e2e tests pass
- [x] Test Redux DevTools in browser (development only)

### 8. Update dashboard navigation with Redux selectors
**Dependencies:** Task 7 (Redux Provider integrated)
**Validation:** Navigation shows authenticated user info from Redux

- [x] Write failing e2e test for desktop nav user data display
- [x] Update `src/components/layouts/dashboard-layout.tsx` (already client component)
- [x] Import useAppSelector from '@/store/hooks'
- [x] Import selectUser, selectUserLoading from user slice
- [x] Import selectKarmaBalance from karma slice
- [x] Replace hardcoded name with useAppSelector(selectUser)
- [x] Replace hardcoded karma with useAppSelector(selectKarmaBalance(userId))
- [x] Calculate initials from user.name
- [x] Add loading state handling using selectUserLoading
- [x] Write failing e2e test for tablet nav user data display
- [x] Update tablet navigation to use Redux selectors
- [x] Write failing e2e test for mobile nav user data display
- [x] Update mobile navigation to use Redux selectors
- [x] Verify selective re-rendering (only updates when relevant state changes)
- [x] Verify all navigation e2e tests pass

### 9. Implement profile page with profile view using Redux
**Dependencies:** Tasks 2, 3, 6, 7
**Validation:** Profile page displays real user data from Redux

- [x] Write failing e2e test for profile page rendering
- [x] Update `src/app/[lang]/app/profile/page.tsx` to be async
- [x] Fetch activity events server-side with getActivityEvents()
- [x] Pass activity events to ProfileView component
- [x] Add error handling for failed events fetch
- [x] Update ProfileView to use client component
- [x] Import useAppSelector from '@/store/hooks'
- [x] Import selectUser, selectUserLoading from user slice
- [x] Import selectKarmaBalance from karma slice
- [x] Write failing e2e test for profile card display
- [x] Replace props with Redux selectors in ProfileView
- [x] Pass user and karma from Redux to UserProfileCard
- [x] Write failing e2e test for karma display
- [x] Verify karma loads from Redux store
- [x] Write failing e2e test for activity timeline
- [x] Verify activity events display correctly
- [x] Write failing e2e test for empty activity state
- [x] Verify empty state displays when no events
- [x] Verify all profile page e2e tests pass

### 10. Implement preferences functionality
**Dependencies:** Task 9 (Profile page)
**Validation:** Theme and language changes work correctly

- [x] Write failing e2e test for theme switching
- [x] Verify ThemeToggle component works in preferences card
- [x] Test theme persists across page reloads
- [x] Write failing e2e test for language switching
- [x] Verify LanguageSelector component works in preferences card
- [x] Test language persists across page reloads
- [x] Test URL updates with new language locale
- [x] Verify all preferences e2e tests pass

## Phase 3: Polish & Edge Cases (11-13)

### 11. Implement error handling and loading states
**Dependencies:** Task 9 (Profile page)
**Validation:** Errors display gracefully, loading states work

- [x] Write failing e2e test for failed user data fetch (401)
- [x] Add redirect to signin on 401 error
- [x] Write failing e2e test for failed karma fetch
- [x] Display "—" fallback for missing karma
- [x] Write failing e2e test for failed activity events fetch
- [x] Display empty state message for failed events
- [x] Add loading skeleton for profile card initial load
- [x] Add loading state for karma while fetching
- [x] Add loading state for activity timeline while fetching
- [x] Write failing unit tests for error boundary
- [x] Add error boundary for profile page
- [x] Verify all error handling tests pass

### 12. Implement responsive design
**Dependencies:** Task 9 (Profile page)
**Validation:** Page adapts correctly to all breakpoints

- [x] Write failing e2e test for mobile layout (< 768px)
- [x] Hide header theme/language selectors on mobile
- [x] Ensure cards stack vertically with full width
- [x] Test avatar size appropriate for mobile
- [x] Write failing e2e test for tablet layout (768-1024px)
- [x] Verify layout matches desktop with minor adjustments
- [x] Write failing e2e test for desktop layout (>= 1024px)
- [x] Verify header displays with theme/language selectors
- [x] Test activity timeline optimal width on desktop
- [x] Verify all responsive e2e tests pass

### 13. Implement accessibility features
**Dependencies:** Task 9 (Profile page)
**Validation:** Page is fully accessible

- [x] Run automated accessibility audit with @axe-core/playwright
- [x] Verify proper heading hierarchy (h1 > h2 > h3)
- [x] Add aria-labels to all icons
- [x] Add aria-hidden to decorative icons
- [x] Verify all interactive elements have accessible names
- [x] Test keyboard navigation through all elements
- [x] Verify focus indicators are visible on all interactive elements
- [x] Test screen reader announcements for loading states
- [x] Verify color contrast meets WCAG AA standards
- [x] Fix any accessibility issues found
- [x] Verify accessibility audit passes

## Phase 4: Final Validation (14-15)

### 14. Complete test coverage
**Dependencies:** All previous tasks
**Validation:** All tests pass with good coverage

- [x] Run all unit tests: `pnpm test:unit`
- [x] Verify Redux slices have 100% coverage (actions, reducers, selectors, thunks)
- [x] Verify 80%+ code coverage for new components
- [x] Run all e2e tests: `pnpm test:e2e`
- [x] Verify all e2e scenarios pass
- [x] Test Redux DevTools integration in browser
- [x] Verify selective re-rendering (use React DevTools Profiler)
- [x] Review test output for warnings or flaky tests
- [x] Fix any failing or flaky tests
- [x] Document any known limitations

### 15. Documentation and code review prep
**Dependencies:** Task 14 (Tests complete)
**Validation:** Code is documented and review-ready

- [x] Add JSDoc comments to all exported functions
- [x] Add inline comments for complex logic
- [x] Update README if necessary
- [x] Verify all TypeScript types are properly defined
- [x] Run linter: `pnpm run lint`
- [x] Fix any linting errors or warnings
- [x] Run formatter: `pnpm run format`
- [x] Perform self-review of all changes
- [x] Create pull request with detailed description
- [x] Link PR to OpenSpec proposal

## Success Criteria Checklist

- [x] Profile page matches reference design visually
- [x] Real user data appears in dashboard navigation
- [x] Theme selector works and persists
- [x] Language selector works and persists
- [x] Activity timeline displays and groups events correctly
- [x] All API integrations work with proper error handling
- [x] UserContext provides data to all consuming components
- [x] Page is responsive on mobile, tablet, and desktop
- [x] All unit tests pass
- [x] All e2e tests pass
- [x] No console errors or warnings
- [x] Accessibility audit passes
- [x] Code follows TDD principles (tests written first)
- [x] Code follows SOLID principles from constitution
- [x] Code is properly documented

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
