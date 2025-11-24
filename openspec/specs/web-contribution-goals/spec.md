# web-contribution-goals Specification

## Purpose
TBD - created by archiving change add-contribution-goals. Update Purpose after archive.
## Requirements
### Requirement: Contribution Goals Redux Slice
The web application SHALL manage contribution goal state using a Redux slice with async thunks for API interactions.

#### Scenario: Fetch contribution goal for member
- **WHEN** fetchContributionGoal async thunk is dispatched with familyId and memberId
- **THEN** the slice makes GET request to `/families/:familyId/contribution-goals/:memberId`
- **AND** updates state with loading, error, and data states
- **AND** stores the contribution goal in normalized state keyed by memberId

#### Scenario: Create contribution goal
- **WHEN** createContributionGoal async thunk is dispatched with goal data
- **THEN** the slice makes POST request to create the goal
- **AND** updates state with the new goal
- **AND** refetches family data to reflect changes

#### Scenario: Add deduction to contribution goal
- **WHEN** addDeduction async thunk is dispatched with memberId, amount, and reason
- **THEN** the slice makes POST request to add the deduction
- **AND** optimistically updates the local state
- **AND** refetches the contribution goal to ensure consistency

#### Scenario: Delete contribution goal
- **WHEN** deleteContributionGoal async thunk is dispatched with memberId
- **THEN** the slice makes DELETE request
- **AND** removes the goal from state
- **AND** refetches family data

#### Scenario: Handle async operation loading states
- **WHEN** any async thunk is pending
- **THEN** set isLoading to true for that operation
- **WHEN** fulfilled or rejected
- **THEN** set isLoading to false and update error state accordingly

### Requirement: Contribution Goal Dashboard Component
The dashboard SHALL display the current user's contribution goal progress prominently.

#### Scenario: Display contribution goal card on dashboard
- **WHEN** user has an active contribution goal for current week
- **THEN** display ContributionGoalCard component showing title, description, maxKarma, current karma, progress bar, and latest deduction
- **AND** use data-testid="contribution-goal-card" for E2E testing

#### Scenario: Show empty state when no goal exists
- **WHEN** user has no contribution goal for current week
- **THEN** display empty state or hide the contribution goal card
- **AND** do not show "Set Goal" button to non-parents

#### Scenario: Display latest deduction from activity trail
- **WHEN** contribution goal card is rendered and deductions exist
- **THEN** fetch the most recent CONTRIBUTION_GOAL activity event with DEDUCTED detail for current week
- **AND** display the deduction amount, reason, and who deducted it

#### Scenario: Update progress in real-time
- **WHEN** a real-time contribution goal event is received
- **THEN** refetch the contribution goal data
- **AND** update the UI to reflect the new current karma and deductions

### Requirement: Member Detail Contribution Goal Tab
The member detail page SHALL include a contribution goal tab showing goal progress and quick deduction interface for parents.

#### Scenario: Display contribution goal tab
- **WHEN** viewing a member detail page
- **THEN** show a "Contribution Goal" tab alongside other tabs
- **AND** use data-testid="contribution-goal-tab" for E2E testing

#### Scenario: Show contribution goal progress for member
- **WHEN** contribution goal tab is selected and goal exists
- **THEN** display ContributionGoalCard component with showQuickDeduction={isParent}
- **AND** show full deduction history from contribution goal data

#### Scenario: Parent can quickly add deduction
- **WHEN** parent views member's contribution goal tab
- **THEN** display quick deduction form with reason input and amount selector
- **AND** use data-testid="deduction-reason-input" and data-testid="deduction-amount-select"
- **AND** on submit, call addDeduction thunk and show success toast

#### Scenario: Non-parent cannot add deductions
- **WHEN** non-parent views member's contribution goal tab
- **THEN** hide the quick deduction form
- **AND** show read-only view of contribution goal progress

#### Scenario: Parent can edit or delete contribution goal
- **WHEN** parent views member's contribution goal
- **THEN** show "Edit Goal" button with data-testid="edit-contribution-goal-button"
- **AND** show delete option in actions menu

### Requirement: Contribution Goal UI Components
The web application SHALL implement reusable contribution goal UI components following design specifications.

#### Scenario: ContributionGoalCard component structure
- **WHEN** ContributionGoalCard is rendered
- **THEN** use shadcn Card, Progress, Button, Input, Select, and Textarea components
- **AND** split large sections into smaller sub-components (GoalHeader, GoalProgress, DeductionList, QuickDeductionForm)
- **AND** follow responsive design patterns from existing task and family pages

#### Scenario: Progress visualization
- **WHEN** displaying contribution goal progress
- **THEN** show progress bar with percentage (currentKarma / maxKarma * 100)
- **AND** display current karma vs max karma numerically
- **AND** show total deductions count

#### Scenario: Deduction history display
- **WHEN** deductions exist on contribution goal
- **THEN** display up to 5 most recent deductions inline
- **AND** show reason, amount, who deducted, and date
- **AND** use "Latest reduction" heading as per reference design

### Requirement: Contribution Goal Translations
All contribution goal UI text SHALL support internationalization via dictionary files.

#### Scenario: Add contribution goal translations to en-US dictionary
- **WHEN** implementing contribution goal UI
- **THEN** add keys under dashboard.contributionGoal and family.contributionGoal namespaces
- **AND** include translations for: title, description, setGoal, editGoal, deductKarma, reason, amount, weekOf, karmaProgress, noGoal, etc.

#### Scenario: Add contribution goal translations to nl-NL dictionary
- **WHEN** implementing contribution goal UI
- **THEN** add Dutch translations for all contribution goal keys
- **AND** maintain consistency with existing translation patterns

#### Scenario: Use translations in components
- **WHEN** rendering contribution goal text
- **THEN** use dict.dashboard.contributionGoal.* or dict.family.contributionGoal.* from dictionary prop
- **AND** never hardcode English or Dutch text

### Requirement: Contribution Goal E2E Tests
Contribution goal functionality SHALL have comprehensive E2E test coverage using Playwright.

#### Scenario: E2E test for creating contribution goal
- **WHEN** E2E test runs for contribution goal creation
- **THEN** parent logs in, navigates to member detail, creates goal with title/description/karma
- **AND** verifies goal appears on member detail page
- **AND** verifies goal appears on member's dashboard
- **AND** uses data-testid locators throughout

#### Scenario: E2E test for adding deduction
- **WHEN** E2E test runs for deduction flow
- **THEN** parent navigates to member contribution goal tab
- **AND** adds deduction with reason and amount
- **AND** verifies deduction appears in activity timeline
- **AND** verifies current karma is reduced

#### Scenario: E2E test for weekly karma award (simulated)
- **WHEN** E2E test simulates week rollover
- **THEN** manually trigger cron job or wait for scheduled time
- **AND** verify member receives karma award
- **AND** verify activity event and notification are created

#### Scenario: Use page object pattern
- **WHEN** writing E2E tests for contribution goals
- **THEN** create ContributionGoalPage class with locators and helper methods
- **AND** follow existing pattern from FamilyMemberDetailPage
- **AND** provide navigation, action, and assertion helpers

### Requirement: Contribution Goal Redux Unit Tests
The contribution goals Redux slice SHALL have 100% unit test coverage.

#### Scenario: Test all async thunks
- **WHEN** writing unit tests for contribution goals slice
- **THEN** test pending, fulfilled, and rejected states for each async thunk
- **AND** verify state updates correctly in all scenarios
- **AND** test error handling and edge cases

#### Scenario: Test selectors
- **WHEN** writing unit tests for contribution goals selectors
- **THEN** test selectContributionGoalByMemberId returns correct goal
- **AND** test selectCurrentUserContributionGoal returns own goal
- **AND** test loading and error state selectors

#### Scenario: Test reducer actions
- **WHEN** writing unit tests for contribution goals reducer
- **THEN** test all sync actions like clearError, updateLocalGoal, etc.
- **AND** verify state mutations are correct

### Requirement: Contribution Goal Real-time Updates
The web application SHALL subscribe to contribution goal real-time events and update UI accordingly.

#### Scenario: Subscribe to contribution goal events
- **WHEN** user is viewing dashboard or member detail with contribution goal
- **THEN** subscribe to WebSocket events for contribution goals in user's family
- **AND** listen for CONTRIBUTION_GOAL_DEDUCTED and CONTRIBUTION_GOAL_AWARDED events

#### Scenario: Handle contribution goal deducted event
- **WHEN** CONTRIBUTION_GOAL_DEDUCTED event is received
- **THEN** refetch the affected member's contribution goal
- **AND** update the UI to show new deduction and reduced karma

#### Scenario: Handle contribution goal awarded event
- **WHEN** CONTRIBUTION_GOAL_AWARDED event is received (week rollover)
- **THEN** refetch karma balance for the member
- **AND** show notification/toast that karma was awarded
- **AND** update or remove the contribution goal from state

### Requirement: Recurring toggle in contribution goal dialogs
The web UI SHALL let parents set contribution goals as recurring when creating or editing.

#### Scenario: Create dialog shows recurring switch
- **WHEN** the create contribution goal dialog is opened by a parent
- **THEN** it shows a toggle labeled for recurring weekly goals
- **AND** the toggle defaults to off
- **AND** submitting sends the recurring value to the API

#### Scenario: Edit dialog reflects and updates recurring flag
- **WHEN** a parent opens the edit contribution goal dialog for an existing goal
- **THEN** the recurring toggle reflects the current recurring value
- **AND** the parent can change it and save
- **AND** the change is sent to the API and updates state

#### Scenario: Recurring flag stored in client state
- **WHEN** contribution goals are fetched
- **THEN** the Redux slice stores recurring per goal
- **AND** UI components use it to render and submit forms

