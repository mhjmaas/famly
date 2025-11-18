# Design: Family Member Activity Trails

## Architecture Overview

This design extends the existing activity events system to support family-scoped activity retrieval while maintaining backward compatibility and leveraging existing family infrastructure.

## Authorization Strategy

### Family Membership Scoping

The implementation uses the existing family membership repository (`FamilyMembershipRepository`) to validate that:

1. The requesting user is a member of the specified family
2. The target member is also a member of the same family
3. Both users belong to the same family context

### Role-Based Access Control

- **Parent Role**: Can view activity events for any family member
- **Child Role**: Can view activity events for any family member (including siblings)
- **Self-Access**: Any family member can access their own events via either endpoint

### Authorization Flow

```
Request: GET /families/{familyId}/members/{memberId}/activity-events
    ↓
Authentication (existing middleware)
    ↓
Family Membership Validation
    ├─ Verify requesting user is member of {familyId}
    ├─ Verify target {memberId} is member of {familyId}
    └─ Both users must belong to same family
    ↓
Activity Events Retrieval (scoped to target member)
    ↓
Response: ActivityEventDTO[]
```

## Implementation Approach

### 1. Service Layer Extensions

#### New Method: `getEventsForFamilyMember`

```typescript
async getEventsForFamilyMember(
  requestingUserId: string,
  familyId: string,
  memberId: string,
  startDate?: string,
  endDate?: string
): Promise<ActivityEvent[]>
```

**Validation Steps:**

1. Validate ObjectId formats for familyId and memberId
2. Verify requesting user membership in family using `FamilyMembershipRepository`
3. Verify target member membership in same family
4. Retrieve events for target member using existing repository method
5. Apply date filtering if provided
6. Return sorted events (most recent first)

### 2. Route Structure

#### New Endpoint: `GET /families/{familyId}/members/{memberId}/activity-events`

**Location:** `apps/api/src/modules/activity-events/routes/get-family-member-events.route.ts`

**Features:**

- Integrates with existing authentication middleware
- Uses `requireFamilyRole` for family membership validation
- Supports date range query parameters (startDate, endDate)
- Returns ActivityEventDTO array with 100-event limit
- Maintains existing error handling patterns

#### Route Registration

Update `apps/api/src/modules/activity-events/routes/activity-events.router.ts`:

```typescript
// Add new route alongside existing listEventsRoute()
router.use("/", getFamilyMemberEventsRoute());
```

### 3. Validation Strategy

#### Path Parameter Validation

- `familyId`: Valid ObjectId format required
- `memberId`: Valid ObjectId format required
- HTTP 400 for invalid ObjectId formats
- HTTP 404 for non-existent family/member combinations

#### Query Parameter Validation

- Reuse existing `listEventsQuerySchema` for date validation
- Support optional `startDate` and `endDate` parameters
- Validate date format (YYYY-MM-DD)
- HTTP 400 for invalid date formats

### 4. Integration Points

#### Family Membership Repository

- Use `findByFamilyAndUser()` to verify memberships
- Validate both requesting user and target member are in same family
- Handle cases where family or members don't exist

#### Authentication Middleware

- Leverage existing authentication that already hydrates user families
- Use `req.user.families` for fast membership verification when available
- Fall back to repository queries when needed

#### Activity Events Infrastructure

- Reuse existing `ActivityEventRepository.findByUserInDateRange()` method
- Maintain existing DTO mapping with `toActivityEventDTO()`
- Preserve existing sorting and pagination behavior

## Security Considerations

### Data Isolation

- Family scope is enforced at the service layer
- No direct database access without family membership validation
- Query results are automatically scoped by userId (target member)

### Authorization Boundaries

- Users cannot access activity events outside their family
- Cross-family access attempts return HTTP 403
- Invalid family/member combinations return HTTP 404

### Input Validation

- All user inputs are validated before database queries
- ObjectId validation prevents injection attacks
- Date format validation prevents malformed queries

## Performance Considerations

### Database Queries

- Leverage existing `userId + createdAt` index
- No additional indexes required for family-scoped queries
- Query pattern: userId + date range (existing index support)

### Caching Strategy

- Consider family membership caching for frequently accessed families
- Leverage existing authentication middleware family hydration
- No additional caching for activity events (existing 100-event limit)

## Backward Compatibility

### Existing Endpoint Preservation

- `GET /activity-events` continues to work unchanged
- No modifications to existing service methods
- Existing validation and error handling preserved

### Data Model Consistency

- ActivityEvent DTO structure remains identical
- No changes to event recording or storage
- Existing activity event types and metadata preserved

## Error Handling

### HTTP Status Codes

- **200**: Success with ActivityEventDTO array
- **400**: Invalid familyId, memberId, or date parameters
- **401**: Authentication required (existing behavior)
- **403**: Not a member of specified family
- **404**: Family or family member not found

### Error Response Format

Use existing HttpError patterns:

```typescript
// 403 Forbidden
throw HttpError.forbidden("You are not a member of this family");

// 404 Not Found
throw HttpError.notFound("Family member not found");

// 400 Bad Request
throw HttpError.badRequest("Invalid familyId format");
```

## Testing Strategy

### Unit Tests

- Test new service method `getEventsForFamilyMember`
- Validate family membership verification logic
- Test date range filtering for family member requests
- Verify error handling for invalid inputs

### Integration Tests

- End-to-end testing of family member activity endpoints
- Authorization testing with different family roles
- Cross-family access attempt testing
- Date range filtering validation

### Compatibility Tests

- Verify existing `/activity-events` endpoint unchanged
- Test existing functionality remains intact
- Validate no regressions in current behavior

## Migration Strategy

### Phase 1: Service Layer

1. Add `getEventsForFamilyMember` method to service
2. Implement family membership validation
3. Add comprehensive unit tests

### Phase 2: Route Implementation

1. Create new route handler
2. Add validation for family/member IDs
3. Integrate with existing router
4. Add integration tests

### Phase 3: Documentation

1. Update API documentation
2. Add request/response examples
3. Document authorization requirements

This design ensures minimal impact on existing functionality while providing the requested family member activity trail capability through a well-architected, secure, and maintainable implementation.
