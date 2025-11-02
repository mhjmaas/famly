# Proposal: Add Karma Rewards System

## Change ID
`add-karma-rewards`

## Status
Draft

## Overview
Introduce a family-specific rewards system that allows parents to define redeemable rewards for family members. Members with sufficient karma can claim rewards, triggering a parent approval workflow via auto-generated tasks. This feature gamifies household participation and provides tangible incentives for children to earn karma through task completion.

## Problem Statement
The current karma system tracks points but provides no mechanism for members to redeem their earned karma for meaningful rewards. Families need a way to:
- Define custom rewards that motivate their members
- Control reward distribution through parent approval
- Track which rewards are popular or frequently claimed
- Provide transparency in the karma redemption process

## Proposed Solution
Implement a rewards module with two core collections:
1. **Rewards Collection** - Parent-defined rewards with karma costs
2. **Claims Collection** - Tracks pending and completed reward claims with task references

The workflow ensures parent oversight:
1. Parent creates reward (e.g., "30 minutes extra screen time" for 50 karma)
2. Member with ≥50 karma claims the reward
3. System auto-creates task for parent role: "Provide reward: 30 minutes extra screen time for [Name]"
4. Parent completes task → karma deducted, claim completed, metadata updated
5. Member or parent can cancel pending claim → task deleted, claim cancelled

## Impact Assessment

### User Value
- **For Parents**: Control over reward definitions and distribution, visibility into what motivates their children
- **For Children**: Clear goals for karma accumulation, tangible rewards for household contributions
- **For Families**: Shared understanding of reward costs and availability

### Technical Complexity
- **Medium**: Requires new module with 2 collections, integration with existing tasks and karma systems
- **Dependencies**:
  - Extends karma system to support deductions (currently only additions)
  - Integrates with tasks module for auto-task creation
  - Family role-based authorization (parent-only reward creation)

### Risk Analysis
- **Data Consistency**: Must maintain atomicity between claim status, task state, and karma balance
- **Race Conditions**: Multiple members claiming the same reward simultaneously with limited karma
- **Backwards Compatibility**: No breaking changes; purely additive feature

## Scope

### In Scope
- Reward CRUD operations (parent-only creation/update/deletion)
- Reward claim workflow with pending state
- Auto-task generation for parent approval
- Karma deduction on task completion
- Claim cancellation by member or parent
- Member-specific favourite tracking
- Metadata tracking (claim count, favourites)
- Validation: sufficient karma, family membership, parent role

### Out of Scope
- Reward expiration or scheduling
- Reward quantity limits (unlimited claims if karma sufficient)
- Reward images stored in system (URLs only)
- Notification system for claim status changes
- Reward categories or tags
- Analytics dashboard for reward trends

## Dependencies

### Spec Dependencies
- **karma** (existing): Must extend to support karma deduction operations
- **tasks** (existing): Auto-task creation relies on current task creation API
- **family** (existing): Role-based authorization for parent-only operations

### Implementation Dependencies
- Karma service must expose deduction method
- Task service must support programmatic task creation
- Family membership repository for role validation

## Breaking Changes
None. This is a purely additive feature with no modifications to existing APIs or data structures.

## Alternatives Considered

### Alternative 1: Rewards without approval workflow
**Approach**: Immediate karma deduction on claim without parent task creation
**Rejected because**: Removes parent oversight, potential for abuse, less engaging for families who want approval workflows

### Alternative 2: Global rewards (not family-specific)
**Approach**: Platform-defined rewards available to all families
**Rejected because**: Each family has unique reward preferences; customization is key value proposition

### Alternative 3: Reward inventory with quantity limits
**Approach**: Parents define quantity limits (e.g., "Ice cream: 5 available this month")
**Deferred to**: Future iteration; adds significant complexity for MVP

## Success Metrics
- Number of rewards created per family (target: avg 3-5)
- Claim success rate (claimed → completed ratio, target: >80%)
- Cancellation rate (target: <20%)
- Member engagement (% of members with ≥1 claim, target: >60%)

## Open Questions
None remaining after clarification session.

## References
- [Karma Spec](../../specs/karma/spec.md)
- [Tasks Spec](../../specs/tasks/spec.md)
- [Family Spec](../../specs/family/spec.md)
