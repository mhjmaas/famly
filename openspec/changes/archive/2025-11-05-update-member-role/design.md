# Design: Update Member Role

## Architecture Overview
This change extends the existing family membership system with a single update operation. It follows the established patterns in the family module without introducing new architectural concepts.

## Technical Approach

### API Layer
**Route**: `PATCH /v1/families/:familyId/members/:memberId`

**Request**:
```typescript
{
  role: "Parent" | "Child"
}
```

**Response (200)**:
```typescript
{
  memberId: string,
  familyId: string,
  role: "Parent" | "Child",
  updatedAt: string  // ISO 8601 timestamp
}
```

**Error Responses**:
- `400`: Validation error (invalid role)
- `401`: Authentication required
- `403`: Not a parent in this family
- `404`: Family or member not found
- `409`: Member is not part of this family

### Implementation Components

#### 1. Validator (`update-member-role.validator.ts`)
- Zod schema validating `role` field
- Must be `FamilyRole.Parent` or `FamilyRole.Child`
- Express middleware pattern matching existing validators

#### 2. Repository Method (`family-membership.repository.ts`)
New method: `updateMemberRole(familyId, userId, role)`
- Uses MongoDB `updateOne` with `$set: { role, updatedAt }`
- Returns boolean indicating success
- Atomicity guaranteed by single MongoDB operation

#### 3. Service Method (`family.service.ts`)
New method: `updateMemberRole(familyId, memberId, role)`
- Validates family exists
- Validates member exists and belongs to family
- Delegates to repository
- Returns formatted response
- Throws appropriate `HttpError` for each failure case

#### 4. Route (`update-member-role.route.ts`)
- Express router matching existing route patterns
- Uses `authenticate` middleware
- Uses `authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] })` middleware
- Uses `validateUpdateMemberRole` middleware
- Parses `familyId` and `memberId` from route params
- Calls service method
- Returns 200 with updated membership data

#### 5. Domain Types (`family.ts`)
New interfaces:
```typescript
export interface UpdateMemberRoleRequest {
  role: FamilyRole;
}

export interface UpdateMemberRoleResponse {
  memberId: string;
  familyId: string;
  role: FamilyRole;
  updatedAt: string;
}
```

### Data Flow
1. Client sends PATCH request with JWT bearer token
2. `authenticate` middleware verifies token, attaches user to request
3. `authorizeFamilyRole` middleware verifies user is Parent in specified family
4. `validateUpdateMemberRole` middleware validates request body
5. Route handler extracts params, calls service
6. Service validates existence, calls repository
7. Repository updates MongoDB document
8. Service formats response
9. Route returns 200 with updated data

### Database Impact
**Modified Collection**: `family_memberships`

**Update Operation**:
```javascript
db.family_memberships.updateOne(
  { familyId: ObjectId(...), userId: ObjectId(...) },
  { $set: { role: "Parent", updatedAt: new Date() } }
)
```

**No Schema Changes Required**:
- `role` field already exists
- `updatedAt` field already exists
- No new indexes needed
- Existing unique index `idx_family_user_unique` ensures data integrity

### Security Considerations
1. **Authentication**: Required via `authenticate` middleware
2. **Authorization**: Only Parents can update roles (enforced by `authorizeFamilyRole`)
3. **Input Validation**: Zod schema ensures only valid roles accepted
4. **Data Integrity**: MongoDB unique index prevents duplicate memberships
5. **No Privilege Escalation**: A Parent can update any member's role, including other Parents (business requirement confirmed by user request)

### Error Handling
All errors use existing `HttpError` patterns:
- `HttpError.badRequest()` for validation failures
- `HttpError.unauthorized()` for missing auth
- `HttpError.forbidden()` for insufficient permissions
- `HttpError.notFound()` for missing family/member
- `HttpError.conflict()` for business rule violations

### Testing Strategy
**E2E Test Coverage**:
1. Successful Parent → Child update
2. Successful Child → Parent update
3. Authorization failure (non-parent attempts update)
4. Not found (invalid family ID)
5. Not found (invalid member ID)
6. Conflict (member not in family)
7. Validation failure (invalid role)

**Test Pattern**: Follow existing family e2e tests
- Use `getTestApp()` and `cleanDatabase()` helpers
- Use `request(baseUrl).patch(...)` for HTTP calls
- Create test users and families via registration flow
- Assert response status codes and body structure

### Rollback Plan
1. Remove route from `families.route.ts`
2. Remove validator, service method, and repository method
3. Remove domain types
4. Remove e2e test file
5. No data migration needed (updates are non-breaking)

## Alternative Approaches Considered

### Alternative 1: Full Member Update Endpoint
**Approach**: `PATCH /v1/families/:familyId/members/:memberId` accepting `{ role?, name?, birthdate? }`

**Rejected Because**:
- User explicitly requested role-only updates
- Name/birthdate belong to user profile, not family membership
- Mixing concerns violates single responsibility
- Future profile updates should use `/v1/auth/me` or similar

### Alternative 2: Role-Specific Endpoints
**Approach**: `POST /v1/families/:familyId/members/:memberId/promote` and `.../demote`

**Rejected Because**:
- Over-engineering for simple use case
- "Promote" and "demote" imply hierarchy that doesn't exist
- Less RESTful than standard PATCH
- Complicates API surface unnecessarily

## Open Questions
None. All requirements are clear from user request and existing implementation patterns.
