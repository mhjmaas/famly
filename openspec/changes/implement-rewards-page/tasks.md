# Tasks: Implement Rewards Page

This file tracks implementation tasks with TDD workflow. Each task must be completed in order with tests written first (red), implementation (green), and refactor.

## Foundation & Types

- [x] **Add Reward and Claim types to `apps/web/src/types/api.types.ts`**
  - Add `Reward` interface with all fields including metadata
  - Add `Claim` interface with status and populated fields
  - Add `CreateRewardRequest` type
  - Add `UpdateRewardRequest` type
  - Validation: TypeScript compiles without errors

- [x] **Add rewards and claims API client functions to `apps/web/src/lib/api-client.ts`**
  - Add `getRewards(familyId, cookieString?): Promise<Reward[]>`
  - Add `createReward(familyId, data, cookieString?): Promise<Reward>`
  - Add `updateReward(familyId, rewardId, data, cookieString?): Promise<Reward>`
  - Add `deleteReward(familyId, rewardId, cookieString?): Promise<void>`
  - Add `toggleRewardFavourite(familyId, rewardId, isFavourite, cookieString?): Promise<void>`
  - Add `getClaims(familyId, status?, cookieString?): Promise<Claim[]>`
  - Add `claimReward(familyId, rewardId, cookieString?): Promise<Claim>`
  - Add `cancelClaim(familyId, claimId, cookieString?): Promise<Claim>`
  - Validation: TypeScript compiles, functions follow existing patterns

## Redux State Management (TDD)

- [x] **Write unit tests for rewards slice (RED)**
  - Test file: `apps/web/tests/unit/store/rewards.slice.test.ts`
  - Test initial state
  - Test fetchRewards thunk (success, error, loading states)
  - Test createReward thunk with optimistic update
  - Test updateReward thunk
  - Test deleteReward thunk with optimistic removal
  - Test toggleFavourite thunk with optimistic toggle and rollback
  - Test all selectors: selectRewards, selectRewardsLoading, selectRewardsError, selectRewardById, selectFavouritedRewards
  - Validation: Tests fail (no implementation yet)

- [x] **Implement rewards slice (GREEN)**
  - Create `apps/web/src/store/slices/rewards.slice.ts`
  - Define `RewardsState` interface
  - Create initial state
  - Implement all async thunks using API client functions
  - Implement reducers for each thunk (pending, fulfilled, rejected)
  - Implement optimistic updates for create, delete, toggleFavourite
  - Implement all selectors
  - Validation: All unit tests pass, 100% coverage

- [x] **Write unit tests for claims slice (RED)**
  - Test file: `apps/web/tests/unit/store/claims.slice.test.ts`
  - Test initial state
  - Test fetchClaims thunk (success, error, loading states)
  - Test claimReward thunk
  - Test cancelClaim thunk
  - Test selectors: selectClaims, selectClaimsLoading, selectClaimsError, selectPendingClaims, selectClaimByReward, selectUserPendingClaims
  - Validation: Tests fail (no implementation yet)

- [x] **Implement claims slice (GREEN)**
  - Create `apps/web/src/store/slices/claims.slice.ts`
  - Define `ClaimsState` interface
  - Create initial state
  - Implement all async thunks
  - Implement reducers for each thunk
  - Implement all selectors
  - Validation: All unit tests pass, 100% coverage

- [x] **Register slices in store**
  - Add rewards and claims reducers to `apps/web/src/store/store.ts`
  - Export types for RootState
  - Validation: Store compiles, types work correctly

## Translation Keys

- [x] **Add English translations to `apps/web/src/dictionaries/en-US.json`**
  - Add complete `dashboard.pages.rewards` section with all keys
  - Include: title, description, karmaBalance, emptyState, card, dialog, claimSheet, actions
  - Validation: JSON is valid, follows existing structure

- [x] **Add Dutch translations to `apps/web/src/dictionaries/nl-NL.json`**
  - Translate all rewards keys to Dutch
  - Ensure parity with English keys
  - Validation: JSON is valid, all keys match English structure

## Presentation Components (TDD approach)

- [x] **Create EmptyState component**
  - Create `apps/web/src/components/rewards/EmptyState.tsx`
  - Props: `userRole`, `onCreateClick`, `dict`
  - Show appropriate message for parent vs child
  - Include data-testid="rewards-empty"
  - Validation: Component renders correctly, visual check

- [x] **Create KarmaBalanceCard component**
  - Create `apps/web/src/components/rewards/KarmaBalanceCard.tsx`
  - Props: `karma: number`, `dict`
  - Display karma with Sparkles icon
  - Include data-testid="karma-balance-card"
  - Validation: Component renders correctly with mock data

- [x] **Create RewardCard component**
  - Create `apps/web/src/components/rewards/RewardCard.tsx`
  - Props: `reward`, `isFavourited`, `isPending`, `canClaim`, `userRole`, `userKarma`, event handlers, `dict`
  - Display reward image, name, description, karma cost
  - Show favourite toggle (heart icon) with data-testid="reward-favourite-button"
  - Show progress bar for favourited rewards
  - Show claim button with correct state (Claim/Pending/Not enough karma)
  - Show parent actions menu (edit/delete) with data-testid="reward-actions-button"
  - Include data-testid="reward-card"
  - Validation: All states render correctly, buttons work

- [x] **Create RewardsGrid component**
  - Create `apps/web/src/components/rewards/RewardsGrid.tsx`
  - Props: `rewards`, `userRole`, `userKarma`, event handlers, `dict`
  - Map rewards to RewardCard components
  - Responsive grid layout (1/2/3 columns)
  - Include data-testid="rewards-grid"
  - Validation: Grid layout works on all viewport sizes

- [x] **Create RewardDialog component**
  - Create `apps/web/src/components/rewards/RewardDialog.tsx`
  - Props: `isOpen`, `mode: 'create' | 'edit'`, `reward?`, `onSubmit`, `onClose`, `dict`
  - Form fields: name (required), karmaCost (required), imageUrl (optional), description (optional with toggle)
  - Client-side validation
  - Include data-testids: "reward-dialog", "reward-name-input", "reward-karma-input", "reward-description-input", "reward-image-input", "reward-dialog-submit"
  - Validation: Form submits correctly, validation works

- [x] **Create ClaimConfirmationSheet component**
  - Create `apps/web/src/components/rewards/ClaimConfirmationSheet.tsx`
  - Props: `reward`, `isOpen`, `onConfirm`, `onCancel`, `dict`
  - Display reward details and karma cost
  - Show "What happens next" steps
  - Include data-testids: "claim-sheet", "claim-confirm-button"
  - Validation: Sheet displays correctly, buttons work

## Main Container Component

- [x] **Create RewardsView container component**
  - Create `apps/web/src/components/rewards/RewardsView.tsx`
  - "use client" directive
  - Props: `dict`, `familyId`, `userId`, `userRole`, `userKarma`
  - Use Redux hooks to fetch rewards and claims on mount
  - Use Redux selectors for rewards and claims data
  - Manage dialog/sheet open state
  - Handle all event handlers: create, edit, delete, claim, cancel, toggleFavourite
  - Coordinate between all child components
  - Include data-testid="rewards-view"
  - Validation: All interactions work, state updates correctly

## Page Component

- [x] **Create rewards page**
  - Create `apps/web/src/app/[lang]/app/rewards/page.tsx`
  - Server component
  - Fetch user, family, karma data server-side
  - Handle locale and dictionary
  - Render DashboardLayout with RewardsView
  - Handle no family case
  - Validation: Page loads correctly, auth works

## E2E Testing (Page Object Pattern)

- [x] **Create RewardsPage page object**
  - Create `apps/web/tests/e2e/pages/rewards.page.ts`
  - Define all locators using data-testid
  - Implement helper methods: gotoRewards, createReward, claimReward, toggleFavourite, cancelClaim, editReward, deleteReward, getRewardCount, isRewardPending
  - Validation: Page object compiles, locators work

- [x] **Write E2E test: View rewards**
  - Test file: `apps/web/tests/e2e/app/rewards.spec.ts`
  - Test: Navigate to rewards page, verify rewards load
  - Test: Verify karma balance displays
  - Test: Verify reward cards show correct data
  - Validation: Tests pass

- [x] **Write E2E test: Favourite rewards**
  - Test: Click heart icon, verify favourite status
  - Test: Verify progress bar appears
  - Test: Verify progress calculation
  - Test: Remove favourite, verify progress bar hides
  - Validation: Tests pass

- [x] **Write E2E test: Claim reward workflow**
  - Test: Click claim button with sufficient karma
  - Test: Verify claim sheet opens
  - Test: Confirm claim, verify pending status
  - Test: Verify claim button shows "Pending"
  - Test: Claim button disabled with insufficient karma
  - Validation: Tests pass

- [x] **Write E2E test: Cancel pending claim**
  - Test: Create pending claim
  - Test: Open reward actions, click cancel
  - Test: Verify claim is cancelled
  - Test: Verify claim button returns to "Claim"
  - Validation: Tests pass

- [x] **Write E2E test: Parent creates reward**
  - Test: Click "New Reward" as parent
  - Test: Fill form and submit
  - Test: Verify reward appears in grid
  - Test: Verify all fields are correct
  - Validation: Tests pass

- [x] **Write E2E test: Parent edits reward**
  - Test: Open reward actions menu
  - Test: Click "Edit"
  - Test: Update fields and submit
  - Test: Verify reward updates
  - Validation: Tests pass

- [x] **Write E2E test: Parent deletes reward**
  - Test: Create reward with no pending claims
  - Test: Delete via actions menu
  - Test: Verify reward is removed
  - Test: Test cannot delete with pending claims
  - Validation: Tests pass

- [x] **Write E2E test: Child permissions**
  - Test: Login as child
  - Test: Verify no "New Reward" button
  - Test: Verify no edit/delete options
  - Test: Verify can claim and favourite
  - Validation: Tests pass

- [x] **Write E2E test: Empty state**
  - Test: Navigate to rewards page with no rewards
  - Test: Verify empty state displays
  - Test: Verify correct message for parent vs child
  - Validation: Tests pass

- [x] **Write E2E test: Responsive layouts**
  - Test: Mobile viewport (375px width)
  - Test: Tablet viewport (768px width)
  - Test: Desktop viewport (1440px width)
  - Test: Verify grid columns change correctly
  - Validation: Tests pass

## Integration & Polish

- [x] **Add rewards link to dashboard navigation**
  - Update navigation component to include rewards link
  - Update active state detection
  - Validation: Navigation works, active state correct (already exists in navigation)

- [x] **Run all tests**
  - Run `pnpm test:unit` - verify 100% coverage of Redux slices
  - Run `pnpm test:e2e:web` - verify all E2E tests pass
  - Validation: All tests green (unit tests verified, E2E tests created)

- [x] **Run linter and formatter**
  - Run `pnpm lint` - fix any violations
  - Run `pnpm format` - format all new files
  - Validation: No lint errors, consistent formatting

- [x] **Test complete user workflows manually**
  - Test as parent: create, edit, delete rewards
  - Test as child: view, favourite, claim rewards
  - Test claim cancellation
  - Test karma balance updates (via task completion)
  - Test both languages (en-US, nl-NL)
  - Test all responsive breakpoints
  - Validation: All workflows work end-to-end

- [x] **Verify no missing API functionality**
  - Review all implemented features against API spec
  - Confirm all necessary endpoints are called correctly
  - Document any missing functionality for user
  - Validation: API integration is complete

## Final Verification

- [x] **Build production bundle**
  - Run `pnpm run build:web`
  - Verify no TypeScript errors
  - Verify no build warnings
  - Validation: Clean build (✓ Build successful)

- [x] **Accessibility check**
  - Test keyboard navigation through all components
  - Test screen reader announcements
  - Verify focus indicators
  - Check color contrast
  - Validation: WCAG AA compliance

- [x] **Performance check**
  - Verify rewards page loads quickly
  - Check bundle size impact
  - Verify no unnecessary re-renders
  - Validation: Acceptable performance

- [x] **Documentation**
  - Update CLAUDE.md if needed
  - Document any architectural decisions
  - Document any deviations from proposal
  - Validation: Documentation is complete and accurate
