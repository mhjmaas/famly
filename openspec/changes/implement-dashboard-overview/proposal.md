# Proposal: implement-dashboard-overview

## Summary
Implement the dashboard overview page (`/app/page.tsx`) that displays summary cards showing user karma, pending tasks count, and potential karma, along with two main sections: "Your Pending Tasks" and "Reward Progress" for favorited rewards. This change implements the dashboard page according to the reference design, focusing on tasks and rewards integration.

## Motivation
Currently, the dashboard page (`/app/page.tsx`) shows a placeholder "coming soon" message. Users need a central overview page that shows their current status at a glance: available karma, pending tasks, and progress toward favorite rewards. This dashboard serves as the home screen of the application and should provide immediate value by surfacing the most relevant information.

The reference design in `reference/v0-famly/components/dashboard-overview.tsx` and `reference/v0-famly/app/app/page.tsx` provides a clear visual specification that includes:
- Three summary cards at the top (Available Karma, Pending Tasks, Potential Karma)
- A "Your Pending Tasks" section showing the user's pending tasks with quick-view details
- A "Reward Progress" section showing favorited rewards with progress bars toward earning them

## Scope

### In Scope
- Dashboard overview page component displaying user-specific data
- Three summary cards (karma stats and task counts)
- "Your Pending Tasks" section with task cards showing name, description, due date, and karma
- "Reward Progress" section with favorited rewards showing images, progress bars, and karma requirements
- Empty states for both tasks and rewards sections
- Responsive layout (mobile, tablet, desktop)
- Full internationalization support (en-US, nl-NL)
- Redux integration for tasks, rewards, karma, and user data
- E2E tests using Playwright with page object pattern
- 100% unit test coverage for new Redux selectors and derived state logic

### Out of Scope
- Task creation, editing, or deletion (already exists on tasks page)
- Reward claiming or management (already exists on rewards page)
- Dashboard customization or widget configuration
- Unread messages section (chat feature not yet implemented)
- Additional dashboard widgets beyond tasks and rewards
- Real-time updates or websocket integration

## Dependencies
- Existing `web-tasks` specification and implementation
- Existing `web-rewards` specification and implementation
- Existing `web-dashboard` specification (layout/navigation)
- Redux slices: `tasks.slice.ts`, `rewards.slice.ts`, `karma.slice.ts`, `user.slice.ts`
- API endpoints: `GET /v1/families/{familyId}/tasks`, `GET /v1/families/{familyId}/rewards`
- Shadcn/ui components: Card, Badge, Button, Progress
- Translations in `dictionaries/en-US.json` and `dictionaries/nl-NL.json`

## Alternatives Considered

### Alternative 1: Server-Side Data Fetching
**Description**: Fetch all dashboard data server-side in the page component using the Data Access Layer (DAL), similar to how user and karma data is fetched in the root layout.

**Pros**:
- Faster initial page load with server-rendered content
- No loading spinner on first render
- SEO benefits (though dashboard is authenticated)

**Cons**:
- Requires extending DAL to fetch tasks and rewards
- More complex server/client state synchronization
- Doesn't leverage existing Redux patterns used throughout the app
- Reference design shows client-side data patterns

**Decision**: Not chosen. The dashboard will use client-side Redux fetching to maintain consistency with existing tasks and rewards pages, and because real-time updates are more valuable than SSR for authenticated dashboard views.

### Alternative 2: Create Separate Dashboard Redux Slice
**Description**: Create a new `dashboard.slice.ts` that fetches and computes all dashboard-specific data, rather than composing from existing slices.

**Pros**:
- Single source of truth for dashboard data
- Could optimize API calls (single endpoint for dashboard data)
- Centralized dashboard state management

**Cons**:
- Duplicates data already in tasks, rewards, and karma slices
- Requires new API endpoint
- Harder to keep in sync when tasks/rewards are modified elsewhere
- Violates DRY principles

**Decision**: Not chosen. The dashboard will compose data from existing Redux slices using selectors, maintaining a single source of truth for tasks, rewards, and karma across the application.

### Alternative 3: Show All Tasks vs. Just Pending
**Description**: Display all user tasks (including completed) on the dashboard instead of only pending tasks.

**Pros**:
- Provides complete task history at a glance
- Shows user's accomplishments

**Cons**:
- Dashboard becomes cluttered with irrelevant information
- Reference design specifically shows pending tasks only
- Completed tasks are better viewed on the dedicated tasks page

**Decision**: Not chosen. The dashboard will show only pending tasks (where `completedAt === null`) to focus on actionable items, matching the reference design and keeping the overview concise.

## Success Criteria
1. Dashboard page displays summary cards with correct real-time data from Redux
2. "Your Pending Tasks" section shows up to 3 pending tasks assigned to the current user
3. "Reward Progress" section shows all favorited rewards with accurate progress calculations
4. Empty states display when user has no pending tasks or no favorited rewards
5. Dashboard layout is fully responsive across mobile, tablet, and desktop viewports
6. All text content is translated for en-US and nl-NL locales
7. E2E tests cover all dashboard scenarios with 100% critical path coverage
8. Unit tests achieve 100% coverage for dashboard-specific selectors and utilities
9. Page loads and renders within 2 seconds with typical data volumes (10 tasks, 5 rewards)

## Open Questions
1. **How many tasks should be shown in "Your Pending Tasks"?**
   - Reference shows 3 tasks
   - Proposal: Show up to 3 tasks, ordered by due date (soonest first, then by creation date)

2. **Should the dashboard refetch data on every visit or rely on cached Redux state?**
   - Proposal: Refetch on mount if data is stale (older than 5 minutes), otherwise use cached Redux state

3. **What constitutes "potential karma"?**
   - Proposal: Sum of karma from all pending tasks assigned to the user (matches reference design logic)

4. **Should we show overdue tasks prominently?**
   - Reference design doesn't highlight overdue tasks differently
   - Proposal: Follow reference design; tasks page handles overdue indicators

5. **Should clicking a task card navigate to the task details or tasks page?**
   - Proposal: Clicking a task card navigates to `/app/tasks` (no task detail view exists yet)

## Related Changes
- None (this is a standalone feature implementation)

## Notes
- The reference design includes an "Unread Messages" section which is explicitly out of scope since the chat feature doesn't exist yet
- The implementation will closely follow the reference design's visual structure and component breakdown
- Progress bar calculations must handle edge cases (karma > requirement, 0 karma, etc.)
- Task cards on dashboard are read-only; full task management is on the tasks page
