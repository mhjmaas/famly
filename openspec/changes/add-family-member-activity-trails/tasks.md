# Tasks: Add Family Member Activity Trails

## Implementation Tasks

### 1. Extend Activity Event Service

- [ ] Add `getEventsForFamilyMember` method to `ActivityEventService`
- [ ] Implement family membership validation in service layer
- [ ] Add proper error handling for invalid family/member combinations
- [ ] Ensure consistent date range filtering for family member requests

### 2. Create Family Member Activity Events Route

- [ ] Create new route file `get-family-member-events.route.ts`
- [ ] Implement GET endpoint `/families/{familyId}/members/{memberId}/activity-events`
- [ ] Add authentication middleware integration
- [ ] Implement family membership authorization using existing patterns
- [ ] Handle date range query parameters (startDate, endDate)

### 3. Add Request Validation

- [ ] Create validator for family ID and member ID path parameters
- [ ] Reuse existing date validation from `list-events.validator.ts`
- [ ] Add comprehensive validation error handling
- [ ] Ensure proper ObjectId validation for familyId and memberId

### 4. Update Activity Events Router

- [ ] Register new family member activity events route
- [ ] Maintain backward compatibility with existing user-only endpoint
- [ ] Organize routes logically within the activity events router

### 5. Integration with Family Authorization

- [ ] Integrate `requireFamilyRole` middleware for proper authorization
- [ ] Support both Parent and Child roles to view family member activities
- [ ] Add family membership verification before activity retrieval
- [ ] Ensure proper error responses for authorization failures

## Validation Tasks

### 6. Unit Tests

- [ ] Write unit tests for `getEventsForFamilyMember` service method
- [ ] Test family membership validation logic
- [ ] Validate date range filtering for family member requests
- [ ] Test error handling for invalid family/member combinations

### 7. Integration Tests

- [ ] Write e2e tests for new family member activity events endpoint
- [ ] Test authorization with different family roles (Parent, Child)
- [ ] Test date range filtering on family member requests
- [ ] Validate proper family scope isolation
- [ ] Test error scenarios (unauthorized access, invalid IDs)

### 8. Backward Compatibility Testing

- [ ] Ensure existing `/activity-events` endpoint still works for user's own events
- [ ] Verify no breaking changes to existing API contracts
- [ ] Test existing functionality remains unchanged

## Documentation Tasks

### 9. API Documentation

- [ ] Document new endpoint in API README
- [ ] Add request/response examples for family member activity retrieval
- [ ] Document authorization requirements and family role permissions
- [ ] Update OpenAPI specifications if applicable

## Dependencies and Considerations

### 10. Database Considerations

- [ ] Verify existing indexes support new query patterns
- [ ] Consider if additional indexes needed for family-scoped queries
- [ ] Ensure query performance remains optimal

### 11. Security Review

- [ ] Verify family data isolation is maintained
- [ ] Ensure no cross-family data leakage possible
- [ ] Validate proper authorization checks at all levels

## Implementation Notes

- Follow existing patterns from family module for consistency
- Leverage existing family membership infrastructure
- Maintain existing activity event data model and DTO structure
- Ensure proper error handling and HTTP status codes
- Use established validation patterns from the codebase
