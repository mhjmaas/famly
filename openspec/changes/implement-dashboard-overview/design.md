# Design: implement-dashboard-overview

## Architecture Overview

The dashboard overview page follows a component composition pattern, breaking down the large monolithic reference design (`dashboard-overview.tsx`) into smaller, focused components that align with the project's existing patterns (similar to how tasks and rewards pages are structured).

### Component Hierarchy

```
apps/web/src/app/[lang]/app/page.tsx (Dashboard Page)
└── DashboardLayout (from existing web-dashboard)
    └── DashboardOverview (new container component)
        ├── DashboardHeader (new, mobile-only heading)
        ├── DashboardSummaryCards (new)
        │   ├── KarmaCard (new)
        │   ├── PendingTasksCard (new)
        │   └── PotentialKarmaCard (new)
        ├── PendingTasksSection (new)
        │   ├── SectionHeader (new, reusable)
        │   ├── EmptyTasksState (new)
        │   └── TaskCard[] (new, simplified from tasks page)
        └── RewardProgressSection (new)
            ├── SectionHeader (new, reusable)
            ├── EmptyRewardsState (new)
            └── RewardProgressCard[] (new, adapted from rewards page)
```

## Data Flow

### Redux State Composition

The dashboard does NOT introduce a new Redux slice. Instead, it composes data from existing slices:

```typescript
// Data sources
- state.user.profile → current user info (id, name, role)
- state.karma.balances[userId] → user's current karma
- state.tasks.tasks → all family tasks
- state.rewards.rewards → all family rewards

// Computed in component via useMemo
- pendingTasks = tasks.filter(t => !t.completedAt && isAssignedToUser(t, userId))
- potentialKarma = pendingTasks.reduce((sum, t) => sum + (t.metadata?.karma || 0), 0)
- favoritedRewards = rewards.filter(r => r.isFavourite)
```

### Data Fetching Strategy

1. **On Component Mount**:
   - Check if tasks data is stale (lastFetch older than 5 minutes)
   - Check if rewards data is stale
   - Dispatch `fetchTasks(familyId)` if stale
   - Dispatch `fetchRewards(familyId)` if stale
   - Dispatch `fetchKarma({ familyId, userId })` if not already loaded

2. **Caching**:
   - Redux state persists across navigation
   - "Stale" threshold: 5 minutes (configurable constant)
   - No aggressive polling; user can refresh page to update

3. **Loading States**:
   - Show skeleton cards for summary section while karma is loading
   - Show skeleton cards for tasks section while tasks are loading
   - Show skeleton cards for rewards section while rewards are loading
   - Sections load independently (don't block each other)

## Key Design Decisions

### Decision 1: Component Decomposition

**Decision**: Break the reference design into 10+ smaller components instead of one large component.

**Rationale**:
- The reference design's `DashboardOverview` component is 280 lines with mixed concerns
- Project pattern (tasks page, rewards page) favors small, focused components
- Easier to test individual components in isolation
- Better code reusability (e.g., `SectionHeader` used by both sections)
- Clearer separation of concerns (presentation vs. data logic)

**Components to Create**:
1. `DashboardOverview` - Container, handles data fetching and composition
2. `DashboardHeader` - Mobile-only heading section
3. `KarmaCard` - Summary card for available karma
4. `PendingTasksCard` - Summary card for pending tasks count
5. `PotentialKarmaCard` - Summary card for potential karma from pending tasks
6. `SectionHeader` - Reusable section header with title and "View All" link
7. `TaskCard` - Simplified, read-only task card for dashboard (adapted from tasks page)
8. `EmptyTasksState` - Empty state for when user has no pending tasks
9. `RewardProgressCard` - Reward card with progress bar (adapted from rewards page)
10. `EmptyRewardsState` - Empty state for when user has no favorited rewards

### Decision 2: Task Assignment Logic

**Decision**: Use existing task assignment utility from tasks page instead of reimplementing.

**Rationale**:
- Tasks page already has logic to determine if a task is "assigned to user"
- Assignment types: `unassigned`, `role: "parent"|"child"`, `member: memberId`
- Reusing existing logic ensures consistency and avoids bugs
- If the logic exists in tasks page, we'll extract it to a shared utility file: `apps/web/src/lib/task-utils.ts`

**Implementation**:
```typescript
// lib/task-utils.ts (new or existing)
export function isTaskAssignedToUser(
  task: Task,
  userId: string,
  userRole: string
): boolean {
  if (!task.assignment) return false;

  switch (task.assignment.type) {
    case 'member':
      return task.assignment.memberId === userId;
    case 'role':
      return task.assignment.role === userRole;
    case 'unassigned':
      return false; // Dashboard doesn't show unassigned tasks
    default:
      return false;
  }
}
```

### Decision 3: Progress Bar Calculation

**Decision**: Calculate progress as `min((userKarma / rewardCost) * 100, 100)` with separate text for "X more karma needed" vs. "Ready to claim!".

**Rationale**:
- Matches reference design logic
- Progress bar capped at 100% to avoid visual overflow
- Clear messaging when user has enough karma
- Calculation is simple enough to inline in component (no utility needed)

**Edge Cases Handled**:
- User has 0 karma → progress bar at 0%
- User karma > reward cost → progress bar at 100%, show "You have enough karma!"
- Reward cost is 0 (invalid data) → show "N/A" or hide progress bar

### Decision 4: Task Ordering and Limit

**Decision**: Show up to 3 pending tasks, ordered by due date (soonest first), then by `createdAt` descending.

**Rationale**:
- Reference design shows 3 tasks
- Prioritizes urgent tasks (due soon) to surface actionable items
- Fallback to newest tasks if no due dates
- Simple sorting logic:
  ```typescript
  const sortedTasks = pendingTasks
    .sort((a, b) => {
      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && b.dueDate) {
        // Sort by due date (soonest first)
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      // If neither has due date, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 3);
  ```

### Decision 5: Responsiveness Strategy

**Decision**: Use Tailwind responsive classes to adapt layout at `md` (768px) and `lg` (1024px) breakpoints.

**Responsive Behavior**:
- **Mobile (< 768px)**:
  - Summary cards stack vertically (1 column)
  - Tasks and rewards stack vertically (1 column)
  - Hide desktop header, show mobile header
  - Compact card padding

- **Tablet (768px - 1023px)**:
  - Summary cards in 3 columns
  - Tasks and rewards still stack vertically (1 column each)
  - Show desktop header

- **Desktop (>= 1024px)**:
  - Summary cards in 3 columns
  - Tasks and rewards side-by-side (2 columns, 50% each)
  - Show desktop header
  - Full padding

**Implementation Pattern**:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Summary cards */}
</div>

<div className="grid gap-6 lg:grid-cols-2">
  {/* Tasks and Rewards sections */}
</div>
```

### Decision 6: Translations Structure

**Decision**: Add all dashboard translations under a new `dashboard` key in the dictionary files.

**Translation Keys**:
```json
{
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome back, {{name}}!",
    "subtitle": "Here's what's happening with your family",
    "summary": {
      "availableKarma": "Available Karma",
      "pendingTasks": "Pending Tasks",
      "potentialKarma": "Potential Karma"
    },
    "sections": {
      "yourPendingTasks": "Your Pending Tasks",
      "rewardProgress": "Reward Progress",
      "viewAll": "View All"
    },
    "emptyStates": {
      "noTasks": "No pending tasks",
      "noTasksDescription": "You're all caught up!",
      "noRewards": "No favorited rewards",
      "noRewardsDescription": "Favorite rewards to track your progress"
    },
    "task": {
      "karma": "{{count}} Karma",
      "due": "Due {{date}}"
    },
    "reward": {
      "progress": "{{current}} / {{required}}",
      "remaining": "{{count}} more karma needed",
      "ready": "You have enough karma!"
    }
  }
}
```

### Decision 7: Redux Selectors

**Decision**: Create memoized selectors for dashboard-specific data to avoid recomputation on every render.

**New Selectors** (added to existing slice files or new `dashboardSelectors.ts`):
```typescript
// In apps/web/src/store/selectors/dashboard.selectors.ts (new file)
import { createSelector } from '@reduxjs/toolkit';
import { selectTasks } from '../slices/tasks.slice';
import { selectUser } from '../slices/user.slice';

export const selectPendingTasksForUser = createSelector(
  [selectTasks, selectUser],
  (tasks, user) => {
    if (!user) return [];
    return tasks
      .filter(t => !t.completedAt && isTaskAssignedToUser(t, user.id, user.role))
      .sort((a, b) => {
        // Sorting logic (as described above)
      })
      .slice(0, 3);
  }
);

export const selectPotentialKarma = createSelector(
  [selectPendingTasksForUser],
  (pendingTasks) => {
    return pendingTasks.reduce((sum, t) => sum + (t.metadata?.karma || 0), 0);
  }
);
```

**Rationale**:
- Memoization prevents unnecessary recalculations
- Selectors can be unit tested independently
- Keeps component logic clean and focused on presentation

### Decision 8: E2E Testing Strategy

**Decision**: Create a new `DashboardPage` page object and test file following the pattern established by tasks and rewards E2E tests.

**Test Structure**:
- **File**: `apps/web/tests/e2e/app/dashboard.spec.ts`
- **Page Object**: `apps/web/tests/e2e/pages/dashboard.page.ts`
- **Test Scenarios**:
  1. Display summary cards with correct data
  2. Display pending tasks section with tasks
  3. Display reward progress section with favorited rewards
  4. Show empty states for tasks and rewards
  5. Navigate to tasks page from "View All"
  6. Navigate to rewards page from "View All"
  7. Responsive layout on mobile, tablet, desktop

**Page Object Pattern**:
```typescript
export class DashboardPage {
  readonly page: Page;
  readonly karmaCard: Locator;
  readonly pendingTasksCard: Locator;
  readonly potentialKarmaCard: Locator;
  readonly tasksSection: Locator;
  readonly rewardsSection: Locator;
  readonly taskCards: Locator;
  readonly rewardCards: Locator;
  readonly tasksViewAll: Locator;
  readonly rewardsViewAll: Locator;
  // ... more locators

  constructor(page: Page) {
    this.page = page;
    this.karmaCard = page.getByTestId('dashboard-karma-card');
    // ... initialize all locators
  }

  async goto(locale = 'en-US') {
    await this.page.goto(`/${locale}/app`);
  }

  // Helper methods
  async getKarmaAmount(): Promise<number> { ... }
  async getPendingTasksCount(): Promise<number> { ... }
  // ... more helpers
}
```

## Component File Structure

```
apps/web/src/
├── app/[lang]/app/
│   └── page.tsx (updated to use DashboardOverview)
├── components/
│   └── dashboard/
│       ├── dashboard-overview.tsx (container)
│       ├── dashboard-header.tsx
│       ├── dashboard-summary-cards.tsx
│       ├── karma-card.tsx
│       ├── pending-tasks-card.tsx
│       ├── potential-karma-card.tsx
│       ├── section-header.tsx
│       ├── pending-tasks-section.tsx
│       ├── task-card.tsx
│       ├── empty-tasks-state.tsx
│       ├── reward-progress-section.tsx
│       ├── reward-progress-card.tsx
│       └── empty-rewards-state.tsx
├── lib/
│   └── task-utils.ts (extracted utility)
└── store/
    └── selectors/
        └── dashboard.selectors.ts (new)
```

## Error Handling

### API Errors
- If tasks fetch fails → show error state in tasks section
- If rewards fetch fails → show error state in rewards section
- Errors are isolated to their sections (don't break entire dashboard)

### Empty States
- No pending tasks → show friendly empty state with encouraging message
- No favorited rewards → show empty state with hint to favorite rewards
- Both empty → dashboard still shows summary cards with 0 values

### Missing Data
- User not loaded → show loading spinner for entire dashboard
- Karma not loaded → show "—" in karma card
- Family not loaded → redirect to authentication (existing behavior)

## Performance Considerations

### Optimization 1: Memoized Selectors
- Use `createSelector` from Redux Toolkit to memoize derived data
- Prevents recalculation on unrelated state changes

### Optimization 2: Component Memoization
- Wrap pure presentational components with `React.memo`
- Prevents re-renders when props haven't changed
- Example: `KarmaCard`, `PendingTasksCard`, `PotentialKarmaCard`

### Optimization 3: Lazy Loading
- Not needed for dashboard (critical page, should load immediately)
- Components are small enough that code-splitting doesn't provide benefit

### Optimization 4: Data Staleness Check
- Only refetch if data is older than 5 minutes
- Prevents unnecessary API calls on rapid navigation
- User can refresh page to force update

## Security Considerations

1. **Authentication**: Page is already protected by existing auth middleware
2. **Authorization**: Users only see their own tasks and family rewards (enforced by API)
3. **XSS Prevention**: All user-generated content (task names, descriptions) rendered with React (auto-escaping)
4. **Data Leakage**: No sensitive data exposed beyond what's already accessible via tasks/rewards pages

## Accessibility

### Semantic HTML
- Use `<section>` for main dashboard sections
- Use `<h2>` for section headings
- Use `<article>` for task and reward cards

### ARIA Labels
- Summary cards have descriptive labels: `aria-label="Available Karma: 245"`
- "View All" links indicate destination: `aria-label="View all tasks"`

### Keyboard Navigation
- All interactive elements (links, buttons) are keyboard accessible
- Logical tab order (summary cards → tasks → rewards)
- Focus indicators visible

### Screen Reader Support
- Cards announce values clearly
- Progress bars have aria-valuenow, aria-valuemin, aria-valuemax attributes
- Empty states provide context

## Migration Notes

### Updating Existing Page
The current `/app/page.tsx` is a placeholder. We'll replace its content entirely with the new dashboard implementation. No migration of existing code is needed.

### Dictionary Updates
Add new `dashboard` key to both `en-US.json` and `nl-NL.json` with all required translations.

## Testing Strategy

### Unit Tests
1. **Dashboard Selectors** (`dashboard.selectors.test.ts`):
   - Test `selectPendingTasksForUser` with various task scenarios
   - Test `selectPotentialKarma` calculation
   - Test filtering logic (assignment, completion status)
   - Test sorting logic (due date, createdAt)
   - Coverage: 100%

2. **Task Utils** (`task-utils.test.ts`):
   - Test `isTaskAssignedToUser` for all assignment types
   - Test edge cases (missing assignment, invalid role)
   - Coverage: 100%

### E2E Tests
1. **Dashboard Display** (`dashboard.spec.ts`):
   - Load dashboard with data
   - Verify summary cards show correct values
   - Verify tasks section shows pending tasks
   - Verify rewards section shows favorited rewards
   - Verify "View All" links navigate correctly

2. **Empty States**:
   - Load dashboard with no pending tasks
   - Load dashboard with no favorited rewards
   - Verify empty state messages

3. **Responsive Layout**:
   - Test mobile viewport (375px)
   - Test tablet viewport (768px)
   - Test desktop viewport (1920px)
   - Verify layout adapts correctly

## Rollout Plan

### Phase 1: Foundation
- Create component files and structure
- Implement Redux selectors
- Add translations

### Phase 2: Implementation
- Implement summary cards
- Implement tasks section
- Implement rewards section
- Wire up Redux data flow

### Phase 3: Testing
- Write unit tests for selectors and utils
- Write E2E tests for all scenarios
- Verify accessibility compliance

### Phase 4: Polish
- Responsive design refinements
- Empty state messaging
- Loading state improvements
- Performance optimization

## Open Implementation Questions

1. **Should we add a "Refresh" button to manually refetch data?**
   - Leaning towards: No, user can refresh the browser
   - Rationale: Keeps UI clean, browser refresh is standard behavior

2. **Should task cards be clickable (navigate to tasks page)?**
   - Leaning towards: Yes, entire card clickable, navigates to `/app/tasks`
   - Rationale: Provides quick access to full task management

3. **Should reward cards be clickable (navigate to rewards page)?**
   - Leaning towards: Yes, entire card clickable, navigates to `/app/rewards`
   - Rationale: Consistent with task cards, provides quick access

4. **Should we show a loading skeleton or spinner?**
   - Leaning towards: Skeleton cards that match the final layout
   - Rationale: Better UX, avoids layout shift, feels faster

5. **Should we limit favorited rewards displayed?**
   - Leaning towards: Show all favorited rewards (no limit)
   - Rationale: Users control what's shown by favoriting, no arbitrary limit needed
