# Design: Karma Rewards System

## Architectural Overview
The rewards system introduces a new `rewards` module following the established modular Express architecture. It comprises two primary collections with tight integration to the existing `karma` and `tasks` modules.

## Data Model

### Rewards Collection
```typescript
interface Reward {
  _id: ObjectId;
  familyId: ObjectId;
  name: string; // Max 100 chars, e.g., "Extra screen time"
  description?: string; // Optional, max 500 chars
  karmaCost: number; // 1-1000, must be positive integer
  imageUrl?: string; // Optional, max 500 chars, must be valid URL
  createdBy: ObjectId; // Parent who created
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- `{ familyId: 1, _id: 1 }` - Primary query pattern (list rewards for family)
- `{ familyId: 1, createdAt: -1 }` - Sort by creation date

### Claims Collection
```typescript
interface RewardClaim {
  _id: ObjectId;
  rewardId: ObjectId;
  familyId: ObjectId;
  memberId: ObjectId; // Family member claiming
  status: 'pending' | 'completed' | 'cancelled';
  autoTaskId?: ObjectId; // Reference to auto-generated task
  completedBy?: ObjectId; // Parent who completed (if status=completed)
  cancelledBy?: ObjectId; // User who cancelled (if status=cancelled)
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}
```

**Indexes**:
- `{ familyId: 1, memberId: 1, status: 1 }` - List member's claims by status
- `{ rewardId: 1, status: 1 }` - Count claims per reward
- `{ autoTaskId: 1 }` - Lookup claim by task (for task completion integration)
- `{ familyId: 1, createdAt: -1 }` - All family claims chronologically

### Reward Metadata Collection
```typescript
interface RewardMetadata {
  _id: ObjectId; // Composite: `${familyId}_${rewardId}_${memberId}`
  familyId: ObjectId;
  rewardId: ObjectId;
  memberId: ObjectId;
  isFavourite: boolean; // Per-member favourite flag
  claimCount: number; // How many times this member claimed this reward
  updatedAt: Date;
}
```

**Indexes**:
- `{ rewardId: 1, memberId: 1 }` - Primary lookup pattern
- `{ familyId: 1, memberId: 1, isFavourite: 1 }` - List member's favourites
- `{ rewardId: 1, isFavourite: 1 }` - Count favourites per reward

## Component Structure

### Module Organization (apps/api/src/modules/rewards/)
```
rewards/
├── domain/
│   ├── reward.ts              # Reward, RewardClaim, RewardMetadata types
│   └── reward-metadata.ts     # Metadata types and helpers
├── repositories/
│   ├── reward.repository.ts           # CRUD for rewards
│   ├── claim.repository.ts            # CRUD for claims
│   └── metadata.repository.ts         # Metadata operations
├── services/
│   ├── reward.service.ts      # Business logic for rewards
│   └── claim.service.ts       # Claim workflow orchestration
├── routes/
│   ├── rewards.router.ts              # Main router
│   ├── create-reward.route.ts         # POST /rewards
│   ├── list-rewards.route.ts          # GET /rewards
│   ├── get-reward.route.ts            # GET /rewards/:id
│   ├── update-reward.route.ts         # PATCH /rewards/:id
│   ├── delete-reward.route.ts         # DELETE /rewards/:id
│   ├── claim-reward.route.ts          # POST /rewards/:id/claim
│   ├── cancel-claim.route.ts          # DELETE /claims/:id
│   ├── list-claims.route.ts           # GET /claims
│   ├── toggle-favourite.route.ts      # POST /rewards/:id/favourite
│   └── get-reward-details.route.ts    # GET /rewards/:id/details
├── validators/
│   ├── create-reward.validator.ts
│   ├── update-reward.validator.ts
│   └── claim-reward.validator.ts
├── lib/
│   └── reward.mapper.ts       # Domain <-> DTO conversions
└── index.ts                   # Module exports
```

## Integration Points

### Karma Module Extension
The karma service must be extended to support karma deductions:

```typescript
// New method in karma.service.ts
async deductKarma(input: DeductKarmaInput): Promise<void> {
  // Validate sufficient balance
  // Create negative karma event (source: 'reward_redemption')
  // Atomically decrement member_karma.totalKarma
  // Include claim metadata in event
}

interface DeductKarmaInput {
  familyId: ObjectId;
  userId: ObjectId;
  amount: number; // Positive number representing deduction
  claimId: string;
  rewardName: string;
}
```

**New KarmaSource**: Add `'reward_redemption'` to existing `task_completion | manual_grant`

**Validation**: Before deduction, verify `memberKarma.totalKarma >= amount`

### Tasks Module Integration
The claim service will use the existing task service to auto-create approval tasks:

```typescript
// In claim.service.ts
async createClaim(rewardId, memberId, familyId): Promise<RewardClaim> {
  // 1. Validate reward exists and member has sufficient karma
  // 2. Create claim with status='pending'
  // 3. Auto-create task via taskService.createTask({
  //      name: `Provide reward: ${reward.name} for ${memberName}`,
  //      description: `This will deduct ${reward.karmaCost} karma from ${memberName}`,
  //      assignment: { type: 'role', role: 'parent' },
  //      metadata: { claimId: claim._id.toString() }
  //    })
  // 4. Update claim with autoTaskId
  // 5. Return claim
}
```

**Task Metadata Extension**: Add `claimId?: string` to task metadata schema to link back to claims

### Task Completion Hook
When a task with `metadata.claimId` is marked complete:

```typescript
// In tasks/services/task.service.ts (updateTask method)
if (wasCompleted && task.metadata?.claimId) {
  // Call rewardClaimService.completeClaimFromTask(claimId, completedBy)
  // This triggers karma deduction and claim status update
}
```

## Claim Workflow State Machine

```
       [Create]
          ↓
      ┌─────────┐
      │ pending │ ← (Auto-task created)
      └─────────┘
          ↓ ↓
     Complete  Cancel
       (task)   (member/parent)
          ↓       ↓
    ┌──────────┬─────────┐
    │completed │cancelled│
    └──────────┴─────────┘
     (terminal) (terminal)
```

**State Transitions**:
- `pending → completed`: Task marked complete by parent → deduct karma, update metadata
- `pending → cancelled`: Member or parent cancels → delete auto-task
- No transitions from `completed` or `cancelled` (terminal states)

## Authorization Rules

### Reward Management
- **Create/Update/Delete**: Parent role required
- **Read (list/get)**: Any family member
- **Claim**: Any family member with sufficient karma

### Claim Management
- **Create (claim)**: Any family member
- **Cancel**: Claiming member OR any parent in family
- **Complete**: Implicit via task completion (parent role enforced by task assignment)
- **Read (list)**: Own claims or parent can view all family claims

## Validation Rules

### Reward Validation
- `name`: Required, 1-100 chars, non-empty after trim
- `description`: Optional, max 500 chars
- `karmaCost`: Required, integer, 1-1000 inclusive
- `imageUrl`: Optional, max 500 chars, must be valid HTTP(S) URL if provided

### Claim Validation
- Member must belong to family
- Reward must exist and belong to same family
- Member must have `totalKarma >= reward.karmaCost` at claim time
- Member cannot have multiple pending claims for the same reward (enforced at service layer)

### Metadata Validation
- Favourite toggle: Member-specific, idempotent operations
- Claim count: Auto-incremented only on claim completion, never decremented

## Error Handling

### Common Error Cases
- **Insufficient Karma** (400): Member attempts claim without enough karma
- **Reward Not Found** (404): Invalid reward ID or wrong family
- **Claim Not Found** (404): Invalid claim ID or not visible to requester
- **Unauthorized** (403): Non-parent attempts reward creation/deletion
- **Conflict** (409): Member attempts to claim same reward while pending claim exists
- **Parent Not Found** (500): Auto-task creation fails due to no parents in family (should never happen in valid data)

### Data Consistency Safeguards
- **Atomic Karma Deduction**: Use MongoDB transactions if available, or $inc operations with retry logic
- **Task Deletion on Cancel**: Ensure auto-task is deleted even if claim cancellation partially fails (eventual consistency acceptable)
- **Orphaned Tasks**: If task is manually deleted, claim remains pending (parent can still cancel via claim endpoint)

## Performance Considerations

### Query Optimization
- List rewards: Index on `{ familyId: 1 }` covers most queries
- List claims: Compound index `{ familyId: 1, memberId: 1, status: 1 }` optimizes filtered views
- Metadata aggregations: Pre-computed `claimCount` avoids scanning claims collection

### Caching Strategy (Future)
- Reward list per family (high read, low write)
- Member karma balance (shared with karma module)
- Not implemented in MVP; evaluate after usage patterns emerge

## Testing Strategy

### Unit Tests
- Validators: All field constraints and edge cases
- Mappers: Domain ↔ DTO conversions
- Services: Business logic in isolation (mock repositories)

### Integration Tests (E2E)
- Full claim workflow: Create reward → claim → complete task → verify karma deduction
- Cancellation paths: Member cancels, parent cancels
- Authorization matrix: Parent/child permissions on all endpoints
- Edge cases: Insufficient karma, duplicate pending claims, orphaned tasks
- Metadata operations: Favourite toggling, claim count updates

### Test Data Factory Extensions
- `createReward(overrides)`: Quick reward creation
- `createClaimWithTask(reward, member)`: Full pending claim setup
- `completeClaimWorkflow(claim)`: Fast-forward to completion for karma balance tests

## Migration Considerations
No migrations required; purely additive feature. However:
- Ensure karma service deduction method is deployed before rewards module goes live
- Task metadata schema extension is backwards-compatible (optional field)

## Future Enhancements (Out of Scope)
- **Reward Scheduling**: Time-based availability (e.g., "Weekend only")
- **Quantity Limits**: Cap on claims per time period
- **Reward Categories**: Organize rewards by type (privilege, treat, activity)
- **Approval Notes**: Parents add notes when completing reward tasks
- **Claim History View**: Timeline of all claims with filtering
- **Push Notifications**: Notify members when claim is completed/cancelled
