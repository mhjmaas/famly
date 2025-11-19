# Add Family Member Activity Trails

## Why

Parents need visibility into their children's activities and progress across the family platform. Currently, activity events are scoped only to the authenticated user, but family members need to view each other's activity trails to:

- Track children's task completions and progress
- Monitor family-wide activities like diary entries, recipe usage, and reward claims
- Maintain family oversight and engagement
- Provide context for family discussions and goal setting

This feature enables family members to view each other's activity traces while maintaining proper authorization boundaries within the family context.

## What Changes

### API Changes

- Add new endpoint `GET /families/{familyId}/members/{memberId}/activity-events` to retrieve activity events for a specific family member
- Add query parameter validation for date range filtering (startDate, endDate)
- Maintain existing endpoint `GET /activity-events` for user's own activity events (backward compatible)

### Authorization Model

- Require requesting user to be an authenticated member of the specified family
- Support both Parent and Child roles to view other family members' activities
- Ensure proper family membership verification using existing family membership infrastructure

### Implementation Approach

- Extend existing activity events repository and service layer
- Add family-scoped activity retrieval methods
- Implement proper authorization middleware integration
- Follow existing patterns from family module for membership verification

### Family Integration

- Leverage existing family membership repository for authorization
- Use established authorization patterns from require-family-role utilities
- Ensure family scope validation before activity retrieval
- Maintain data isolation between families

## Impact

- **Affected specs**: MODIFIED `activity-events` capability
- **Affected code**:
  - New route for family member activity retrieval
  - Extended service layer with family-scoped methods
  - Updated validators with family/member ID validation
  - Integration with existing family authorization infrastructure
- **Breaking changes**: None (additive changes only)
- **Dependencies**: Requires existing family membership functionality
