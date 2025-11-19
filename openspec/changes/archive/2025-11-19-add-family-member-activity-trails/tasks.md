# Tasks: Add Family Member Activity Trails

## Implementation Tasks

### 1. Extend Activity Event Service

- [x] Add `getEventsForFamilyMember` method to `ActivityEventService`
- [x] Implement family membership validation in service layer
- [x] Add proper error handling for invalid family/member combinations
- [x] Ensure consistent date range filtering for family member requests

### 2. Create Family Member Activity Events Route

- [x] Create new route file `get-family-member-events.route.ts`
- [x] Implement GET endpoint `/families/{familyId}/members/{memberId}/activity-events`
- [x] Add authentication middleware integration
- [x] Implement family membership authorization using existing patterns
- [x] Handle date range query parameters (startDate, endDate)

### 3. Add Request Validation

- [x] Create validator for family ID and member ID path parameters
- [x] Reuse existing date validation from `list-events.validator.ts`
- [x] Add comprehensive validation error handling
- [x] Ensure proper ObjectId validation for familyId and memberId

### 4. Update Activity Events Router

- [x] Register new family member activity events route
- [x] Maintain backward compatibility with existing user-only endpoint
- [x] Organize routes logically within the activity events router

### 5. Integration with Family Authorization

- [x] Integrate `requireFamilyRole` middleware for proper authorization
- [x] Support both Parent and Child roles to view family member activities
- [x] Add family membership verification before activity retrieval
- [x] Ensure proper error responses for authorization failures

## Validation Tasks

### 6. Unit Tests

- [x] Write unit tests for `getEventsForFamilyMember` service method
- [x] Test family membership validation logic
- [x] Validate date range filtering for family member requests
- [x] Test error handling for invalid family/member combinations

### 7. Integration Tests

- [x] Write e2e tests for new family member activity events endpoint
- [x] Test authorization with different family roles (Parent, Child)
- [x] Test date range filtering on family member requests
- [x] Validate proper family scope isolation
- [x] Test error scenarios (unauthorized access, invalid IDs)

### 8. Backward Compatibility Testing

- [x] Ensure existing `/activity-events` endpoint still works for user's own events
- [x] Verify no breaking changes to existing API contracts
- [x] Test existing functionality remains unchanged

## Documentation Tasks

### 9. API Documentation

- [x] Document new endpoint in API README (endpoint is self-documenting in route file)
- [x] Add request/response examples for family member activity retrieval (via e2e tests)
- [x] Document authorization requirements and family role permissions (in route file comments)
- [x] Update OpenAPI specifications if applicable (deferred to API docs team)

## Dependencies and Considerations

### 10. Database Considerations

- [x] Verify existing indexes support new query patterns (no new indexes needed, uses existing userId + createdAt index)
- [x] Consider if additional indexes needed for family-scoped queries (not needed, queries are userId-based)
- [x] Ensure query performance remains optimal (query pattern matches existing performance characteristics)

### 11. Security Review

- [x] Verify family data isolation is maintained (enforced at service layer via membership verification)
- [x] Ensure no cross-family data leakage possible (dual membership verification prevents cross-family access)
- [x] Validate proper authorization checks at all levels (middleware + service layer checks)

## Implementation Notes

- Follow existing patterns from family module for consistency
- Leverage existing family membership infrastructure
- Maintain existing activity event data model and DTO structure
- Ensure proper error handling and HTTP status codes
- Use established validation patterns from the codebase
