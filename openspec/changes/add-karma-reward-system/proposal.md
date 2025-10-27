# Proposal: add-karma-reward-system

## Overview
Implement a karma-based reward system that tracks and awards points to family members for completing tasks and other family activities. The system maintains family-specific karma totals per member with full event history, allowing parents to incentivize participation and children to earn recognition for contributions.

## Goals
- Track karma points per family member per family (multi-family support)
- Maintain complete event history for karma transactions
- Integrate karma rewards with task completion workflow
- Support manual karma grants with optional descriptions
- Provide REST API endpoints for karma balance and history retrieval
- Enable direct service-to-service calls without external queue infrastructure

## Non-Goals
- Karma redemption or marketplace features
- Cross-family karma transfers
- Karma leaderboards or gamification UI elements
- External notification/webhooks for karma events
- Scheduled karma grants or time-based rewards
- Negative karma or penalties

## Background
Family members need incentives to engage with household tasks and responsibilities. A karma point system provides a lightweight reward mechanism that encourages participation while giving parents visibility into contributions. This complements the existing task system by adding an optional incentive layer.

### Rationale
- **Family-specific tracking**: Members may belong to multiple families, each with independent karma totals
- **Event history**: Audit trail for all karma grants enables transparency and dispute resolution
- **Optional integration**: Karma remains strictly optional—tasks work identically without karma metadata
- **Direct service calls**: Avoids infrastructure complexity by using synchronous service calls
- **Task-driven**: Initial integration focuses on task completion as primary karma source

## User Impact
- Positive: Motivates family members to complete tasks and participate
- Positive: Provides parents with reward mechanism for positive reinforcement
- Positive: Transparent history shows how karma was earned
- Neutral: Optional feature—families can ignore karma entirely
- Risk: Potential over-emphasis on points may reduce intrinsic motivation

## Technical Approach

### Domain Model
The karma feature introduces three core entities:
- **MemberKarma**: Aggregate karma total for a specific member in a specific family
- **KarmaEvent**: Individual karma transaction record with source, amount, and description
- **Task Integration**: Optional karma metadata on tasks that triggers karma grants on completion

### Database Collections
- `member_karma`: Stores aggregate karma totals (one document per member per family)
  - Fields: `_id`, `familyId`, `userId`, `totalKarma`, `createdAt`, `updatedAt`
  - Unique index on `(familyId, userId)`
- `karma_events`: Stores individual karma transaction history
  - Fields: `_id`, `familyId`, `userId`, `amount`, `source`, `description`, `metadata`, `createdAt`
  - Indexes on `(familyId, userId)` and `createdAt` for efficient history queries

### Task Integration Strategy
- Add optional `metadata.karma` field to Task domain model (type: `number`, optional)
- On task completion (when `completedAt` is set), TaskService calls KarmaService
- KarmaService awards karma with description: `"Completed task <taskName>"`
- Recurring tasks award karma on each completion if metadata is present

### Service Architecture
Following KISS principle and existing codebase patterns:
- `KarmaService`: Business logic for awarding karma, calculating totals, retrieving history
- `KarmaRepository`: Data access for `karma_events` and `member_karma` collections
- Direct synchronous calls from TaskService to KarmaService (no queues)
- Error handling: If karma grant fails, log error but don't block task completion
- Idempotency: Not required—multiple karma grants for same task are valid (e.g., manual correction)

### Authorization Strategy
- All karma endpoints require authentication via JWT
- Family membership verification required for all operations
- Parent role required for manual karma grants (prevents children from self-granting)
- All members can view karma balances and history within their families

### API Patterns
Following existing codebase conventions:
- Zod validators for request validation
- Repository pattern for data access
- Service layer for business logic
- Mapper functions for DTO transformations
- Express routers under family routes: `/v1/families/{familyId}/karma/*`
- Structured error responses using HttpError

## Alternatives Considered

### Alternative 1: Event-driven architecture with message queue
**Rejected**: Adds significant infrastructure complexity (queue management, retry logic, dead letter handling) without clear benefit for MVP. Direct service calls are simpler, sufficient for current scale, and easier to reason about. Can migrate to event-driven architecture if scaling needs emerge.

### Alternative 2: Store karma total as sum of events (no aggregate collection)
**Rejected**: Would require summing all events on every balance query, creating performance issues as event history grows. Separate aggregate collection enables O(1) balance lookups while maintaining full event history.

### Alternative 3: Embed karma in family_memberships collection
**Rejected**: Violates Single Responsibility Principle—family membership concerns are orthogonal to reward tracking. Separate collection enables independent evolution and clearer domain boundaries.

### Alternative 4: Make karma mandatory on all tasks
**Rejected**: Contradicts requirement that karma be optional. Forces all families to use reward system even if not desired. Optional approach enables gradual adoption.

## Dependencies
- Existing: TaskService (for completion integration)
- Existing: FamilyMembershipRepository (for authorization)
- None: No external dependencies required

## Risks and Mitigations

### Risk 1: Karma grant failure blocks task completion
- **Likelihood**: Low
- **Impact**: High (broken task workflow)
- **Mitigation**: Wrap karma service calls in try-catch; log errors but allow task completion to succeed

### Risk 2: Inconsistent karma totals vs event history
- **Likelihood**: Medium
- **Impact**: Medium (data integrity concerns)
- **Mitigation**: Implement validation endpoint to reconcile totals against events; document manual fix procedure

### Risk 3: Performance degradation with large event history
- **Likelihood**: Medium (after extended usage)
- **Impact**: Medium (slow history queries)
- **Mitigation**: Implement proper indexing on `(familyId, userId, createdAt)`; add cursor-based pagination to history endpoint

### Risk 4: Race conditions on concurrent karma grants
- **Likelihood**: Low
- **Impact**: Low (minor karma total inaccuracy)
- **Mitigation**: Use MongoDB's `$inc` operator for atomic updates to karma totals

## Open Questions
1. Should karma totals ever decrease?
   - **Proposed**: No negative karma in MVP. Future enhancement could add penalties.

2. What's the maximum reasonable karma value?
   - **Proposed**: No artificial limit. Use numeric type that supports large values.

3. Should we track who granted manual karma?
   - **Proposed**: Yes, store `grantedBy` userId in karma event metadata for audit purposes.

4. How far back should history queries go?
   - **Proposed**: No time limit in MVP. All events are queryable with cursor pagination.

## Success Metrics
- Family members can earn karma by completing tasks with karma metadata
- Parents can manually grant karma to family members
- Karma balances are accurate and reflect all events
- Event history provides complete audit trail
- API authorization prevents unauthorized karma manipulation
- Task completion workflow remains reliable even if karma grants fail

## Timeline Estimate
- **Design & Planning**: Complete (this proposal)
- **Implementation**: 2-3 days
  - Day 1: Domain models, repositories, indexes, karma service core logic
  - Day 2: API routes, validators, family integration, manual grant endpoint
  - Day 3: Task integration, error handling, E2E tests
- **Testing & Review**: 1 day
- **Total**: 3-4 days

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Approval
- [ ] Security Review (if applicable)
