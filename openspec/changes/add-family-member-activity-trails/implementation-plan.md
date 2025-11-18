# Backend Implementation Plan: Family Member Activity Trails

## Overview

This implementation plan provides concrete steps to extend the existing activity events system to support family member activity trail retrieval. The approach leverages existing infrastructure and patterns to minimize complexity while ensuring proper authorization and data isolation.

## Implementation Files Structure

```
apps/api/src/modules/activity-events/
├── routes/
│   ├── get-family-member-events.route.ts     [NEW]
│   └── activity-events.router.ts             [MODIFIED]
├── validators/
│   └── get-family-member-events.validator.ts [NEW]
└── services/
    └── activity-event.service.ts             [MODIFIED]
```

## ObjectID Termination Pattern

This implementation follows the established ObjectID termination pattern:

- **Route Layer**: Communicates using strings (familyId, memberId as strings)
- **Service Layer**: Validates and normalizes strings to ObjectIdString, performs business logic with strings
- **Repository Boundary**: Converts ObjectIdString to ObjectId only at the repository layer
- **Return Journey**: Repository returns ObjectId → Service converts to strings → Route returns DTOs

## Phase 1: Service Layer Implementation

### 1.1 Extend ActivityEventService

**File:** `apps/api/src/modules/activity-events/services/activity-event.service.ts`

**Changes Required:**

```typescript
// Add to existing ActivityEventService class:

/**
 * Get activity events for a family member with family membership validation
 *
 * @param requestingUserId - The ID of the user making the request (string)
 * @param familyId - The family ID to scope the request to (string)
 * @param memberId - The family member whose events to retrieve (string)
 * @param startDate - Optional start date in YYYY-MM-DD format (string)
 * @param endDate - Optional end date in YYYY-MM-DD format (string)
 * @returns Array of activity events (up to 100), sorted by most recent first
 * @throws HttpError 403 if requesting user is not a family member
 * @throws HttpError 404 if family or member not found
 */
async getEventsForFamilyMember(
  requestingUserId: string,
  familyId: string,
  memberId: string,
  startDate?: string,
  endDate?: string,
): Promise<ActivityEvent[]> {
  let normalizedFamilyId: ObjectIdString | undefined;
  let normalizedMemberId: ObjectIdString | undefined;
  let normalizedRequestingUserId: ObjectIdString | undefined;

  try {
    // Step 1: Validate and normalize string IDs to ObjectIdString (service boundary)
    normalizedRequestingUserId = validateObjectId(requestingUserId, "requestingUserId");
    normalizedFamilyId = validateObjectId(familyId, "familyId");
    normalizedMemberId = validateObjectId(memberId, "memberId");

    // Step 2: Verify family membership using strings (service boundary)
    // Import FamilyMembershipRepository for authorization
    const { FamilyMembershipRepository } = await import("@modules/family/repositories/family-membership.repository");
    const membershipRepo = new FamilyMembershipRepository();

    // Check requesting user membership in family (string parameters)
    const requestingMembership = await membershipRepo.findByFamilyAndUser(
      normalizedFamilyId,
      normalizedRequestingUserId,
    );

    if (!requestingMembership) {
      throw HttpError.forbidden("You are not a member of this family");
    }

    // Check target member membership in same family (string parameters)
    const targetMembership = await membershipRepo.findByFamilyAndUser(
      normalizedFamilyId,
      normalizedMemberId,
    );

    if (!targetMembership) {
      throw HttpError.notFound("Family member not found");
    }

    // Step 3: Convert to ObjectId for repository call (repository boundary)
    const memberObjectId = toObjectId(normalizedMemberId, "memberId");

    logger.debug("Fetching activity events for family member", {
      requestingUserId: normalizedRequestingUserId,
      familyId: normalizedFamilyId,
      memberId: normalizedMemberId,
      startDate,
      endDate,
    });

    // Step 4: Retrieve events using existing repository method (ObjectId parameter)
    const events = await this.activityEventRepository.findByUserInDateRange(
      memberObjectId,
      startDate,
      endDate,
    );

    logger.debug("Family member activity events fetched successfully", {
      requestingUserId: normalizedRequestingUserId,
      familyId: normalizedFamilyId,
      memberId: normalizedMemberId,
      count: events.length,
    });

    return events;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    logger.error("Failed to fetch family member activity events", {
      requestingUserId: normalizedRequestingUserId ?? requestingUserId,
      familyId: normalizedFamilyId ?? familyId,
      memberId: normalizedMemberId ?? memberId,
      error,
    });
    throw error;
  }
}
```

**Key Implementation Details:**

- **Route → Service Boundary**: All parameters received as strings
- **Service Validation**: `validateObjectId()` converts strings to ObjectIdString format
- **Service Logic**: Family membership validation uses string parameters with FamilyMembershipRepository
- **Repository Boundary**: `toObjectId()` converts ObjectIdString to ObjectId only for database operations
- **Return Pattern**: Repository returns ActivityEvent[] with ObjectId fields → Service returns same → Route converts to DTOs

### 1.2 Repository Method Reuse

The existing `ActivityEventRepository.findByUserInDateRange()` method already supports the required functionality:

- User-scoped event retrieval using ObjectId parameter
- Date range filtering
- Sorting by createdAt descending
- 100-event limit

**No repository changes needed** - the existing method works perfectly with ObjectId parameters.

## Phase 2: Validation Layer Implementation

### 2.1 Create Family Member Events Validator

**File:** `apps/api/src/modules/activity-events/validators/get-family-member-events.validator.ts`

**Implementation:**

```typescript
import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

// Path parameters schema - validates string format before service layer
const pathParamsSchema = z.object({
  familyId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid familyId format"),
  memberId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid memberId format"),
});

// Query parameters schema (reuse existing date validation)
const queryParamsSchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
});

// Combined validation
const requestSchema = z.object({
  params: pathParamsSchema,
  query: queryParamsSchema,
});

type ValidatedRequest = Request & z.infer<typeof requestSchema>;

export function validateGetFamilyMemberEventsRequest(
  req: ValidatedRequest,
  _res: Response,
  next: NextFunction
): void {
  try {
    const validated = requestSchema.parse({
      params: req.params,
      query: req.query,
    });

    req.params = validated.params;
    req.query = validated.query;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw HttpError.badRequest(firstError.message);
    }
    throw error;
  }
}
```

**Validation Strategy:**

- **Route Layer**: Validates string format and structure (regex for ObjectId format)
- **Service Layer**: Performs actual ObjectId validation and normalization
- **No ObjectId conversion in validator** - strings pass through to service layer

## Phase 3: Route Implementation

### 3.1 Create Family Member Events Route

**File:** `apps/api/src/modules/activity-events/routes/get-family-member-events.route.ts`

**Implementation:**

```typescript
import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toActivityEventDTO } from "../lib/activity-event.mapper";
import { ActivityEventRepository } from "../repositories/activity-event.repository";
import { ActivityEventService } from "../services/activity-event.service";
import { validateGetFamilyMemberEventsRequest } from "../validators/get-family-member-events.validator";

/**
 * GET /families/{familyId}/members/{memberId}/activity-events -
 * List activity events for a specific family member
 *
 * Requires authentication and family membership
 *
 * Query parameters (optional):
 * - startDate: string (format: YYYY-MM-DD) - filter events from this date
 * - endDate: string (format: YYYY-MM-DD) - filter events until this date
 *
 * Response (200): Array of ActivityEventDTO
 * Response (400): Invalid parameters
 * Response (401): Authentication required
 * Response (403): Not authorized for this family
 * Response (404): Family or member not found
 */
export function getFamilyMemberEventsRoute(): Router {
  const router = Router();
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository
  );

  router.get(
    "/families/:familyId/members/:memberId/activity-events",
    authenticate,
    validateGetFamilyMemberEventsRequest,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        // Route layer: All parameters remain as strings
        const { familyId, memberId } = req.params;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        // Authorization: Ensure user is a member of the family
        // Both Parent and Child roles can view family member activities
        // requireFamilyRole works with string parameters
        await requireFamilyRole({
          userId: req.user.id, // string
          familyId, // string
          allowedRoles: ["Parent", "Child"],
          userFamilies: req.user.families,
        });

        // Service layer: Receives string parameters, handles ObjectId conversion internally
        const events = await activityEventService.getEventsForFamilyMember(
          req.user.id, // string
          familyId, // string
          memberId, // string
          startDate, // string | undefined
          endDate // string | undefined
        );

        // Convert ActivityEvent[] (with ObjectId) to ActivityEventDTO[] (with strings)
        res.status(200).json(events.map(toActivityEventDTO));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
```

**Route Layer Responsibilities:**

- **String Parameters**: familyId, memberId, startDate, endDate remain as strings
- **Authentication**: Uses existing middleware
- **Authorization**: Uses requireFamilyRole with string parameters
- **Service Call**: Passes string parameters to service layer
- **DTO Conversion**: Converts ActivityEvent[] (with ObjectId) to ActivityEventDTO[] (with strings)

### 3.2 Update Activity Events Router

**File:** `apps/api/src/modules/activity-events/routes/activity-events.router.ts`

**Changes Required:**

```typescript
import { Router } from "express";
import { listEventsRoute } from "./list-events.route";
import { getFamilyMemberEventsRoute } from "./get-family-member-events.route";

/**
 * Activity Events router
 * Handles all activity event-related endpoints
 */
export function activityEventsRouter(): Router {
  const router = Router();

  // GET /activity-events - List activity events for authenticated user (existing)
  router.use("/", listEventsRoute());

  // GET /families/:familyId/members/:memberId/activity-events - Family member activities (new)
  router.use("/", getFamilyMemberEventsRoute());

  return router;
}
```

## Phase 4: Integration with Family Module

### 4.1 Family Membership Repository Usage

The implementation uses the existing `FamilyMembershipRepository` with these key methods:

- `findByFamilyAndUser(familyId, userId)` - Verifies user membership in family using string parameters
- Returns `FamilyMembership | null` with ObjectId fields
- **No repository changes needed**

### 4.2 Authorization Pattern Integration

Uses existing `requireFamilyRole` utility:

- Supports both Parent and Child roles
- Works with string parameters (familyId, userId)
- Leverages pre-hydrated user families when available (`req.user.families`)
- Falls back to repository queries when needed
- Provides consistent error messages

## Phase 5: ObjectID Flow Summary

### Complete ObjectID Journey

```
Route Layer (strings)
    ↓
Validation (string format check)
    ↓
Authorization (requireFamilyRole with strings)
    ↓
Service Layer (validateObjectId → ObjectIdString)
    ↓
Family Membership Check (FamilyMembershipRepository with strings)
    ↓
Repository Boundary (toObjectId → ObjectId)
    ↓
Database Query (MongoDB with ObjectId)
    ↓
Repository Response (ActivityEvent[] with ObjectId)
    ↓
Service Layer (no conversion needed)
    ↓
Route Layer (toActivityEventDTO converts ObjectId → string)
    ↓
HTTP Response (ActivityEventDTO[] with strings)
```

### Boundary Responsibilities

**Route Boundary:**

- Receives HTTP parameters as strings
- Performs basic string format validation
- Calls service with string parameters
- Converts final DTOs for HTTP response

**Service Boundary:**

- Validates ObjectId format (`validateObjectId`)
- Performs business logic with strings
- Converts to ObjectId only for repository calls
- Handles errors and logging

**Repository Boundary:**

- Receives ObjectId parameters
- Performs database operations
- Returns entities with ObjectId fields
- No string conversion

## Phase 6: Testing Implementation

### 6.1 Unit Tests Structure

**File:** `apps/api/tests/unit/activity-events/activity-event.service.family-member.test.ts`

**Test Coverage:**

```typescript
describe("ActivityEventService - Family Member Events", () => {
  describe("getEventsForFamilyMember", () => {
    it("should retrieve events for family member when authorized", async () => {
      // Test successful retrieval with valid family membership
      // Verify string parameters flow correctly
      // Verify ObjectId conversion at repository boundary
    });

    it("should throw 403 when requesting user is not a family member", async () => {
      // Test authorization failure
      // Verify proper error handling
    });

    it("should throw 404 when family does not exist", async () => {
      // Test non-existent family
      // Verify family membership validation
    });

    it("should throw 404 when member is not in the family", async () => {
      // Test member not in family
      // Verify target member validation
    });

    it("should apply date range filtering correctly", async () => {
      // Test date filtering functionality
      // Verify string date parameters work correctly
    });

    it("should handle ObjectID validation correctly", async () => {
      // Test invalid ObjectId formats
      // Verify validateObjectId works as expected
    });
  });
});
```

### 6.2 Integration Tests

**File:** `apps/api/tests/e2e/activity-events/family-member-activity.e2e.test.ts`

**Test Scenarios:**

```typescript
describe("Family Member Activity Events API", () => {
  describe("GET /families/:familyId/members/:memberId/activity-events", () => {
    it("should return 200 with activity events for authorized family member", async () => {
      // Test successful family member activity retrieval
      // Verify complete string → ObjectId → string flow
    });

    it("should return 403 for cross-family access attempt", async () => {
      // Test unauthorized family access
      // Verify authorization middleware works correctly
    });

    it("should return 404 for non-existent family member", async () => {
      // Test family member validation
      // Verify proper family scoping
    });

    it("should apply date range filtering", async () => {
      // Test date filtering in real API
      // Verify string date parameters work end-to-end
    });

    it("should validate ObjectId format in request", async () => {
      // Test invalid ObjectId formats return 400
      // Verify validation middleware works
    });
  });
});
```

## Phase 7: Deployment Considerations

### 7.1 Database Migration

No database migrations required:

- Uses existing `activity_events` collection
- Leverages existing `family_memberships` collection
- Uses existing indexes
- No schema changes needed

### 7.2 API Integration

The new endpoint will be automatically available through the existing router integration:

- No breaking changes to existing APIs
- New endpoint follows established URL patterns
- Compatible with existing authentication middleware
- Maintains ObjectID termination pattern consistency

### 7.3 Performance Impact

Minimal performance impact:

- Reuses existing database queries
- Uses existing indexes
- No additional database writes
- Same 100-event limit as existing endpoint
- Family membership validation adds minimal overhead

## Implementation Checklist

### Core Implementation

- [ ] Add `getEventsForFamilyMember` method to `ActivityEventService`
- [ ] Create `get-family-member-events.validator.ts`
- [ ] Create `get-family-member-events.route.ts`
- [ ] Update `activity-events.router.ts` to register new route
- [ ] Import required dependencies (FamilyMembershipRepository, requireFamilyRole)

### ObjectID Pattern Compliance

- [ ] Ensure route layer works with strings only
- [ ] Verify service layer performs ObjectId validation and conversion
- [ ] Confirm repository boundary converts ObjectIdString to ObjectId
- [ ] Test complete string → ObjectId → string flow
- [ ] Validate DTO conversion works correctly

### Authorization Integration

- [ ] Integrate `requireFamilyRole` with Parent and Child role support
- [ ] Handle family membership validation errors appropriately
- [ ] Test cross-family access prevention
- [ ] Verify string parameter handling in authorization

### Validation and Error Handling

- [ ] Implement comprehensive request validation for familyId and memberId
- [ ] Reuse existing date validation patterns
- [ ] Add proper HTTP status codes for all error scenarios
- [ ] Follow existing error handling patterns
- [ ] Test ObjectId validation edge cases

### Testing

- [ ] Write unit tests for new service method
- [ ] Write integration tests for new API endpoint
- [ ] Test authorization scenarios with different family roles
- [ ] Verify backward compatibility with existing endpoint
- [ ] Test ObjectID termination pattern compliance

### Documentation

- [ ] Update API documentation with new endpoint
- [ ] Add request/response examples
- [ ] Document authorization requirements
- [ ] Explain ObjectID termination pattern usage

## Error Handling Reference

### HTTP Status Codes and Messages

```typescript
// 400 Bad Request
throw HttpError.badRequest("Invalid familyId format");
throw HttpError.badRequest("Invalid memberId format");
throw HttpError.badRequest("Date must be in YYYY-MM-DD format");

// 401 Unauthorized (existing middleware handles this)

// 403 Forbidden
throw HttpError.forbidden("You are not a member of this family");

// 404 Not Found
throw HttpError.notFound("Family not found");
throw HttpError.notFound("Family member not found");
```

### Authorization Flow

1. **Authentication middleware** validates JWT/session (existing)
2. **Validation middleware** validates string format (new)
3. **requireFamilyRole** validates family membership with strings (new integration)
4. **Service** validates ObjectId format and checks target member (new logic)
5. **Repository** queries events with ObjectId (existing method)

## ObjectID Pattern Compliance Summary

This implementation strictly follows the ObjectID termination pattern:

✅ **Route Layer**: Handles strings only, no ObjectId conversion
✅ **Service Layer**: Validates ObjectId format, converts to ObjectIdString, business logic with strings
✅ **Repository Boundary**: Converts ObjectIdString to ObjectId for database operations
✅ **Return Journey**: Repository returns ObjectId → Service passes through → Route converts to DTO strings
✅ **Error Handling**: Proper error propagation with context at each boundary

This ensures consistency with the existing codebase architecture and maintainability of the ObjectID handling pattern across all modules.
