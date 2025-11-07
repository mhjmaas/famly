# Proposal: Implement Rewards Page

## Overview
Build a fully functional Rewards page that allows family members to view and claim rewards, parents to create and manage rewards, and handles the complete claiming workflow with pending status and parent approval tasks. This implementation brings the reference design (`reference/v0-famly/components/rewards-view.tsx`) to production with full API integration, state management, translations, and comprehensive testing.

## Problem Statement
Currently, the rewards page does not exist in the web application. Users cannot:
- View available rewards in their family with karma cost and metadata
- Favourite rewards to track savings progress with progress bars
- Claim rewards when they have sufficient karma
- Cancel pending claims
- Create, edit, and delete rewards (parent role only)
- See claim count and pending status for rewards
- Track karma balance and savings progress toward favourite rewards

## Proposed Solution
Build a production-ready Rewards page that:

1. **Displays rewards** from the existing API with rich metadata (claim count, favourite status, pending claims)
2. **Implements favouriting** with progress bars showing karma accumulation toward goals
3. **Handles reward claiming** with confirmation sheet and pending status tracking
4. **Manages pending claims** including cancellation and parent approval workflow visibility
5. **Provides reward management** (create/edit/delete) for parents with form validation
6. **Integrates with Redux** for karma balance, rewards state, and claims state
7. **Supports full i18n** with translations in English and Dutch
8. **Includes comprehensive testing** with E2E tests using page objects and 100% unit test coverage of Redux slices

## Scope

### In Scope
- Full Rewards page UI matching reference design with component breakdown
- Redux slices for rewards and claims state management
- Integration with existing rewards and claims API endpoints
- Karma balance display with visual indicator
- Favourite rewards with progress bars showing savings progress
- Reward claiming workflow with confirmation and pending status
- Pending claim cancellation functionality
- Reward CRUD operations (parent role only)
- Create/Edit reward dialog with form validation
- Empty states for no rewards and no family
- Complete i18n translations (en-US and nl-NL)
- E2E test suite with page object pattern
- Unit tests for Redux slices (100% coverage)
- Missing UI components if needed (Progress, Sheet if not present)

### Out of Scope
- Backend API modifications (all endpoints exist per rewards spec)
- Task completion triggering claim completion (backend handles this via task hooks)
- Claim history or analytics
- Reward categories or tags
- Bulk reward operations
- Reward templates
- Push notifications for claim status changes
- Reward expiration or availability scheduling

## Success Criteria
1. ✅ All reference design features are implemented with proper component structure
2. ✅ Rewards can be created, edited, deleted by parents
3. ✅ Members can claim rewards with sufficient karma
4. ✅ Favourite functionality works with accurate progress bars
5. ✅ Pending claims display correctly and can be cancelled
6. ✅ Karma integration works (display balance, update on claim completion)
7. ✅ All text is translated in both languages with proper keys
8. ✅ E2E tests use page objects and achieve complete user workflow coverage
9. ✅ Redux slices have 100% unit test coverage
10. ✅ No TypeScript errors or lint violations
11. ✅ Mobile, tablet, and desktop responsive layouts work
12. ✅ data-testid attributes follow project conventions

## Dependencies
- Existing rewards API endpoints (already implemented per rewards spec)
- Existing claims API endpoints (already implemented per rewards spec)
- Existing karma Redux slice (`apps/web/src/store/slices/karma.slice.ts`)
- Existing tasks integration (claims create auto-tasks for parents)
- Existing UI components (Button, Card, Dialog, Sheet, Badge, Progress, etc.)
- Existing i18n infrastructure and dictionary files

## Risk Assessment
- **Low Risk**: All backend endpoints exist and are fully tested per rewards spec
- **Low Risk**: Reference design provides complete UI specification
- **Medium Risk**: Redux state coordination between rewards, claims, and karma requires careful design
- **Medium Risk**: Component decomposition from reference monolith requires architectural decisions
- **Mitigation**: Follow TDD approach, start with unit tests for Redux slices
- **Mitigation**: Create detailed design.md documenting component structure and state management

## Open Questions

### 1. API Endpoint Investigation
**Question**: Which rewards/claims API endpoints are actually needed, and are any missing functionality?
**Investigation Required**: Review all endpoints in rewards spec against requirements
**Decision Point**: Identify any gaps and communicate to user before proceeding

### 2. Component Breakdown Strategy
**Question**: How should the large rewards-view.tsx be split into smaller logical components?
**Considerations**:
- RewardCard vs inline in list
- RewardForm vs inline in dialog
- ClaimConfirmation vs inline in sheet
- Balance display component
**Decision Point**: Document in design.md following patterns from tasks/family pages

### 3. Redux Store Structure
**Question**: Should we have separate slices for rewards and claims, or a combined rewards slice?
**Considerations**:
- Rewards and claims are closely related but have different lifecycles
- Karma slice integration points
- State normalization and denormalization strategies
**Decision Point**: Document in design.md with rationale

### 4. Pending Claims Visibility
**Question**: Should pending claims be shown in a separate section or inline with rewards?
**Considerations**: Reference design shows pending status on reward cards
**Decision Point**: Follow reference design pattern

### 5. Progress Bar Calculation
**Question**: Should progress bars cap at 100% or show overflow when user has more karma than needed?
**Answer from reference**: Cap at 100% per line 218 `Math.min(progress, 100)`

### 6. Claim Cancellation UX
**Question**: Where should claim cancellation be triggered from?
**Considerations**: Reference shows pending status but no explicit cancel button visible
**Decision Point**: Add cancel option in reward card dropdown or separate claims view

## Related Specifications
- `openspec/specs/rewards/spec.md` - Complete rewards and claims API specification
- `openspec/specs/karma/spec.md` - Karma system integration
- `openspec/specs/tasks/spec.md` - Auto-task creation for parent approval
- `openspec/specs/web-dashboard/spec.md` - Dashboard navigation and layout
