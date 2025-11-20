# Implementation Tasks

## 1. Backend Domain and Data Layer

- [x] 1.1 Create contribution goal domain types in `apps/api/src/modules/contribution-goals/domain/contribution-goal.ts`
  - [x] Define ContributionGoal interface with _id, familyId, memberId, weekStartDate, title, description, maxKarma, deductions array
  - [x] Define Deduction interface with _id, amount, reason, deductedBy, createdAt
  - [x] Define DTO types for API responses
  - [x] Define input types for create, update, and add deduction operations

- [x] 1.2 Create contribution goal repository in `apps/api/src/modules/contribution-goals/repositories/contribution-goal.repository.ts`
  - [x] Implement create method with MongoDB insertOne
  - [x] Implement findByFamilyAndMember method for current week lookup
  - [x] Implement findActiveGoalsForWeek method for cron job
  - [x] Implement update method for goal modifications
  - [x] Implement delete method
  - [x] Implement addDeduction method using $push for atomic updates
  - [x] Create MongoDB indexes: unique compound index on (familyId, memberId, weekStartDate) and index on weekStartDate

- [x] 1.3 Create contribution goal mapper in `apps/api/src/modules/contribution-goals/lib/contribution-goal.mapper.ts`
  - [x] Implement toContributionGoalDTO to convert ObjectIds to strings
  - [x] Implement toDeductionDTO for deduction objects
  - [x] Calculate currentKarma (maxKarma - sum of deduction amounts) in DTO
  - [x] Implement calculateCurrentKarma utility function

## 2. Backend Business Logic and Services

- [x] 2.1 Create contribution goal service in `apps/api/src/modules/contribution-goals/services/contribution-goal.service.ts`
  - [x] Implement createContributionGoal with parent role verification
  - [x] Implement getContributionGoal with family membership verification
  - [x] Implement updateContributionGoal with parent role verification
  - [x] Implement deleteContributionGoal with parent role verification
  - [x] Implement addDeduction with parent role verification, activity event creation, and real-time event emission
  - [x] Implement calculateWeekStartDate utility to find most recent Sunday 18:00 UTC
  - [x] Inject FamilyMembershipRepository, ActivityEventService, and ContributionGoalRepository

- [x] 2.2 Create week calculation utility in `apps/api/src/modules/contribution-goals/lib/week-utils.ts`
  - [x] Implement getCurrentWeekStart() returning most recent Sunday 18:00 UTC
  - [x] Implement isCurrentWeek(weekStartDate) for validation
  - [x] Add comprehensive tests for week boundary edge cases (Saturday night, Sunday evening, timezone handling)

## 3. Backend Validation and API Routes

- [x] 3.1 Create Zod validators in `apps/api/src/modules/contribution-goals/validators/`
  - [x] create-contribution-goal.validator.ts with title (1-200 chars), description (0-2000 chars), maxKarma (1-10000), memberId (ObjectId string)
  - [x] update-contribution-goal.validator.ts with partial updates
  - [x] add-deduction.validator.ts with amount (positive integer), reason (1-500 chars)
  - [x] Write unit tests for each validator with valid and invalid inputs

- [x] 3.2 Create contribution goal routes in `apps/api/src/modules/contribution-goals/routes/`
  - [x] create-contribution-goal.route.ts: POST /families/:familyId/contribution-goals
  - [x] get-contribution-goal.route.ts: GET /families/:familyId/contribution-goals/:memberId
  - [x] update-contribution-goal.route.ts: PUT /families/:familyId/contribution-goals/:memberId
  - [x] delete-contribution-goal.route.ts: DELETE /families/:familyId/contribution-goals/:memberId
  - [x] add-deduction.route.ts: POST /families/:familyId/contribution-goals/:memberId/deductions
  - [x] Each route uses jwtVerifyMiddleware, validates family membership, and enforces role-based access

- [x] 3.3 Create router in `apps/api/src/modules/contribution-goals/routes/contribution-goals.router.ts`
  - [x] Register all routes under Express router
  - [x] Export createContributionGoalsRouter factory function

- [x] 3.4 Write E2E tests for contribution goal API endpoints
  - [x] Test POST create with parent and non-parent users
  - [x] Test GET retrieval for self and other members
  - [x] Test PUT update with various field changes
  - [x] Test DELETE with authorization checks
  - [x] Test POST add deduction with activity event verification
  - [x] Test error cases (404, 403, 400)

## 4. Backend Cron Job and Weekly Karma Awarding

- [x] 4.1 Create contribution goal scheduler in `apps/api/src/modules/contribution-goals/lib/contribution-goal-scheduler.ts`
  - [x] Implement startContributionGoalScheduler() using CronJob library
  - [x] Set cron schedule to "0 0 18 * * 0" (Sunday 18:00 UTC weekly)
  - [x] Implement stopContributionGoalScheduler() for graceful shutdown
  - [x] Implement getSchedulerStatus() for monitoring

- [x] 4.2 Create contribution goal processor service in `apps/api/src/modules/contribution-goals/services/contribution-goal-processor.service.ts`
  - [x] Implement processWeeklyGoals() to handle cron job logic
  - [x] Query all active contribution goals for ending week
  - [x] For each goal: calculate remaining karma, award via karmaService, create activity event, send notification, emit real-time event
  - [x] Delete goal after processing (per design decision)
  - [x] Implement error handling to continue processing remaining goals if one fails
  - [x] Log comprehensive information for monitoring

- [x] 4.3 Integrate scheduler into server startup in `apps/api/src/server.ts`
  - [x] Start contribution goal scheduler after MongoDB connection established
  - [x] Stop scheduler on SIGTERM/SIGINT

- [x] 4.4 Write unit tests for contribution goal processor
  - [x] Test processWeeklyGoals with multiple goals
  - [x] Test karma awarding with positive remaining karma
  - [x] Test zero karma scenario
  - [x] Test activity event and notification creation
  - [x] Test error handling when karma service fails


## 5. Backend Real-time Events and Notifications

- [x] 5.1 Create contribution goal events in `apps/api/src/modules/contribution-goals/events/contribution-goal-events.ts`
  - [x] Implement emitContributionGoalDeducted(contributionGoal, deduction) emitting to family room
  - [x] Implement emitContributionGoalAwarded(contributionGoal, karmaAwarded) emitting to family room
  - [x] Implement emitContributionGoalUpdated(contributionGoal, action) emitting to family room

- [x] 5.2 Create notification templates in `apps/api/src/modules/notifications/lib/notification-templates.ts`
  - [x] Implement createContributionGoalAwardedNotification(karmaAmount, goalTitle) for weekly awards
  - [x] Implement createContributionGoalZeroKarmaNotification(goalTitle) for zero karma scenarios
  - [x] Use appropriate notification priority and deeplink to dashboard

- [x] 5.3 Integrate notification sending in contribution goal processor
  - [x] Call sendToUser with appropriate notification template
  - [x] Handle notification errors gracefully (log but don't fail processing)

## 6. Backend Module Integration

- [x] 6.1 Create contribution goals module index in `apps/api/src/modules/contribution-goals/index.ts`
  - [x] Export ContributionGoalService, ContributionGoalRepository, createContributionGoalsRouter
  - [x] Export types and events

- [x] 6.2 Register contribution goals router in `apps/api/src/app.ts`
  - [x] Mount router at /families/:familyId/contribution-goals
  - [x] Ensure proper middleware ordering (auth, error handling)

- [x] 6.3 Update karma service to support contribution_goal_weekly source
  - [x] Add "contribution_goal_weekly" to valid source types
  - [x] Update karma event metadata handling for contribution goal awards

- [x] 6.4 Update activity events to support CONTRIBUTION_GOAL type
  - [x] Add "CONTRIBUTION_GOAL" to ActivityEventType enum
  - [x] Support "DEDUCTED" and "AWARDED" details

## 7. Frontend Redux State Management

- [x] 7.1 Create contribution goal types in `apps/web/src/types/api.types.ts`
  - [x] Define ContributionGoal interface matching API DTO
  - [x] Define Deduction interface
  - [x] Define CreateContributionGoalRequest, UpdateContributionGoalRequest, AddDeductionRequest

- [x] 7.2 Add contribution goal API client methods in `apps/web/src/lib/api-client.ts`
  - [x] createContributionGoal(familyId, data)
  - [x] getContributionGoal(familyId, memberId)
  - [x] updateContributionGoal(familyId, memberId, data)
  - [x] deleteContributionGoal(familyId, memberId)
  - [x] addDeduction(familyId, memberId, data)

- [x] 7.3 Create contribution goals Redux slice in `apps/web/src/store/slices/contribution-goals.slice.ts`
  - [x] Define ContributionGoalsState interface with goalsByMemberId, isLoading, error, operations
  - [x] Create async thunks: fetchContributionGoal, createContributionGoal, updateContributionGoal, deleteContributionGoal, addDeduction
  - [x] Implement slice with reducers for all async thunk states
  - [x] Create selectors: selectContributionGoalByMemberId, selectCurrentUserContributionGoal, selectOperationLoading, selectOperationError

- [x] 7.4 Register contribution goals slice in `apps/web/src/store/store.ts`
  - [x] Add contributionGoals reducer to store

- [x] 7.5 Write unit tests for contribution goals Redux slice (100% coverage)
  - [x] Test all async thunks pending, fulfilled, rejected states
  - [x] Test all selectors with various state shapes
  - [x] Test synchronous reducers
  - [x] Test error handling edge cases

## 8. Frontend UI Components

- [x] 8.1 Create contribution goal sub-components in `apps/web/src/components/contribution-goals/`
  - [x] GoalHeader.tsx: displays title, week info, edit button (parent only)
  - [x] GoalProgress.tsx: progress bar, current karma / max karma, percentage
  - [x] DeductionList.tsx: displays latest deductions with reason, amount, who, when
  - [x] QuickDeductionForm.tsx: parent-only form with reason input, amount select, deduct button
  - [x] EmptyGoalState.tsx: shown when no goal exists (with set goal button for parents)

- [x] 8.2 Create ContributionGoalCard component in `apps/web/src/components/contribution-goals/ContributionGoalCard.tsx`
  - [x] Compose sub-components (GoalHeader, GoalProgress, DeductionList, QuickDeductionForm)
  - [x] Accept props: goal, isParent, showQuickDeduction, onEdit, onDelete, onAddDeduction
  - [x] Use shadcn Card, Progress, Button, Input, Select components
  - [x] Add data-testid attributes for E2E testing
  - [x] Implement responsive design following existing patterns

- [x] 8.3 Create contribution goal dialogs in `apps/web/src/components/contribution-goals/`
  - [x] EditContributionGoalDialog.tsx: form for creating/editing goal (title, description, maxKarma)
  - [x] DeleteContributionGoalDialog.tsx: confirmation dialog for deletion
  - [x] Use shadcn Dialog, Form, Input, Textarea components
  - [x] Validate inputs client-side
  - [x] Add data-testid attributes

## 9. Frontend Dashboard Integration

- [x] 9.1 Update dashboard overview to fetch and display contribution goal
  - [x] In DashboardOverview component, dispatch fetchContributionGoal for current user on mount
  - [x] Add useEffect to fetch contribution goal with stale-time logic
  - [x] Select current user's contribution goal from Redux state

- [x] 9.2 Create dashboard contribution goal section in `apps/web/src/components/dashboard/contribution-goal-section.tsx`
  - [x] Render ContributionGoalCard when goal exists
  - [x] Show empty state or hide when no goal (based on user role)
  - [x] Fetch latest CONTRIBUTION_GOAL deduction from activity events for current week
  - [x] Add data-testid="dashboard-contribution-goal-section"

- [x] 9.3 Integrate contribution goal section into dashboard layout
  - [x] Add section to DashboardOverview alongside pending tasks and reward progress
  - [x] Position according to design specifications (check reference design)

- [x] 9.4 Add contribution goal to dashboard pull-to-refresh
  - [x] Include fetchContributionGoal in refresh handler

## 10. Frontend Member Detail Integration

- [x] 10.1 Add contribution goal tab to member detail page in `apps/web/src/app/[lang]/app/family/[memberId]/page.tsx`
  - [x] Add "Contribution Goal" tab to existing tabs
  - [x] Use data-testid="contribution-goal-tab"

- [x] 10.2 Create member contribution goal view in `apps/web/src/components/family/member-contribution-goal-view.tsx`
  - [x] Fetch contribution goal for selected member on tab mount
  - [x] Render ContributionGoalCard with showQuickDeduction={isParent}
  - [x] Show full deduction history from goal data (not just latest)
  - [x] Handle edit and delete actions (parents only)
  - [x] Add data-testid attributes for all interactive elements

- [x] 10.3 Integrate real-time updates for contribution goals
  - [x] Subscribe to WebSocket contribution goal events when viewing member detail or dashboard
  - [x] On CONTRIBUTION_GOAL_DEDUCTED event, refetch contribution goal
  - [x] On CONTRIBUTION_GOAL_AWARDED event, refetch karma balance and contribution goal

## 11. Frontend Translations

- [x] 11.1 Add contribution goal translations to `apps/web/src/dictionaries/en-US.json`
  - [x] Under contributionGoals: emptyState, card, deduction sections
  - [x] Add all necessary strings covering UI components, dialogs, notifications, empty states

- [x] 11.2 Add contribution goal translations to `apps/web/src/dictionaries/nl-NL.json`
  - [x] Translate all en-US keys to Dutch
  - [x] Maintain consistency with existing translation patterns

- [x] 11.3 Use translations in all contribution goal components
  - [x] Use useTranslations hook in components
  - [x] Replace all hardcoded strings with translation references
  - [x] Verify no English or Dutch strings are hardcoded

## 12. Frontend E2E Testing

- [x] 12.1 Create contribution goal page object in `apps/web/tests/e2e/pages/contribution-goal.page.ts`
  - [x] Define locators for all contribution goal UI elements
  - [x] Implement helper methods: createGoal, addDeduction, editGoal, deleteGoal, getProgress
  - [x] Implement navigation methods
  - [x] Follow pattern from FamilyMemberDetailPage

- [x] 12.2 Write E2E test spec in `apps/web/tests/e2e/app/contribution-goals.spec.ts`
  - [x] Test: Parent creates contribution goal for child
  - [x] Test: Child views contribution goal on dashboard
  - [x] Test: Parent adds deduction to contribution goal
  - [x] Test: Deduction appears in deductions list
  - [x] Test: Current karma updates correctly after deduction
  - [x] Test: Parent edits contribution goal (title, description, maxKarma)
  - [x] Test: Parent deletes contribution goal
  - [x] Test: Progress percentage updates after deduction
  - [x] Test: Multiple deductions display correctly

- [x] 12.3 Update existing E2E tests if needed
  - [x] Ensure member detail page tests don't break with new tab
  - [x] Ensure dashboard tests accommodate new section

## 13. Documentation and Testing Verification

- [x] 13.1 Update BRUNO folder collections
  - [x] Add contribution goal endpoints to bruno folder

- [x] 13.2 Run full test suite and ensure 100% pass rate
  - [x] Backend unit tests: `pnpm --filter api test:unit`
  - [x] Backend E2E tests: `pnpm --filter api test:e2e`
  - [x] Frontend Redux unit tests: `pnpm --filter web test:unit` (contribution-goals.slice.test.ts)
  - [x] Frontend E2E tests: `pnpm --filter web test:e2e`

- [x] 13.3 Verify test coverage meets requirements
  - [x] Contribution goals Redux slice has 100% unit test coverage
  - [x] All critical user flows have E2E test coverage

- [x] 13.4 Manual testing checklist
  - [x] Create contribution goal as parent
  - [x] View contribution goal as child on dashboard
  - [x] Add multiple deductions throughout the week
  - [x] Verify activity trail shows all deductions
  - [x] Manually trigger weekly cron job and verify karma awarded
  - [x] Verify push and WebSocket notifications received
  - [x] Test all authorization scenarios (parent vs child permissions)
  - [x] Test edge cases (zero karma, exceeding max karma with deductions)

## 14. Final Integration and Deployment Preparation

- [x] 14.1 Run linter and fix any issues
  - [x] `pnpm run lint` on both api and web apps

- [x] 14.2 Build both applications successfully
  - [x] `pnpm --filter api run build`
  - [x] `pnpm --filter web run build`
