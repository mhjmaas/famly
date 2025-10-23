# Proposal: Add Creator Ownership Authorization

## Summary
Add a reusable creator-based authorization mechanism that enables filtering and access control for resources based on the `createdBy` field. This provides a parallel authorization pattern to family role-based auth, supporting scenarios where only the resource creator should have access (e.g., personal diaries).

## Motivation
All domain entities (tasks, shopping lists, family) include a `createdBy` field referencing the user who created the resource. Currently, we have family role-based authorization via `requireFamilyRole` utility and `authorizeFamilyRole` middleware. We need a similar pattern for creator-based ownership checks to:

1. **Support personal resources**: Enable features like personal diaries where only the creator can access their own entries
2. **Provide flexible filtering**: Allow services to easily filter resources by creator in repositories
3. **Maintain architectural consistency**: Follow the same proven pattern as family role authorization
4. **Enable fine-grained access control**: Support scenarios where family membership alone is insufficient

## Proposed Solution
Create a parallel authorization mechanism modeled after the existing family role pattern:

1. **Utility function** (`requireCreatorOwnership`): Core logic for checking if a user is the creator of a resource
   - Supports both object-level checks (given a createdBy ObjectId) and repository-based lookups
   - Throws descriptive HttpError.forbidden when unauthorized
   - Returns true when authorized

2. **Express middleware** (`authorizeCreatorOwnership`): Route guard for creator-only endpoints
   - Extracts resource ID from route parameters
   - Optionally queries repository to fetch resource and verify createdBy
   - Integrates with existing authentication middleware
   - Provides clear error messages

3. **Unit tests**: Comprehensive test coverage for the utility function
   - Tests authorization success scenarios
   - Tests forbidden scenarios (wrong creator, missing resource)
   - Tests edge cases and error conditions

## Impact
- **Scope**: Auth module only - new utility and middleware, no changes to existing code
- **Risk**: Low - self-contained addition following established patterns
- **Dependencies**: None - can be implemented immediately
- **Future use**: Will be used in upcoming personal diary feature and other creator-owned resources

## Alternatives Considered
1. **Ad-hoc checks in each service**: Rejected - leads to duplication and inconsistency
2. **Extend family role middleware**: Rejected - creator ownership is a distinct concern
3. **Generic resource ownership framework**: Deferred - YAGNI, start simple with creator-only

## Open Questions
None - the pattern mirrors the proven family role authorization approach.

## Why
This change introduces reusable creator-based authorization to support personal resources (like diaries) where access should be restricted to the resource creator only. By mirroring the proven family role authorization pattern, we maintain architectural consistency while enabling fine-grained access control beyond family membership.
