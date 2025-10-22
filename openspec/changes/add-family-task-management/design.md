## Context

Families need to coordinate household tasks and chores. The design must support both one-time and recurring tasks, with flexible assignment options. The implementation should follow the existing modular Express architecture pattern established in the family and auth modules while adhering to the project's constitution principles (SOLID, DRY, KISS, TDD, Maintainability).

## Goals / Non-Goals

**Goals:**
- Enable task creation and management by both parents and children
- Support flexible task assignment (specific member, role-based, or unassigned)
- Implement recurring task schedules with automatic instance generation
- Maintain consistency with existing API patterns and architecture
- Ensure comprehensive test coverage (unit + e2e)
- Keep implementation simple and maintainable

**Non-Goals:**
- Task completion tracking/status management (future enhancement)
- Task reminders or notifications (future enhancement)
- Task templates or pre-defined chore lists (future enhancement)
- Complex scheduling beyond weekly recurrence patterns
- Task dependencies or hierarchies

## Decisions

### Decision 1: Two-Entity Model (Task + TaskSchedule)

**Choice:** Separate `Task` (individual instances) from `TaskSchedule` (recurring templates)

**Rationale:**
- Clear separation of concerns: schedules define recurrence rules, tasks are concrete instances
- Enables querying active tasks without filtering schedule metadata
- Allows historical tracking of completed tasks independent of schedule changes
- Simpler data model for one-time tasks (no schedule reference)

**Alternatives Considered:**
- Single polymorphic entity: Would mix concerns and complicate queries
- Task with embedded schedule: Would duplicate schedule data across instances

### Decision 2: Use `cron` npm Package for Scheduling

**Choice:** Use the established `cron` library for daily task generation

**Rationale:**
- Well-maintained, widely-used Node.js scheduling library
- Simple API for defining cron expressions
- Runs in-process, no additional infrastructure needed
- Fits KISS principle: straightforward solution for daily job execution

**Alternatives Considered:**
- node-cron: Less popular, similar functionality
- External scheduler (e.g., Kubernetes CronJob): Over-engineering for MVP
- Database-driven polling: More complex, less efficient

### Decision 3: Nested Route Structure

**Choice:** Routes under `/v1/families/:familyId/tasks` hierarchy

**Rationale:**
- Tasks are always scoped to a family (consistent with domain model)
- Natural authorization boundary (must be family member)
- Follows RESTful nesting conventions
- Consistent with existing `/v1/families/:familyId/members` pattern

**Alternatives Considered:**
- Top-level `/v1/tasks`: Would require family filtering on every request
- Separate `/v1/schedules`: Would split related concepts across routes

### Decision 4: Role-Agnostic Task Creation

**Choice:** Both parents and children can create and manage tasks

**Rationale:**
- Encourages family participation and responsibility-sharing
- Children can propose tasks or volunteer for chores
- Aligns with collaborative family coordination goals
- Simpler authorization logic (family membership sufficient)

**Alternatives Considered:**
- Parent-only creation: Would discourage child engagement
- Complex permission model: Over-engineering for MVP

### Decision 5: Flexible Assignment Model

**Choice:** Support three assignment types: specific member, role-based (all parents/children), or unassigned

**Rationale:**
- Covers common family scenarios (personal tasks, shared responsibilities, open tasks)
- Simple discriminated union in domain model
- Enables future enhancements (rotation, claiming)

**Schema:**
```typescript
type TaskAssignment = 
  | { type: 'member'; memberId: ObjectId }
  | { type: 'role'; role: FamilyRole }
  | { type: 'unassigned' }
```

### Decision 6: Schedule Constraints

**Choice:** Weekly intervals limited to 1-4 weeks, specific days of week selection

**Rationale:**
- Covers most household chore patterns (weekly, biweekly, monthly)
- Simple to implement and understand
- Prevents scheduling complexity creep
- Upper bound (4 weeks) enables efficient task generation lookups

**Schema:**
```typescript
{
  daysOfWeek: number[],      // 0-6 (Sunday-Saturday)
  weeklyInterval: 1 | 2 | 3 | 4,
  startDate: Date,
  endDate?: Date              // Optional for indefinite schedules
}
```

## Data Model

### Task Collection Schema
```typescript
{
  _id: ObjectId,
  familyId: ObjectId,
  name: string,                    // Max 200 chars
  description?: string,            // Optional, max 2000 chars
  dueDate?: Date,                  // Optional due datetime
  assignment: TaskAssignment,
  scheduleId?: ObjectId,           // Reference if generated from schedule
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### TaskSchedule Collection Schema
```typescript
{
  _id: ObjectId,
  familyId: ObjectId,
  name: string,
  description?: string,
  assignment: TaskAssignment,
  schedule: {
    daysOfWeek: number[],
    weeklyInterval: 1 | 2 | 3 | 4,
    startDate: Date,
    endDate?: Date
  },
  timeOfDay?: string,              // Optional HH:mm for due time
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date,
  lastGeneratedDate?: Date         // Track last generation run
}
```

### MongoDB Indexes
```
tasks:
  - { familyId: 1, dueDate: 1 }
  - { familyId: 1, scheduleId: 1 }
  - { familyId: 1, createdAt: -1 }

task_schedules:
  - { familyId: 1 }
  - { familyId: 1, schedule.startDate: 1 }
```

## Task Generation Logic

Daily cron job (runs at 00:05 UTC):
1. Query all active schedules (startDate <= today, no endDate or endDate >= today)
2. For each schedule:
   - Check if today matches schedule criteria (day of week, interval)
   - Check if task already generated for today (query by scheduleId + dueDate)
   - If criteria met and no duplicate, create task instance with schedule reference
3. Log generation summary (schedules processed, tasks created)

## Risks / Trade-offs

### Risk: Cron Job Failure
**Mitigation:** 
- Comprehensive logging of generation runs
- Idempotent task creation (check for duplicates)
- Monitor logs for generation errors
- Future: Add health check endpoint for scheduler status

### Risk: Timezone Handling
**Mitigation:**
- Store all dates in UTC, convert in application layer
- Document timezone expectations in API contracts
- Future: Add family timezone preference field

### Risk: Schedule Drift
**Mitigation:**
- Use `lastGeneratedDate` to detect missed generations
- Catch-up logic to generate missed tasks on next run
- Limit catch-up to 7 days to prevent overwhelming users

### Trade-off: In-Process vs External Scheduler
**Chosen:** In-process cron for simplicity (KISS principle)
**Consideration:** May need external scheduler if:
- Multiple API instances require coordination
- More complex scheduling needs emerge
- Job duration exceeds acceptable thresholds

## Migration Plan

### Initial Deployment
1. Add `cron` dependency to `apps/api/package.json`
2. Deploy new `tasks` module with collections
3. Cron job starts on application boot, begins generating tasks from schedules

### Rollback
- Remove task router registration from app.ts
- Cron job stops automatically when app restarts
- No data migration needed (new collections, no schema changes)

### Future Enhancements
- Task completion status and history tracking
- Task assignment claiming/rotation
- Reminder notifications via email/push
- Family timezone preference
- Task templates and categories
- Subtask support

## Open Questions

None - all requirements are well-defined by user specifications.