# Rewards Module

## Overview

The Rewards module enables families to define meaningful rewards that family members can claim using karma points earned through task completion. This module provides a complete workflow for creating, managing, and claiming rewards, with integrated approval processes and karma deduction.

## Architecture

### Module Structure

```
rewards/
├── domain/           # Type definitions and interfaces
├── repositories/     # Data access layer (MongoDB)
├── services/         # Business logic and orchestration
├── routes/           # API endpoints and request handling
├── validators/       # Input validation
├── lib/              # Mappers and utilities
└── index.ts          # Module exports
```

### Layers

1. **Domain Layer** (`domain/`): Defines `Reward`, `RewardClaim`, and `RewardMetadata` interfaces with DTOs
2. **Repository Layer** (`repositories/`): Handles MongoDB CRUD operations with three collections
3. **Service Layer** (`services/`): Orchestrates business logic, handles claim workflow
4. **Route Layer** (`routes/`): Express route handlers with authentication and validation
5. **Validation Layer** (`validators/`): Zod-based input validation for all endpoints

## Collections

### Rewards Collection

Stores reward definitions for families:

```typescript
interface Reward {
  _id: ObjectId;
  familyId: ObjectId;           // Family this reward belongs to
  name: string;                 // 1-100 characters
  karmaCost: number;            // 1-1000
  description?: string;         // Optional, max 500 chars
  imageUrl?: string;            // Optional, valid HTTP(S) URL
  createdBy: ObjectId;          // Parent who created the reward
  createdAt: Date;
  updatedAt: Date;
}
```

### RewardClaims Collection

Tracks member claims with approval workflow:

```typescript
interface RewardClaim {
  _id: ObjectId;
  rewardId: ObjectId;
  familyId: ObjectId;
  memberId: ObjectId;           // Member claiming the reward
  status: "pending" | "completed" | "cancelled";
  autoTaskId?: ObjectId;        // Auto-created task for approval
  createdAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: ObjectId;       // Who cancelled (member or parent)
}
```

### RewardMetadata Collection

Stores per-member metadata (favourites, claim counts):

```typescript
interface RewardMetadata {
  _id: string;                  // Composite: `${familyId}_${rewardId}_${memberId}`
  familyId: ObjectId;
  rewardId: ObjectId;
  memberId: ObjectId;
  isFavourite: boolean;         // Member marked as favourite
  claimCount: number;           // How many times member has claimed this reward
  lastClaimedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Claim Lifecycle State Machine

```
[Claim Created]
      ↓
  ┌─[pending]─────────────────┐
  │                           │
  │ - Auto-task created       │
  │ - Awaiting parent approval │
  │                           │
  ├─→ [completed]           │
  │   - Task completed       │
  │   - Karma deducted       │
  │   - Metadata updated     │
  │                           │
  └─→ [cancelled]
      - Member/parent cancel
      - Task deleted
      - Karma preserved
```

## Core Features

### 1. Reward Management

**Create Reward** (Parent only)
- Define reward with name, karma cost, description, and image
- Validation: name 1-100 chars, karmaCost 1-1000, description max 500 chars
- Returns reward DTO with metadata

**List Rewards** (Any family member)
- Shows all family rewards
- Includes member-specific metadata (favourites, claim counts)

**Get Reward Details** (Any family member)
- Returns complete reward info with aggregated metadata
- Shows total claims and favourite counts across family

**Update Reward** (Parent only)
- Modify reward properties (name, cost, description, image)
- Works even with existing claims

**Delete Reward** (Parent only)
- Only allowed if no pending claims exist
- Completed and cancelled claims don't block deletion

### 2. Claim Workflow

**Create Claim** (Any family member)
1. Validates reward exists
2. Checks member has sufficient karma
3. Prevents duplicate pending claims
4. Creates claim with `status: pending`
5. Auto-creates approval task for parents
6. Returns claim DTO with auto-task ID

**Cancel Claim** (Member or parent)
1. Validates claim is pending
2. Deletes associated auto-task
3. Updates claim to `status: cancelled`
4. Preserves karma (not deducted yet)

**Complete Claim** (Triggered by task completion)
1. Validates claim is pending
2. Re-checks member has sufficient karma at completion time
3. Updates claim to `status: completed`
4. Calls karma service to deduct karma
5. Increments metadata claim count (best-effort, non-blocking)

### 3. Member Metadata

**Toggle Favourite**
- Members can mark rewards as personal favourites
- Status is per-member, per-reward
- Persists across operations

**Claim Tracking**
- Metadata tracks how many times each member has claimed a reward
- Used for analytics and recommendations
- Updated when claims complete

## Integration Points

### Karma Module Integration

The rewards module depends on the karma service:

```typescript
// Validate karma availability before claim creation
const memberKarma = await karmaService.getMemberKarma(
  familyId,
  memberId,
  memberId,
);

// Deduct karma when claim completes
await karmaService.deductKarma({
  familyId,
  memberId,
  amount: reward.karmaCost,
  source: 'reward_redemption',
  metadata: { rewardId, claimId },
});
```

### Tasks Module Integration

Auto-created approval tasks:

```typescript
// Task created when claim is created
const task = await taskService.createTask(familyId, memberId, {
  name: `Provide reward: ${reward.name}`,
  description: `Deduct ${reward.karmaCost} karma for...`,
  assignment: { type: 'role', role: 'parent' },
  metadata: { claimId },
});

// Claim completed when task completes (via task completion hook)
```

## API Endpoints

### Reward Endpoints

```
POST   /v1/families/:familyId/rewards          # Create reward (parent)
GET    /v1/families/:familyId/rewards          # List rewards (any member)
GET    /v1/families/:familyId/rewards/:id      # Get reward details (any member)
PATCH  /v1/families/:familyId/rewards/:id      # Update reward (parent)
DELETE /v1/families/:familyId/rewards/:id      # Delete reward (parent)
```

### Claim Endpoints

```
POST   /v1/families/:familyId/claims           # Create claim (any member)
GET    /v1/families/:familyId/claims           # List claims (any member)
GET    /v1/families/:familyId/claims/:id       # Get claim details (any member)
DELETE /v1/families/:familyId/claims/:id       # Cancel claim (member or parent)
```

### Metadata Endpoints

```
POST   /v1/families/:familyId/rewards/:id/favourite  # Toggle favourite
```

## Authorization

| Operation | Parent | Child | Parent of another | External |
|-----------|--------|-------|-------------------|----------|
| Create reward | ✓ | ✗ | ✗ | ✗ |
| Update reward | ✓ | ✗ | ✗ | ✗ |
| Delete reward | ✓ | ✗ | ✗ | ✗ |
| List rewards | ✓ | ✓ | ✗ | ✗ |
| Get reward | ✓ | ✓ | ✗ | ✗ |
| Claim reward | ✓ | ✓ | ✗ | ✗ |
| Cancel own claim | ✓ | ✓ | ✗ | ✗ |
| Cancel member's claim | ✓ | ✗ | ✗ | ✗ |
| List claims | ✓ | ✓ | ✗ | ✗ |
| Toggle favourite | ✓ | ✓ | ✗ | ✗ |

## Error Handling

### Common HTTP Responses

| Status | Scenario |
|--------|----------|
| 201 | Reward/claim created successfully |
| 200 | Operation successful (read/update/delete) |
| 204 | Delete successful (no content) |
| 400 | Validation error or insufficient karma |
| 401 | Authentication required |
| 403 | Authorization failed (wrong role/family) |
| 404 | Reward/claim not found |
| 409 | Conflict (e.g., duplicate pending claim, pending claims block delete) |

### Key Error Messages

- `"Only parents can create rewards"` - Authorization
- `"Insufficient karma. Required: X, Available: Y"` - Karma validation
- `"Member already has a pending claim for this reward"` - Duplicate prevention
- `"Cannot delete reward with pending claims..."` - Constraint violation
- `"Cannot cancel a completed claim..."` - State validation

## Design Decisions and Trade-offs

### 1. Auto-Task Creation for Approval

**Decision**: Auto-create tasks when rewards are claimed
**Rationale**:
- Ensures parent visibility and control
- Integrates naturally with task completion workflow
- Provides audit trail of approvals

**Trade-off**:
- Extra database operation, failure handled gracefully
- Task creation failures don't block claim creation (logged)

### 2. Metadata as Separate Collection

**Decision**: Store metadata separately from claims
**Rationale**:
- Metadata is optional, independent of claim lifecycle
- Allows efficient queries for aggregations (claim counts, favourites)
- Scales better with large numbers of members

**Trade-off**:
- Extra collection to maintain
- Metadata updates are best-effort (non-blocking on claim completion)

### 3. Graceful Metadata Degradation

**Decision**: Claim completion succeeds even if metadata update fails
**Rationale**:
- Metadata is analytics/UX only, not critical to core workflow
- Prevents cascading failures
- Users still get their reward, metadata can be backfilled

**Trade-off**:
- Metadata might be temporarily inconsistent
- Requires monitoring and occasional repair jobs

### 4. Duplicate Pending Claim Prevention

**Decision**: Only one pending claim per member per reward
**Rationale**:
- Prevents spam claims
- Simplifies approval workflow (one task per claim)
- Clear semantics (no duplicate approvals)

**Trade-off**:
- Member must cancel claim before re-claiming
- Different rewards have separate pending claims (no global limit)

### 5. Karma Re-validation at Completion

**Decision**: Check karma again when claim completes (not just at creation)
**Rationale**:
- Handles race conditions where member earned/lost karma
- Prevents over-deduction
- Safe default: reject claim completion if insufficient

**Trade-off**:
- Requires re-verification at completion time
- Task remains completed even if claim completion fails

## Usage Examples

### Create a Reward

```typescript
const rewardService = new RewardService(rewardRepo, metadataRepo);

const reward = await rewardService.createReward(
  familyId,
  parentId,
  {
    name: "Movie Night",
    karmaCost: 50,
    description: "One movie night of their choice",
    imageUrl: "https://example.com/movie.png",
  }
);
```

### Claim a Reward

```typescript
const claimService = new ClaimService(
  claimRepo,
  rewardRepo,
  metadataRepo,
  karmaService,
  taskService,
);

const claim = await claimService.createClaim(
  rewardId,
  familyId,
  memberId,
);
// Returns: { _id, status: 'pending', autoTaskId, ... }
```

### Cancel a Claim

```typescript
const cancelledClaim = await claimService.cancelClaim(
  claimId,
  cancellingUserId,
);
// Returns: { _id, status: 'cancelled', cancelledAt, cancelledBy, ... }
```

### Mark as Favourite

```typescript
await metadataRepository.upsertFavourite(
  familyId,
  rewardId,
  memberId,
  true,
);
```

## Testing

The module includes comprehensive test coverage:

- **Unit Tests**: Repository, service, and validator tests with mocked dependencies
- **E2E Tests**: Full workflow tests covering:
  - CRUD operations
  - Claim lifecycle (create → complete → verify)
  - Authorization matrix
  - Edge cases (not found, duplicates, constraints)
  - Error handling (insufficient karma, conflicts)
  - Concurrent operations
  - Boundary values

Run tests with:
```bash
pnpm -C apps/api run test:unit
pnpm -C apps/api run test:e2e
```

## Performance Considerations

1. **Metadata Indexing**: Collection indexed on `{ rewardId, memberId }` for efficient lookups
2. **Claim Queries**: Indexed on `{ rewardId, memberId, status }` for duplicate prevention
3. **Aggregations**: Total claim/favourite counts computed on-demand (cached in HTTP responses)
4. **Best-Effort Metadata**: Non-blocking metadata updates prevent slow claim completions

## Future Enhancements

1. **Reward Redemption Limits**: Limit claims per member per time period
2. **Reward Categories**: Organize rewards by type for better UX
3. **Bulk Claims**: Process multiple claims in one operation
4. **Claim History**: Archive completed/cancelled claims separately
5. **Reward Analytics**: Dashboard showing popular rewards, redemption rates
6. **Conditional Rewards**: Show rewards only to members meeting criteria
