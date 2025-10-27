# Design: add-karma-reward-system

## Context
The Famly API currently supports task management with assignment, scheduling, and completion tracking. We need to add an optional reward mechanism (karma points) to incentivize task completion and other family activities. The system must:
- Integrate with existing task completion workflow
- Support manual karma grants by parents
- Track family-specific karma totals per member
- Maintain complete event history for audit purposes
- Follow existing codebase patterns (modular structure, repository pattern, service layer)

### Constraints
- No external queue infrastructure (Docker Compose dev environment limitation)
- Must work synchronously with task completion flow
- MongoDB as primary data store
- Node.js 20, TypeScript 5.6 environment
- Must adhere to constitution principles: SOLID, DRY, KISS, TDD

## Goals / Non-Goals

### Goals
- Enable families to reward members with karma points for task completion
- Provide transparent history of all karma transactions
- Support multi-family scenarios with isolated karma totals
- Integrate seamlessly with existing task workflow
- Maintain data consistency between karma totals and event history

### Non-Goals
- Real-time notifications for karma events
- Karma redemption or marketplace features
- Automated karma expiration or decay
- Complex karma calculation rules (multipliers, bonuses, streaks)
- Cross-service event bus for karma events

## Decisions

### Decision 1: Direct Service-to-Service Calls
**What**: TaskService will directly call KarmaService.awardKarma() when a task is completed with karma metadata.

**Why**:
- Simplest solution (KISS principle)
- No infrastructure dependencies (queue, event bus)
- Easier to reason about and debug
- Sufficient for expected load (family-scale usage, not enterprise scale)
- Follows existing pattern in codebase (services call other services directly)

**Alternatives considered**:
- Event-driven architecture with message queue: Rejected due to infrastructure complexity and lack of current need
- Webhook-based: Rejected as overly complex for internal service communication
- Pub/sub pattern: Rejected as overkill for single subscriber scenario

**Trade-offs**:
- Pro: Simple, easy to test, no new dependencies
- Con: Tight coupling between TaskService and KarmaService
- Con: Harder to scale independently (acceptable for family-scale app)
- Con: Cannot retry karma grants asynchronously

**Mitigation**: Wrap karma service calls in try-catch to prevent karma failures from blocking task completion.

### Decision 2: Dual Collection Strategy (Aggregate + Events)
**What**: Store karma in two collections:
- `member_karma`: Aggregate totals (one doc per member per family)
- `karma_events`: Individual transaction history

**Why**:
- Enables O(1) balance lookups (query single document)
- Maintains full audit trail for transparency
- Supports data reconciliation (sum events vs stored total)
- Follows CQRS-lite pattern (separate read and write concerns)

**Alternatives considered**:
- Events only (calculate total on read): Rejected due to poor query performance as history grows
- Totals only (no history): Rejected due to lack of transparency and audit trail
- Embed events in member_karma document: Rejected due to document size concerns and update complexity

**Trade-offs**:
- Pro: Fast balance queries
- Pro: Complete audit history
- Con: Data duplication (total stored twice: as aggregate and sum of events)
- Con: Risk of inconsistency if updates aren't atomic

**Consistency guarantee**: Use MongoDB transactions when updating both collections, or implement eventual consistency with reconciliation endpoint.

### Decision 3: Optional Karma on Tasks
**What**: Add `metadata?: { karma?: number }` field to Task domain model as optional.

**Why**:
- Maintains backward compatibility (existing tasks unaffected)
- Allows gradual adoption (families can opt-in to karma)
- Follows Open/Closed Principle (extends task without modifying core behavior)
- Aligns with requirement that karma is not mandatory

**Alternatives considered**:
- Separate TaskReward entity: Rejected as over-engineered for simple numeric value
- Karma as required field: Rejected as contradicts optional requirement
- Separate task_karma_config collection: Rejected as unnecessarily complex

**Trade-offs**:
- Pro: Simple, minimal change to Task domain
- Pro: Clear opt-in semantics
- Con: Metadata object may grow over time (acceptable risk)

**Validation**: Zod schema validates karma as positive number if present.

### Decision 4: Parent-Only Manual Grants
**What**: Only parents can manually grant karma via POST /v1/families/{familyId}/karma/grant endpoint.

**Why**:
- Prevents children from self-granting unlimited karma
- Aligns with family hierarchy (parents manage rewards)
- Simple authorization rule (existing FamilyRole.Parent check)

**Alternatives considered**:
- Allow all members to grant: Rejected due to abuse potential
- Configurable per-family: Rejected as premature complexity (YAGNI)
- Separate "karma admin" role: Rejected as unnecessary role proliferation

**Trade-offs**:
- Pro: Clear security boundary
- Pro: Prevents obvious abuse
- Con: Inflexible (can't delegate karma granting to trusted children)

**Future enhancement**: Could add delegation if needed.

### Decision 5: MongoDB Atomic Updates for Totals
**What**: Use MongoDB's `$inc` operator to atomically increment karma totals.

**Why**:
- Prevents race conditions on concurrent karma grants
- Built-in MongoDB feature (no external locking needed)
- Performs well at expected scale

**Alternatives considered**:
- Read-modify-write pattern: Rejected due to race condition risk
- Distributed locking: Rejected as over-engineered
- Pessimistic locking: Rejected as unnecessary complexity

**Implementation**:
```typescript
await db.collection('member_karma').updateOne(
  { familyId, userId },
  { $inc: { totalKarma: amount }, $set: { updatedAt: new Date() } },
  { upsert: true }
);
```

### Decision 6: Error Handling for Karma Grants
**What**: Task completion succeeds even if karma grant fails (best-effort karma).

**Why**:
- Task completion is primary workflow—must not fail due to secondary reward system
- Karma is optional feature—failures should not block core functionality
- Follows robustness principle (be liberal in what you accept)

**Implementation**:
```typescript
// In TaskService.updateTask
try {
  if (input.completedAt && task.metadata?.karma) {
    await karmaService.awardKarma({
      familyId,
      userId,
      amount: task.metadata.karma,
      source: 'task_completion',
      description: `Completed task "${task.name}"`,
      metadata: { taskId: taskId.toString() }
    });
  }
} catch (error) {
  logger.error('Failed to award karma for task completion', { taskId, error });
  // Continue with task update—don't throw
}
```

**Trade-offs**:
- Pro: Resilient task workflow
- Pro: Karma failures are isolated
- Con: Silent karma failures may confuse users
- Con: Requires manual reconciliation if karma is lost

**Mitigation**: Comprehensive logging and monitoring of karma failures; reconciliation endpoint for manual fixes.

## Data Model

### member_karma Collection
```typescript
interface MemberKarma {
  _id: ObjectId;
  familyId: ObjectId;
  userId: ObjectId;
  totalKarma: number;  // Always >= 0
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
{ familyId: 1, userId: 1 } (unique)
{ familyId: 1 }
```

### karma_events Collection
```typescript
interface KarmaEvent {
  _id: ObjectId;
  familyId: ObjectId;
  userId: ObjectId;
  amount: number;  // Always > 0 (no negative karma in MVP)
  source: 'task_completion' | 'manual_grant';
  description: string;  // e.g., "Completed task Wash dishes"
  metadata?: {
    taskId?: string;      // For task_completion source
    grantedBy?: string;   // For manual_grant source
  };
  createdAt: Date;
}

// Indexes
{ familyId: 1, userId: 1, createdAt: -1 }
{ createdAt: -1 }
```

### Task Domain Extension
```typescript
// BEFORE
interface Task {
  _id: ObjectId;
  familyId: ObjectId;
  name: string;
  // ... existing fields
}

// AFTER (backward compatible)
interface Task {
  _id: ObjectId;
  familyId: ObjectId;
  name: string;
  metadata?: {
    karma?: number;  // Optional karma reward (must be positive integer)
  };
  // ... existing fields
}
```

## API Design

### GET /v1/families/{familyId}/karma/balance
Returns current karma total for authenticated user in specified family.

**Authorization**: Family member (any role)

**Response**:
```json
{
  "familyId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "totalKarma": 150,
  "updatedAt": "2025-10-26T10:30:00Z"
}
```

### GET /v1/families/{familyId}/karma/history
Returns paginated karma event history for authenticated user.

**Authorization**: Family member (any role)

**Query params**:
- `limit` (optional, default 50, max 100)
- `cursor` (optional, opaque pagination token)

**Response**:
```json
{
  "events": [
    {
      "id": "507f1f77bcf86cd799439013",
      "amount": 10,
      "source": "task_completion",
      "description": "Completed task \"Wash dishes\"",
      "metadata": {
        "taskId": "507f1f77bcf86cd799439014"
      },
      "createdAt": "2025-10-26T10:30:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMyJ9"
  }
}
```

### POST /v1/families/{familyId}/karma/grant
Manually grants karma to a family member.

**Authorization**: Parent role required

**Request**:
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "amount": 25,
  "description": "Great job helping with groceries"
}
```

**Validation**:
- `userId` must be family member
- `amount` must be positive integer (1-1000)
- `description` optional, max 500 chars

**Response**: 201 Created
```json
{
  "eventId": "507f1f77bcf86cd799439015",
  "familyId": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "amount": 25,
  "newTotal": 175,
  "description": "Great job helping with groceries",
  "grantedBy": "507f1f77bcf86cd799439010",
  "createdAt": "2025-10-26T11:00:00Z"
}
```

## Module Structure

Following existing codebase patterns:

```
src/modules/karma/
├── domain/
│   ├── karma.ts           # Domain types (MemberKarma, KarmaEvent, DTOs)
├── lib/
│   └── karma.mapper.ts    # DTO transformations
├── repositories/
│   └── karma.repository.ts  # Data access for both collections
├── routes/
│   ├── karma.router.ts      # Main router
│   ├── get-balance.route.ts
│   ├── get-history.route.ts
│   └── grant-karma.route.ts
├── services/
│   └── karma.service.ts     # Business logic
├── validators/
│   └── grant-karma.validator.ts
└── index.ts                 # Module exports
```

## Service Integration

### TaskService Changes
```typescript
export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private membershipRepository: FamilyMembershipRepository,
    private karmaService: KarmaService  // NEW: inject karma service
  ) {}

  async updateTask(/* ... */): Promise<Task> {
    // ... existing validation ...

    const updatedTask = await this.taskRepository.updateTask(taskId, input);

    // NEW: Award karma if task completed with karma metadata
    if (input.completedAt && !existingTask.completedAt && updatedTask.metadata?.karma) {
      try {
        await this.karmaService.awardKarma({
          familyId: updatedTask.familyId,
          userId,
          amount: updatedTask.metadata.karma,
          source: 'task_completion',
          description: `Completed task "${updatedTask.name}"`,
          metadata: { taskId: taskId.toString() }
        });
      } catch (error) {
        logger.error('Failed to award karma for task completion', {
          taskId: taskId.toString(),
          error
        });
        // Don't throw—task completion still succeeds
      }
    }

    return updatedTask;
  }
}
```

## Testing Strategy

Following TDD mandate from constitution:

### Unit Tests
- `karma.mapper.test.ts`: DTO transformations
- `grant-karma.validator.test.ts`: Request validation
- `karma.service.test.ts`: Business logic (mocked repository)

### Integration Tests (E2E)
- `get-balance.e2e.test.ts`: Balance retrieval, authorization
- `get-history.e2e.test.ts`: History pagination, filtering
- `grant-karma.e2e.test.ts`: Manual grants, authorization (parent-only)
- `task-karma-integration.e2e.test.ts`: Task completion triggers karma award
- `authorization.e2e.test.ts`: Non-members cannot access karma endpoints

### Test Data
Use existing `test-data-factory.ts` pattern to create karma test fixtures.

## Risks / Trade-offs

### Risk: Karma Total Inconsistency
**Scenario**: System crash between creating event and updating total.

**Likelihood**: Low (MongoDB operations are atomic per document)

**Impact**: Medium (karma total doesn't match event sum)

**Mitigation**:
- Use MongoDB transactions to update both collections atomically
- Implement reconciliation endpoint (admin-only) to detect and fix inconsistencies
- Log warnings when inconsistencies detected

**Reconciliation logic**:
```typescript
async function reconcileKarma(familyId: ObjectId, userId: ObjectId): Promise<void> {
  const events = await karmaEventsCollection.find({ familyId, userId }).toArray();
  const calculatedTotal = events.reduce((sum, e) => sum + e.amount, 0);

  const memberKarma = await memberKarmaCollection.findOne({ familyId, userId });
  const storedTotal = memberKarma?.totalKarma ?? 0;

  if (calculatedTotal !== storedTotal) {
    logger.warn('Karma total inconsistency detected', {
      familyId: familyId.toString(),
      userId: userId.toString(),
      calculatedTotal,
      storedTotal,
      difference: calculatedTotal - storedTotal
    });

    // Fix the inconsistency
    await memberKarmaCollection.updateOne(
      { familyId, userId },
      { $set: { totalKarma: calculatedTotal, updatedAt: new Date() } }
    );
  }
}
```

### Trade-off: Tight Coupling vs Event-Driven
**Decision**: Accepted tight coupling (TaskService → KarmaService) for simplicity.

**When to revisit**:
- If karma needs to trigger from multiple sources (diary, shopping lists, etc.)
- If retry/async processing becomes necessary
- If karma logic becomes complex enough to warrant decoupling

**Migration path**: Refactor to event-driven when 3+ modules need to emit karma events (Rule of Three from constitution).

## Migration Plan

### Phase 1: Database Setup
1. Create indexes on `member_karma` and `karma_events` collections
2. No data migration needed (collections start empty)

### Phase 2: Karma Module
1. Implement domain models
2. Implement repository with full test coverage
3. Implement service with unit tests
4. Implement routes with E2E tests
5. Deploy karma endpoints (no dependencies yet)

### Phase 3: Task Integration
1. Update Task domain to include optional `metadata.karma`
2. Update task validators to accept karma metadata
3. Inject KarmaService into TaskService
4. Add karma award logic to task update handler
5. Update task E2E tests to verify karma integration
6. Deploy with feature flag (if needed for gradual rollout)

### Rollback Plan
If karma system causes issues:
1. Remove karma award logic from TaskService (revert to previous version)
2. Disable karma API routes (return 503 Service Unavailable)
3. Karma data remains in database (no data loss)
4. Re-enable when issues resolved

## Open Questions

1. **Should we implement karma reconciliation as scheduled job or on-demand endpoint?**
   - **Proposed**: On-demand admin endpoint for MVP. Add scheduled job if inconsistencies become frequent.

2. **Should karma history include karma granted to other family members (for parent visibility)?**
   - **Proposed**: No in MVP—only personal history. Add family-wide history endpoint if needed.

3. **What happens if a task with karma is deleted after completion?**
   - **Proposed**: Karma remains (already awarded). Task deletion doesn't reverse karma.

4. **Should we validate that task.metadata.karma matches schedule.metadata.karma for scheduled tasks?**
   - **Proposed**: No validation. Task metadata is authoritative (allows per-instance overrides).

5. **How do we handle task un-completion (setting completedAt back to null)?**
   - **Proposed**: Don't reverse karma. Karma is awarded on transition to completed state only.
