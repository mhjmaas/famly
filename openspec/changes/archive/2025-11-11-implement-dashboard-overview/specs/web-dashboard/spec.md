# web-dashboard Specification Delta

## ADDED Requirements

### Requirement: Dashboard Overview Page
The web application MUST provide a dashboard overview page that displays user-specific summary information, pending tasks, and reward progress.

#### Scenario: Display dashboard overview page
- **GIVEN** an authenticated family member navigates to `/[lang]/app`
- **WHEN** the page loads
- **THEN** the page displays three summary cards showing:
  - Available Karma with the user's current karma balance
  - Pending Tasks count showing number of uncompleted tasks assigned to the user
  - Potential Karma showing total karma from user's pending tasks
- **AND** the page displays a "Your Pending Tasks" section
- **AND** the page displays a "Reward Progress" section for favorited rewards
- **AND** all text is translated according to the current locale
- **AND** the layout adapts responsively to mobile, tablet, and desktop viewports

#### Scenario: Display welcome header on desktop
- **GIVEN** an authenticated family member on desktop (viewport >= 1024px)
- **WHEN** the dashboard page loads
- **THEN** a welcome message "Welcome back, [FirstName]!" is displayed
- **AND** a subtitle "Here's what's happening with your family" is shown
- **AND** the header is hidden on mobile (< 1024px)

#### Scenario: Summary cards display correct data
- **GIVEN** a user with 245 karma, 3 pending tasks, and 30 potential karma from those tasks
- **WHEN** the dashboard loads
- **THEN** the Available Karma card displays "245"
- **AND** the Pending Tasks card displays "3"
- **AND** the Potential Karma card displays "30"
- **AND** each card has appropriate icon styling (Sparkles for karma, CheckCircle for tasks)

#### Scenario: Summary cards responsive layout
- **GIVEN** the dashboard page is loaded
- **WHEN** viewport width is less than 768px (mobile)
- **THEN** summary cards stack vertically in a single column
- **WHEN** viewport width is 768px-1023px (tablet)
- **THEN** summary cards display in three columns
- **WHEN** viewport width is >= 1024px (desktop)
- **THEN** summary cards display in three columns with full padding

#### Scenario: Data is fetched from Redux state
- **GIVEN** the dashboard component mounts
- **WHEN** Redux state contains stale or missing data
- **THEN** the component dispatches `fetchTasks(familyId)` to fetch tasks
- **AND** the component dispatches `fetchRewards(familyId)` to fetch rewards
- **AND** the component dispatches `fetchKarma({ familyId, userId })` to fetch karma
- **AND** loading states are managed independently for each section

### Requirement: Pending Tasks Section
The dashboard MUST display a section showing the user's pending tasks with key task information.

#### Scenario: Display pending tasks for current user
- **GIVEN** a user has 5 pending tasks assigned to them
- **WHEN** the dashboard loads
- **THEN** the "Your Pending Tasks" section displays up to 3 tasks
- **AND** each task card shows task name, description (if present), due date badge (if present), and karma badge (if present)
- **AND** tasks are ordered by due date (soonest first), then by creation date (newest first)
- **AND** a "View All" button links to `/app/tasks`

#### Scenario: Filter tasks by user assignment
- **GIVEN** a family has 10 tasks total:
  - 3 assigned to current user by member ID
  - 2 assigned to user's role (e.g., "parent")
  - 3 unassigned
  - 2 assigned to other members
- **WHEN** the dashboard loads for the current user
- **THEN** only 3 tasks are shown (the 3 assigned by member ID, or mix of member and role assignments)
- **AND** unassigned tasks are NOT shown
- **AND** other members' tasks are NOT shown

#### Scenario: Task card displays all metadata
- **GIVEN** a pending task with name "Take out the trash", description "Remember to separate recyclables", due date tomorrow, and 10 karma
- **WHEN** the task is rendered in the dashboard
- **THEN** the task name "Take out the trash" is displayed prominently
- **AND** the description "Remember to separate recyclables" is shown below
- **AND** a due date badge displays "Due [date]" with a Clock icon
- **AND** a karma badge displays "10 Karma" with a Sparkles icon

#### Scenario: Task card without optional fields
- **GIVEN** a pending task with only a name "Grocery shopping"
- **WHEN** the task is rendered
- **THEN** only the task name is displayed
- **AND** no description, due date, or karma badges are shown

#### Scenario: Empty state when no pending tasks
- **GIVEN** a user has no pending tasks assigned to them
- **WHEN** the dashboard loads
- **THEN** an empty state card is displayed in the tasks section
- **AND** the empty state shows an icon (CheckCircle)
- **AND** the empty state shows message "No pending tasks"
- **AND** the empty state shows description "You're all caught up!"

#### Scenario: Navigate to tasks page from section
- **GIVEN** the pending tasks section is displayed
- **WHEN** the user clicks the "View All" button
- **THEN** the user navigates to `/[lang]/app/tasks`

#### Scenario: Task cards are clickable
- **GIVEN** a task card is displayed
- **WHEN** the user clicks anywhere on the card
- **THEN** the user navigates to `/[lang]/app/tasks`

#### Scenario: Calculate potential karma correctly
- **GIVEN** the user has 3 pending tasks with karma values: 10, 0, 25
- **WHEN** calculating potential karma
- **THEN** the Potential Karma card displays "35" (10 + 0 + 25)

#### Scenario: Tasks ordered by due date
- **GIVEN** the user has 5 pending tasks:
  - TaskA: no due date, created Jan 5
  - TaskB: due Jan 15, created Jan 3
  - TaskC: due Jan 12, created Jan 4
  - TaskD: no due date, created Jan 6
  - TaskE: due Jan 10, created Jan 2
- **WHEN** the tasks are displayed
- **THEN** the order is: TaskE (due Jan 10), TaskC (due Jan 12), TaskB (due Jan 15)
- **AND** TaskA and TaskD are not shown (only top 3)

### Requirement: Reward Progress Section
The dashboard MUST display a section showing favorited rewards with progress toward earning them.

#### Scenario: Display favorited rewards with progress
- **GIVEN** a user has favorited 2 rewards:
  - RewardA: costs 50 karma
  - RewardB: costs 100 karma
- **AND** the user has 75 karma
- **WHEN** the dashboard loads
- **THEN** the "Reward Progress" section displays both rewards
- **AND** each reward card shows reward name, image, karma cost, and progress bar
- **AND** RewardA shows 100% progress (75/50) with "You have enough karma!" message
- **AND** RewardB shows 75% progress (75/100) with "25 more karma needed" message
- **AND** a "View All" button links to `/app/rewards`

#### Scenario: Reward card displays image
- **GIVEN** a favorited reward with imageUrl "/screen-time-reward.jpg"
- **WHEN** the reward card is rendered
- **THEN** the image is displayed in a 64x64px rounded container
- **AND** the image has alt text with the reward name

#### Scenario: Reward card displays name and karma
- **GIVEN** a favorited reward "Extra Screen Time" costing 50 karma
- **WHEN** the reward card is rendered
- **THEN** the reward name "Extra Screen Time" is displayed prominently
- **AND** the karma cost "50" is displayed with a Sparkles icon
- **AND** the user's current karma is displayed as "75 / 50"

#### Scenario: Progress bar calculation with sufficient karma
- **GIVEN** a reward costs 50 karma
- **AND** the user has 75 karma
- **WHEN** calculating the progress bar
- **THEN** the progress value is capped at 100% (not 150%)
- **AND** the progress bar is fully filled
- **AND** the message "You have enough karma!" is displayed in green

#### Scenario: Progress bar calculation with insufficient karma
- **GIVEN** a reward costs 100 karma
- **AND** the user has 75 karma
- **WHEN** calculating the progress bar
- **THEN** the progress value is 75%
- **AND** the progress bar is 75% filled
- **AND** the message "25 more karma needed" is displayed

#### Scenario: Reward with favorite heart indicator
- **GIVEN** a favorited reward is displayed
- **WHEN** the reward card is rendered
- **THEN** a heart icon is shown on the card
- **AND** the heart icon is filled with red color (fill-red-500)

#### Scenario: Empty state when no favorited rewards
- **GIVEN** a user has not favorited any rewards
- **WHEN** the dashboard loads
- **THEN** an empty state card is displayed in the rewards section
- **AND** the empty state shows an icon (Heart)
- **AND** the empty state shows message "No favorited rewards"
- **AND** the empty state shows description "Favorite rewards to track your progress"

#### Scenario: Navigate to rewards page from section
- **GIVEN** the reward progress section is displayed
- **WHEN** the user clicks the "View All" button
- **THEN** the user navigates to `/[lang]/app/rewards`

#### Scenario: Reward cards are clickable
- **GIVEN** a reward card is displayed
- **WHEN** the user clicks anywhere on the card
- **THEN** the user navigates to `/[lang]/app/rewards`

#### Scenario: Display all favorited rewards
- **GIVEN** a user has favorited 10 rewards
- **WHEN** the dashboard loads
- **THEN** all 10 rewards are displayed in the section
- **AND** no arbitrary limit is imposed on the number of rewards shown

### Requirement: Dashboard Translations
The dashboard page MUST support full internationalization for all text content.

#### Scenario: Display dashboard in English
- **GIVEN** the user's locale is set to "en-US"
- **WHEN** the dashboard page loads
- **THEN** the welcome message displays "Welcome back, [FirstName]!"
- **AND** the subtitle displays "Here's what's happening with your family"
- **AND** summary cards show "Available Karma", "Pending Tasks", "Potential Karma"
- **AND** section headers show "Your Pending Tasks", "Reward Progress"
- **AND** buttons show "View All"
- **AND** empty states show English messages
- **AND** karma badges show "X Karma" or "X karma points"

#### Scenario: Display dashboard in Dutch
- **GIVEN** the user's locale is set to "nl-NL"
- **WHEN** the dashboard page loads
- **THEN** all text is displayed in Dutch
- **AND** the welcome message uses Dutch translation
- **AND** all labels, buttons, and messages use Dutch translations

#### Scenario: Format dates according to locale
- **GIVEN** a task has due date January 15, 2025
- **WHEN** displayed in English locale
- **THEN** the date shows "Jan 15" or "January 15" format
- **WHEN** displayed in Dutch locale
- **THEN** the date shows "15 jan" or "15 januari" format

#### Scenario: Pluralization for karma
- **GIVEN** karma amounts of varying values
- **WHEN** displayed in badges or messages
- **THEN** English uses "1 karma point" vs "X karma points"
- **AND** Dutch uses "1 karmapunt" vs "X karmapunten"

### Requirement: Dashboard State Management
The dashboard MUST integrate with existing Redux slices without introducing new state.

#### Scenario: Compose data from multiple Redux slices
- **GIVEN** the dashboard component is rendering
- **WHEN** accessing data
- **THEN** user information comes from `state.user.profile`
- **AND** karma balance comes from `state.karma.balances[userId]`
- **AND** tasks list comes from `state.tasks.tasks`
- **AND** rewards list comes from `state.rewards.rewards`
- **AND** no new dashboard-specific Redux slice is created

#### Scenario: Use memoized selectors for derived data
- **GIVEN** the dashboard component renders
- **WHEN** computing pending tasks for the user
- **THEN** a memoized selector `selectPendingTasksForUser` is used
- **AND** the selector filters tasks by assignment and completion status
- **AND** the selector sorts tasks by due date and creation date
- **AND** the selector limits results to 3 tasks
- **AND** the selector only recomputes when tasks or user data changes

#### Scenario: Use memoized selector for potential karma
- **GIVEN** the dashboard component renders
- **WHEN** computing potential karma
- **THEN** a memoized selector `selectPotentialKarma` is used
- **AND** the selector sums karma from pending tasks
- **AND** the selector only recomputes when pending tasks change

#### Scenario: Refetch data when stale
- **GIVEN** the dashboard component mounts
- **WHEN** tasks data is older than 5 minutes
- **THEN** `fetchTasks(familyId)` is dispatched
- **WHEN** tasks data is less than 5 minutes old
- **THEN** `fetchTasks(familyId)` is NOT dispatched
- **AND** the same logic applies for rewards and karma

### Requirement: Dashboard Responsive Layout
The dashboard MUST adapt its layout across mobile, tablet, and desktop viewports.

#### Scenario: Mobile layout (< 768px)
- **GIVEN** viewport width is less than 768px
- **WHEN** the dashboard renders
- **THEN** the welcome header is hidden
- **AND** summary cards stack vertically in 1 column
- **AND** tasks section is full width
- **AND** rewards section is full width below tasks
- **AND** cards have compact padding

#### Scenario: Tablet layout (768px - 1023px)
- **GIVEN** viewport width is 768px to 1023px
- **WHEN** the dashboard renders
- **THEN** the welcome header is hidden
- **AND** summary cards display in 3 columns
- **AND** tasks section is full width
- **AND** rewards section is full width below tasks

#### Scenario: Desktop layout (>= 1024px)
- **GIVEN** viewport width is 1024px or greater
- **WHEN** the dashboard renders
- **THEN** the welcome header is visible
- **AND** summary cards display in 3 columns
- **AND** tasks and rewards sections are side-by-side in 2 columns (50% each)
- **AND** full padding is applied

### Requirement: Dashboard Accessibility
The dashboard page MUST meet accessibility standards for navigation and content.

#### Scenario: Semantic HTML structure
- **GIVEN** the dashboard page renders
- **WHEN** inspecting the HTML
- **THEN** the welcome section uses `<div>` with appropriate heading levels
- **AND** summary cards section uses semantic grouping
- **AND** tasks section uses `<section>` with `<h2>` heading
- **AND** rewards section uses `<section>` with `<h2>` heading
- **AND** individual cards use `<article>` or `<div>` with proper structure

#### Scenario: ARIA labels for summary cards
- **GIVEN** summary cards are rendered
- **WHEN** a screen reader encounters them
- **THEN** each card has an accessible description
- **AND** karma card announces "Available Karma: 245"
- **AND** pending tasks card announces "Pending Tasks: 3"
- **AND** potential karma card announces "Potential Karma: 30"

#### Scenario: Keyboard navigation through sections
- **GIVEN** a keyboard user on the dashboard
- **WHEN** they press Tab
- **THEN** focus moves through interactive elements in logical order
- **AND** focus order is: summary cards (if clickable) → task cards → "View All" button → reward cards → "View All" button
- **AND** all focus indicators are clearly visible

#### Scenario: Screen reader support for progress bars
- **GIVEN** a reward progress bar is displayed
- **WHEN** a screen reader encounters it
- **THEN** the progress bar has `role="progressbar"`
- **AND** it has `aria-valuenow` set to current karma
- **AND** it has `aria-valuemin` set to 0
- **AND** it has `aria-valuemax` set to reward karma cost
- **AND** it has `aria-label` describing the reward and progress

### Requirement: Dashboard Testing
The dashboard page MUST have comprehensive E2E tests and unit test coverage for selectors.

#### Scenario: E2E test for dashboard display
- **GIVEN** a test user with 245 karma, 3 pending tasks, and 2 favorited rewards
- **WHEN** the E2E test navigates to `/app`
- **THEN** the test verifies summary cards display correct values
- **AND** the test verifies 3 task cards are shown
- **AND** the test verifies 2 reward cards are shown
- **AND** the test verifies "View All" buttons are present

#### Scenario: E2E test for empty states
- **GIVEN** a test user with no pending tasks and no favorited rewards
- **WHEN** the E2E test navigates to `/app`
- **THEN** the test verifies empty state is shown for tasks section
- **AND** the test verifies empty state is shown for rewards section
- **AND** summary cards show 0 values

#### Scenario: E2E test for navigation
- **GIVEN** the dashboard page is loaded
- **WHEN** the test clicks "View All" in tasks section
- **THEN** the test verifies navigation to `/app/tasks`
- **WHEN** the test clicks "View All" in rewards section
- **THEN** the test verifies navigation to `/app/rewards`

#### Scenario: E2E test for responsive layout
- **GIVEN** the dashboard E2E test
- **WHEN** testing at mobile viewport (375px)
- **THEN** the test verifies cards stack vertically
- **WHEN** testing at desktop viewport (1920px)
- **THEN** the test verifies two-column layout

#### Scenario: Unit tests for selectors achieve 100% coverage
- **GIVEN** the `dashboard.selectors.ts` file
- **WHEN** running unit tests
- **THEN** `selectPendingTasksForUser` is tested with:
  - No tasks
  - Tasks assigned to user by member ID
  - Tasks assigned to user by role
  - Unassigned tasks (should filter out)
  - Tasks assigned to other members (should filter out)
  - Completed tasks (should filter out)
  - More than 3 tasks (should limit to 3)
  - Various due date scenarios for sorting
- **AND** `selectPotentialKarma` is tested with:
  - No pending tasks (returns 0)
  - Tasks with karma
  - Tasks without karma
  - Mix of tasks with and without karma
- **AND** coverage is 100% for all selector logic

## MODIFIED Requirements

### Requirement: Empty page stubs
The web application MUST provide placeholder pages for all navigation items that display a consistent "coming soon" message.

#### Scenario: Dashboard page displays placeholder
- **REMOVED** (no longer applies - dashboard is now fully implemented)

**Rationale**: The dashboard page is no longer a placeholder stub; it's a fully-featured overview page with real functionality. The requirement remains for other unimplemented pages, but this specific scenario is removed.
