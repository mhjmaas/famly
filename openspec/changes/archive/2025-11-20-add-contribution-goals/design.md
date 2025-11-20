# Contribution Goals Design Document

## Context

The Famly application currently supports one-time and recurring tasks that award karma upon completion. However, families also need a way to set baseline weekly expectations for household participation that operate differently:
- Parents want to establish a default weekly karma amount that children can earn by maintaining household standards
- Rather than rewarding each small action, the system should allow deductions for failures
- At the end of each week, the remaining potential karma is awarded
- No historical tracking is needed—only the current week matters

This feature must integrate with existing karma, activity events, and notification systems while remaining completely separate from the tasks/rewards domain.

## Goals / Non-Goals

**Goals:**
- Enable parents to set weekly contribution goals with maximum potential karma
- Allow parents to deduct karma with reasons throughout the week
- Automatically award remaining karma every Sunday at 18:00 UTC
- Provide visibility of contribution goal progress on dashboard and member detail pages
- Send push and WebSocket notifications when weekly karma is awarded
- Log all deductions in the activity trail
- Maintain simplicity: no history, current week only
- Achieve 100% test coverage for Redux slice and comprehensive E2E coverage

**Non-Goals:**
- Historical tracking of past contribution goals or deductions
- Complex scheduling beyond weekly Sunday 18:00 UTC rollover
- Integration with tasks or rewards (these remain separate concepts)
- Multiple simultaneous goals per member
- Prorated karma calculations for partial weeks
- Rollback or undo of deductions

## Decisions

### Decision 1: Weekly Boundary at Sunday 18:00 UTC
**Choice:** Week starts on Sunday at 18:00 UTC and ends the following Sunday at 18:00 UTC.

**Rationale:**
- Provides a consistent, timezone-independent boundary
- Sunday evening aligns with family planning for the upcoming week
- 18:00 UTC works well for both European and North American families
- Matches the cron scheduling pattern used in tasks module

**Alternatives Considered:**
- Monday 00:00 UTC: Less family-friendly timing
- Configurable week start: Adds unnecessary complexity for MVP

### Decision 2: No Historical Data—Current Week Only
**Choice:** Store only the current week's contribution goal with no archival of past goals.

**Rationale:**
- Keeps the feature simple as specified in requirements
- Reduces database size and query complexity
- Aligns with the "keep it simple" directive
- Historical data not needed for the core use case

**Implementation:** On week rollover, the cron job will delete or reset the contribution goal after awarding karma. If parents want to continue the same goal, they must recreate it (or we auto-recreate with same settings—TBD based on UX feedback).

**Alternatives Considered:**
- Archive past goals: Rejected for simplicity
- Keep indefinite history: Adds unnecessary storage and complexity

### Decision 3: MongoDB Collection Schema
**Choice:** Create a new `contribution_goals` collection with the following schema:

```typescript
{
  _id: ObjectId,
  familyId: ObjectId,
  memberId: ObjectId,
  weekStartDate: Date,  // Sunday 18:00 UTC
  title: string,
  description: string,
  maxKarma: number,
  deductions: [
    {
      _id: ObjectId,
      amount: number,
      reason: string,
      deductedBy: ObjectId,
      createdAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ familyId: 1, memberId: 1, weekStartDate: 1 }` (unique) - ensures one goal per member per week
- `{ weekStartDate: 1 }` - for efficient cron job queries

**Rationale:**
- Embeds deductions in the same document for simplicity and atomic updates
- weekStartDate allows querying for current week's goal
- Unique compound index prevents duplicate goals per member per week

**Alternatives Considered:**
- Separate deductions collection: Rejected for unnecessary complexity and performance overhead
- Store weekly goal history: Rejected per Decision 2

### Decision 4: Cron Job Implementation
**Choice:** Use CronJob library (already in use for tasks) with a new scheduler module under `contribution-goals/lib/contribution-goal-scheduler.ts`.

**Schedule:** `0 0 18 * * 0` (Sunday at 18:00 UTC weekly)

**Process:**
1. Query all active contribution goals with weekStartDate matching the ending week
2. For each goal, calculate remaining karma (maxKarma - sum of deduction amounts)
3. Award karma via `karmaService.awardKarma()` with source "contribution_goal_weekly"
4. Create activity event via `activityEventService.recordEvent()`
5. Send push notification via `notificationService.sendToUser()`
6. Emit WebSocket event via `emitContributionGoalAwarded()`
7. Delete the contribution goal document (or reset if auto-renew is implemented)

**Error Handling:**
- Log errors for individual goal processing but continue with remaining goals
- Retry logic not needed—missed weeks are acceptable for this use case
- Alert monitoring if cron job fails to run

**Rationale:**
- Reuses existing task scheduler pattern
- Centralized scheduling logic
- Clear separation from task generation cron

**Alternatives Considered:**
- Separate scheduler service: Rejected as overkill for single cron job
- Event-driven scheduling: More complex, not needed for weekly cadence

### Decision 5: API Route Structure
**Choice:** Nest contribution goal routes under families:

```
POST   /families/:familyId/contribution-goals
GET    /families/:familyId/contribution-goals/:memberId
PUT    /families/:familyId/contribution-goals/:memberId
DELETE /families/:familyId/contribution-goals/:memberId
POST   /families/:familyId/contribution-goals/:memberId/deductions
```

**Rationale:**
- Aligns with existing family-scoped resource pattern (tasks, rewards, etc.)
- Makes family membership validation straightforward
- RESTful design with memberId as the unique identifier

**Authorization:**
- All endpoints require family membership
- Create, update, delete, and add deduction require parent role
- Get endpoint allows any family member

**Alternatives Considered:**
- Separate top-level `/contribution-goals` routes: Less intuitive, harder to validate family membership

### Decision 6: Redux State Management
**Choice:** Create a new `contributionGoals` Redux slice with:

**State:**
```typescript
{
  goalsByMemberId: Record<string, ContributionGoal>,
  isLoading: boolean,
  error: string | null,
  operations: {
    create: { isLoading: boolean; error: string | null },
    update: { isLoading: boolean; error: string | null },
    delete: { isLoading: boolean; error: string | null },
    addDeduction: { isLoading: boolean; error: string | null }
  }
}
```

**Async Thunks:**
- `fetchContributionGoal(familyId, memberId)`
- `createContributionGoal({ familyId, memberId, title, description, maxKarma })`
- `updateContributionGoal({ familyId, memberId, title, description, maxKarma })`
- `deleteContributionGoal({ familyId, memberId })`
- `addDeduction({ familyId, memberId, amount, reason })`

**Selectors:**
- `selectContributionGoalByMemberId(memberId)`
- `selectCurrentUserContributionGoal`
- `selectOperationLoading(operation)`
- `selectOperationError(operation)`

**Rationale:**
- Follows existing patterns from family, tasks, and rewards slices
- Normalized state keyed by memberId for efficient lookups
- Separate operation states for granular loading/error handling

**Alternatives Considered:**
- Store in family slice: Rejected to keep concerns separated and slice sizes manageable

### Decision 7: UI Component Decomposition
**Choice:** Break the ContributionGoalCard component into smaller sub-components:

```
ContributionGoalCard (main container)
├── GoalHeader (title, week info, edit button)
├── GoalProgress (progress bar, karma counters)
├── DeductionList (latest deductions display)
└── QuickDeductionForm (parent-only, for adding deductions)
```

**Rationale:**
- Avoids large monolithic components per project conventions
- Easier to test individual pieces
- Improves readability and maintainability
- Follows pattern used in tasks and family pages

**Alternatives Considered:**
- Single large component: Rejected per project guidelines against monolithic components

### Decision 8: Week Rollover Behavior
**Choice:** After awarding karma on Sunday 18:00 UTC, delete the contribution goal. Parents must recreate if they want to continue the same goal for the next week.

**Rationale:**
- Simplest implementation
- Avoids assumptions about whether goals should auto-renew
- Gives parents explicit control week-to-week
- Can be extended later to auto-renew if needed

**Future Enhancement Consideration:** Add an "auto-renew" boolean flag on the goal for automatic recreation with same settings.

**Alternatives Considered:**
- Auto-renew by default: Might not match parent intent if circumstances change
- Keep expired goal: Violates "no history" requirement

### Decision 9: Real-time Event Broadcasting
**Choice:** Emit contribution goal events to all family members via existing WebSocket infrastructure.

**Events:**
- `contribution_goal:deducted` - when deduction is added
- `contribution_goal:awarded` - when weekly karma is awarded
- `contribution_goal:updated` - when goal is created/updated/deleted

**Payload:** Include familyId, memberId, and relevant data for each event.

**Rationale:**
- Enables real-time UI updates for all family members viewing dashboards or member pages
- Aligns with existing real-time patterns for tasks, rewards, karma
- Improves UX by avoiding stale data

**Alternatives Considered:**
- Polling: Less efficient and responsive
- No real-time updates: Poor UX for collaborative family use

### Decision 10: Translation Structure
**Choice:** Add contribution goal translations under two namespaces:

- `dashboard.contributionGoal.*` - for dashboard-specific text
- `family.contributionGoal.*` - for member detail and shared text

**Keys include:**
```
title, setGoal, editGoal, deleteGoal, weekOf, karmaProgress,
currentKarma, maxKarma, deductions, addDeduction, reason,
amount, deductKarma, latestReduction, noGoalYet, etc.
```

**Rationale:**
- Maintains existing translation organization pattern
- Separates dashboard vs family contexts where appropriate
- Supports en-US and nl-NL as required

**Alternatives Considered:**
- Single namespace: Less clear where translations are used
- Inline English strings: Violates i18n requirements

## Risks / Trade-offs

### Risk 1: Cron Job Failure
**Risk:** If the weekly cron job fails, members miss their karma awards.

**Mitigation:**
- Implement comprehensive error logging
- Add monitoring/alerting for cron job health
- Consider running a catch-up job on startup (like tasks module does)
- Document manual recovery process

**Trade-off:** Accepting potential missed weeks for simplicity vs implementing complex retry/recovery logic.

### Risk 2: Timezone Confusion
**Risk:** Fixed UTC scheduling may confuse families in different timezones.

**Mitigation:**
- Clearly document the Sunday 18:00 UTC schedule in UI
- Display week start/end times in user's local timezone
- Consider adding timezone configuration in future iteration

**Trade-off:** Simplicity of single global schedule vs per-family timezone customization.

### Risk 3: Deductions Exceeding Max Karma
**Risk:** Parents can add deductions totaling more than maxKarma, resulting in zero karma awarded.

**Mitigation:**
- Allow this behavior (it's a valid use case)
- Show clear UI indication when current karma reaches zero or goes negative
- Prevent negative deduction amounts via validation

**Trade-off:** Flexibility for parents to use the system as they see fit vs preventing "unfair" over-deduction.

### Risk 4: Real-time Event Spam
**Risk:** Frequent deductions could spam WebSocket events.

**Mitigation:**
- Events are already scoped to family members only
- Rate limiting at WebSocket layer (already in place for chat)
- UI debouncing on client side if needed

**Trade-off:** Real-time updates vs potential performance impact (low risk).

## Migration Plan

**Initial Deployment:**
1. Deploy backend changes (API routes, cron job scheduler, MongoDB collection)
2. Run database migration to create indexes on `contribution_goals` collection
3. Deploy frontend changes (Redux slice, UI components, translations)
4. Start cron job scheduler on API server startup

**Rollback:**
- If issues arise, disable cron job via feature flag
- Remove contribution goal UI components via feature flag
- Drop `contribution_goals` collection if needed (no user data loss as feature is new)

**Data Migration:** None required—this is a new feature with no existing data.

**Monitoring:**
- Track cron job execution success/failure
- Monitor contribution goal API endpoint usage
- Track deduction creation rate
- Monitor karma awards from contribution goals

## Open Questions

1. **Auto-renew goals?** Should contribution goals automatically renew with the same settings, or should parents manually recreate each week?
   - **Recommendation:** Start with manual recreation for simplicity. Add auto-renew flag in future iteration based on user feedback.

2. **Partial week handling?** What happens if a goal is created mid-week (e.g., on Wednesday)?
   - **Recommendation:** Goal is effective immediately for the current week (starting from the most recent Sunday 18:00 UTC). Member has fewer days to avoid deductions but still gets full potential karma.

3. **Editing max karma mid-week?** Can parents increase/decrease maxKarma after the week has started?
   - **Recommendation:** Allow it. Existing deductions remain, but potential karma adjusts based on new maxKarma.

4. **Delete vs archive on rollover?** Should we delete the goal after awarding karma, or keep it in an "archived" state?
   - **Recommendation:** Delete per "no history" requirement. Future enhancement can add archival if needed.

5. **Multiple goals per member?** Should we support multiple simultaneous contribution goals (e.g., "room cleanliness" and "homework completion")?
   - **Recommendation:** No for MVP. Single goal per member keeps it simple. Can be extended later if needed.
