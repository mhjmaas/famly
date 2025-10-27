# Karma Reward System Module

## Overview

The karma module provides a family-based reward system that allows parents to grant karma points to family members for completing tasks or other achievements. Karma can be manually awarded by parents or automatically awarded when tasks are completed.

## Features

- **Manual Grants**: Parents can manually grant karma to family members with optional descriptions
- **Task Integration**: Automatic karma awards when tasks are completed (if karma is configured on the task)
- **Karma History**: Paginated history of all karma events for a user
- **Family Scoped**: All karma operations are isolated to specific families
- **Authorization**: Proper authorization checks ensure only parents can grant karma and only family members can view karma within their family

## API Endpoints

### Get Karma Balance
```
GET /v1/families/{familyId}/karma/balance/{userId}
```
Returns the current karma total for a user in the specified family.

**Authorization**: Authenticated family member

**Response (200)**:
```json
{
  "_id": "user_karma_id",
  "familyId": "family_id",
  "userId": "user_id",
  "totalKarma": 150,
  "createdAt": "2024-01-01T10:00:00Z",
  "updatedAt": "2024-01-05T15:30:00Z"
}
```

### Get Karma History
```
GET /v1/families/{familyId}/karma/history/{userId}?limit=50&cursor=optional_cursor
```
Returns paginated karma event history for a user.

**Query Parameters**:
- `limit` (optional): Number of events to return (default: 50, max: 100)
- `cursor` (optional): ObjectId string for cursor-based pagination

**Authorization**: Authenticated family member

**Response (200)**:
```json
{
  "events": [
    {
      "_id": "event_id",
      "familyId": "family_id",
      "userId": "user_id",
      "amount": 25,
      "source": "manual_grant",
      "description": "Great job helping with chores!",
      "metadata": {
        "grantedBy": "parent_user_id"
      },
      "createdAt": "2024-01-05T15:30:00Z"
    }
  ],
  "pagination": {
    "hasMore": true,
    "nextCursor": "next_event_id"
  }
}
```

### Grant Karma
```
POST /v1/families/{familyId}/karma/grant
```
Manually grants karma to a family member (parent-only operation).

**Authorization**: Authenticated parent user

**Request Body**:
```json
{
  "userId": "recipient_user_id",
  "amount": 25,
  "description": "Great job helping with chores!"
}
```

**Response (201)**:
```json
{
  "eventId": "event_id",
  "familyId": "family_id",
  "userId": "recipient_user_id",
  "amount": 25,
  "totalKarma": 150,
  "description": "Great job helping with chores!",
  "grantedBy": "parent_user_id",
  "createdAt": "2024-01-05T15:30:00Z"
}
```

**Validation**:
- `amount`: Required, integer between 1 and 1000
- `description`: Optional, max 500 characters
- `userId`: Required, must be valid ObjectId and family member

## Database Schema

### member_karma collection
```typescript
{
  _id: ObjectId;
  familyId: ObjectId;
  userId: ObjectId;
  totalKarma: number;
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes**:
- Unique compound index: `(familyId, userId)`

### karma_events collection
```typescript
{
  _id: ObjectId;
  familyId: ObjectId;
  userId: ObjectId;
  amount: number;
  source: 'task_completion' | 'manual_grant';
  description: string;
  metadata?: {
    taskId?: string;
    grantedBy?: string;
  };
  createdAt: Date;
}
```

**Indexes**:
- Compound index: `(familyId, userId, createdAt)` with descending createdAt
- Single index: `(createdAt)` descending for time-based queries

## Integration Points

### Task Completion
When a task is marked as complete and has karma metadata configured:
1. The task service calls `karmaService.awardKarma`
2. A karma event is created with source `'task_completion'`
3. The member's total karma is updated atomically
4. The event includes the task ID in metadata for traceability

```typescript
// Task domain includes optional metadata.karma
{
  // ... other fields
  metadata?: {
    karma?: number; // 1-1000
  };
}
```

## Architecture

### Service Layer (`KarmaService`)
- `awardKarma(input)`: Creates karma event and updates member total
- `getMemberKarma(familyId, userId, requestingUserId)`: Fetches member's total karma
- `getKarmaHistory(familyId, userId, requestingUserId, limit, cursor)`: Fetches paginated events
- `grantKarma(familyId, userId, amount, description, grantedBy)`: Parent-only manual grant

### Repository Layer (`KarmaRepository`)
- `findMemberKarma()`: Finds karma total record
- `upsertMemberKarma()`: Atomically increments karma total
- `createKarmaEvent()`: Creates new event
- `findKarmaEvents()`: Queries events with cursor-based pagination
- `countKarmaEvents()`: Returns event count

### Data Mapping
- `toMemberKarmaDTO()`: Converts domain model to API response
- `toKarmaEventDTO()`: Converts karma event to API response

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**:
   - Viewing karma: Requires family membership
   - Manual grants: Requires parent role in family
3. **Input Validation**: All inputs validated with Zod schemas
4. **Data Isolation**: Karma is strictly family-scoped using compound indexes
5. **No Self-Granting**: Service validates that granter is parent role

## Error Handling

| Status | Scenario | Example |
|--------|----------|---------|
| 400 | Validation error or invalid IDs | Invalid amount, malformed ObjectId |
| 401 | Missing or invalid authentication | No JWT token |
| 403 | Not family member or insufficient role | Non-member viewing karma, child granting karma |
| 404 | Not currently returned (graceful zero handling) | - |
| 500 | Server error | Database connection issue |

## Logging

All karma operations use structured Winston logging:
- `logger.info()`: Major operations (grant, award)
- `logger.debug()`: Fetch operations
- `logger.error()`: Failures with full error context

## Testing

- **Unit Tests**: Domain, repository, service, mapper, validator coverage
- **E2E Tests**: Full API workflow tests with authorization matrix
- **Integration Tests**: Task completion → karma award flow

## Performance

- Atomic operations: Karma totals updated with `$inc` operator
- Indexed queries: Compound indexes on `(familyId, userId)` for fast lookups
- Cursor pagination: Efficient history retrieval using ObjectId-based cursors
- No N+1 queries: Each operation is optimized for family scope
