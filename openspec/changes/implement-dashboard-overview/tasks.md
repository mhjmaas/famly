# Tasks: implement-dashboard-overview

## Foundation

- [ ] Create component directory structure `apps/web/src/components/dashboard/`
- [ ] Create selectors file `apps/web/src/store/selectors/dashboard.selectors.ts`
- [ ] Create task utils file `apps/web/src/lib/task-utils.ts` with `isTaskAssignedToUser` function
- [ ] Add dashboard translations to `apps/web/src/dictionaries/en-US.json`
- [ ] Add dashboard translations to `apps/web/src/dictionaries/nl-NL.json`
- [ ] Update `apps/web/src/i18n/types.ts` to include dashboard translation types

## Redux Selectors

- [ ] Implement `selectPendingTasksForUser` selector with filtering and sorting logic
- [ ] Implement `selectPotentialKarma` selector
- [ ] Write unit tests for `selectPendingTasksForUser` covering all scenarios
- [ ] Write unit tests for `selectPotentialKarma` covering edge cases
- [ ] Write unit tests for `isTaskAssignedToUser` utility function
- [ ] Verify 100% unit test coverage for selectors and utils

## Summary Cards Components

- [ ] Create `karma-card.tsx` component displaying available karma with Sparkles icon
- [ ] Create `pending-tasks-card.tsx` component displaying task count with CheckCircle icon
- [ ] Create `potential-karma-card.tsx` component displaying potential karma with Sparkles icon
- [ ] Create `dashboard-summary-cards.tsx` container component grouping the three cards
- [ ] Add data-testid attributes to all summary card elements
- [ ] Implement responsive grid layout for summary cards (1 column mobile, 3 columns tablet/desktop)
- [ ] Add Tailwind classes for card styling (bg-muted/50, padding, rounded corners)

## Tasks Section Components

- [ ] Create `section-header.tsx` reusable component with title and "View All" button
- [ ] Create `task-card.tsx` simplified read-only task card component
- [ ] Add task card display logic: name, description, due date badge, karma badge
- [ ] Add data-testid attributes to all task card elements (task-card, task-name, task-description, task-due-date, task-karma)
- [ ] Create `empty-tasks-state.tsx` component with CheckCircle icon and encouraging message
- [ ] Create `pending-tasks-section.tsx` container component
- [ ] Implement task filtering and sorting in section component
- [ ] Add click handler to task cards navigating to `/app/tasks`
- [ ] Add click handler to "View All" button navigating to `/app/tasks`

## Rewards Section Components

- [ ] Create `reward-progress-card.tsx` component with image, name, karma, and progress bar
- [ ] Implement progress bar calculation logic (cap at 100%, calculate remaining karma)
- [ ] Add heart icon (filled red) to reward card
- [ ] Add data-testid attributes to all reward card elements
- [ ] Create `empty-rewards-state.tsx` component with Heart icon and hint message
- [ ] Create `reward-progress-section.tsx` container component
- [ ] Add click handler to reward cards navigating to `/app/rewards`
- [ ] Add click handler to "View All" button navigating to `/app/rewards`

## Dashboard Container

- [ ] Create `dashboard-header.tsx` component with welcome message (desktop only)
- [ ] Create `dashboard-overview.tsx` main container component
- [ ] Implement data fetching logic (check staleness, dispatch fetch actions)
- [ ] Implement loading states for summary cards, tasks, and rewards sections
- [ ] Compose all dashboard sections in correct layout
- [ ] Implement responsive layout: vertical stack mobile, two-column desktop (tasks + rewards)
- [ ] Add data-testid attributes to dashboard sections
- [ ] Update `apps/web/src/app/[lang]/app/page.tsx` to use `DashboardOverview` component

## E2E Testing

- [ ] Create `apps/web/tests/e2e/pages/dashboard.page.ts` page object
- [ ] Add all locators using data-testid attributes (summary cards, task cards, reward cards, buttons)
- [ ] Add helper methods: `goto`, `getKarmaAmount`, `getPendingTasksCount`, `getPotentialKarma`
- [ ] Create `apps/web/tests/e2e/app/dashboard.spec.ts` test file
- [ ] Write test: Display summary cards with correct data
- [ ] Write test: Display pending tasks section with tasks
- [ ] Write test: Display reward progress section with favorited rewards
- [ ] Write test: Show empty states for tasks and rewards
- [ ] Write test: Navigate to tasks page from "View All" button
- [ ] Write test: Navigate to rewards page from "View All" button
- [ ] Write test: Navigate to tasks page by clicking task card
- [ ] Write test: Navigate to rewards page by clicking reward card
- [ ] Write test: Responsive layout on mobile (375px width)
- [ ] Write test: Responsive layout on tablet (768px width)
- [ ] Write test: Responsive layout on desktop (1920px width)
- [ ] Write test: Display empty state when no pending tasks
- [ ] Write test: Display empty state when no favorited rewards

## Integration & Polish

- [ ] Test Redux integration: verify data flows correctly from slices to components
- [ ] Test translation switching: verify English and Dutch translations display correctly
- [ ] Test responsive behavior: verify layout adapts at breakpoints
- [ ] Test loading states: verify skeleton/spinner displays while fetching
- [ ] Test error handling: verify graceful degradation when API fails
- [ ] Verify accessibility: keyboard navigation, ARIA labels, screen reader support
- [ ] Run all E2E tests and verify they pass
- [ ] Run all unit tests and verify 100% coverage
- [ ] Manual testing: create test user with various data scenarios
- [ ] Performance check: verify page loads within 2 seconds

## Validation

- [ ] Run `openspec validate implement-dashboard-overview --strict`
- [ ] Run `pnpm run lint` and fix any linting errors
- [ ] Run `pnpm test:unit` and verify all unit tests pass
- [ ] Run `pnpm test:e2e:web` and verify all E2E tests pass
- [ ] Review code for adherence to constitution.md principles (DRY, KISS, SOLID)
- [ ] Verify all data-testid attributes follow naming conventions
- [ ] Verify all translations are present in both en-US and nl-NL
- [ ] Final review of component breakdown vs reference design
