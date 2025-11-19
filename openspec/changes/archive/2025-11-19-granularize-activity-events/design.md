# Design Document: Activity Event Detail Field

## Design Rationale

### Why Add `eventDetail`?

The current `ActivityEvent` model uses only a high-level `type` field. This is insufficient because:

1. **Different actions on the same type** - A TASK event can represent creation, completion, update, or deletion. Each requires different UI presentation.
2. **Conditional karma display** - Karma should only display for terminal/earning events (task completion, reward claim) not creation events.
3. **Future extensibility** - Distinguishing action granularity makes the system more maintainable as new event types or actions are added.

### Design Decisions

#### 1. Field Name and Type

**Decision**: Use `eventDetail: string` as an optional field

**Rationale**:
- `detail` is more concise but less explicit than `eventDetailType`
- String over enum allows forward compatibility (new details can be added without schema versioning)
- Optional ensures backward compatibility with existing events in the database

**Alternatives Considered**:
- Creating separate event types (TASK_CREATED, TASK_COMPLETED) - Would bloat the type enum and break existing type-based grouping
- Using a nested object like `action: { type: string }` - Adds complexity for minimal benefit

#### 2. Standardized Detail Values

**Decision**: Use consistent patterns across all event types

**Patterns**:
```
CREATED  - Entity was created
UPDATED  - Entity was modified
COMPLETED - Task/claim was completed
CLAIMED  - Reward was claimed
DELETED  - Entity was removed
GENERATED - Task auto-generated from schedule
```

**Rationale**:
- Consistent naming makes web app logic predictable
- Aligns with REST semantics (POST → CREATE, PATCH → UPDATE, DELETE → DELETE)

#### 3. Backward Compatibility

**Decision**: Make `eventDetail` optional, default display behavior to existing logic

**Implementation**:
- Web app checks `if (event.detail)` before using it
- Fallback to type-only logic if detail missing
- Existing events without detail still display (with original behavior)

**Rationale**:
- No migration required for historical data
- Graceful degradation
- Existing clients continue working

#### 4. Recording Responsibility

**Decision**: Event recording services specify detail when calling activity event recorder

**Flow**:
```
Task Service creates task
  ↓
Task Service calls ActivityEventService.recordEvent({
  userId, type: "TASK", detail: "CREATED", ...
})
  ↓
ActivityEventService persists with detail field
```

**Rationale**:
- Services understand their own actions best
- Centralized activity event service remains a simple recorder
- No magic or inference in activity layer

## Implementation Approach

### Phase 1: Domain Model & API
1. Extend ActivityEvent domain model with optional `eventDetail`
2. Update ActivityEventDTO with `eventDetail` field
3. Update ActivityEventService.recordEvent to accept `detail` parameter
4. Update all modules' event recording calls to specify detail

### Phase 2: Web App
1. Update activity utilities to handle type + detail combinations
2. Modify `getActivityEventIcon()` and `getActivityEventColor()` if needed
3. Update activity timeline template to conditionally render karma based on `type + detail`
4. Add helper function `shouldShowKarma(event)` with business logic

### Phase 3: Testing
1. Unit tests for activity event service with detail values
2. Unit tests for web app display logic
3. E2E tests for complete flow (create task → verify no karma display, complete task → verify karma display)

## Data Model Changes

### ActivityEvent (MongoDB)
```typescript
// Before
interface ActivityEvent {
  _id: ObjectId;
  userId: ObjectId;
  type: ActivityEventType;
  title: string;
  description?: string;
  metadata?: { karma?: number };
  createdAt: Date;
}

// After
interface ActivityEvent {
  _id: ObjectId;
  userId: ObjectId;
  type: ActivityEventType;
  detail?: string;           // NEW: optional, backward compatible
  title: string;
  description?: string;
  metadata?: { karma?: number };
  createdAt: Date;
}
```

### ActivityEventDTO (API Response)
```typescript
// Before
interface ActivityEventDTO {
  id: string;
  userId: string;
  type: ActivityEventType;
  title: string;
  description: string | null;
  metadata: { karma?: number } | null;
  createdAt: string;
}

// After
interface ActivityEventDTO {
  id: string;
  userId: string;
  type: ActivityEventType;
  detail?: string;            // NEW: optional
  title: string;
  description: string | null;
  metadata: { karma?: number } | null;
  createdAt: string;
}
```

## Event Detail Reference

### TASK Events
| Detail | Triggered By | Show Karma? |
|--------|---|---|
| CREATED | Manual task creation | ❌ No |
| GENERATED | Auto-generated from schedule | ❌ No |
| COMPLETED | Task marked complete | ✅ Yes (if karma > 0) |
| UPDATED | Task fields modified | ❌ No |
| DELETED | Task deleted | ❌ No |

### REWARD Events
| Detail | Triggered By | Show Karma? |
|--------|---|---|
| CLAIMED | Reward claim created | ✅ Yes (if karma < 0) |
| COMPLETED | Reward claim completed | ❌ No |
| CANCELLED | Reward claim cancelled | ❌ No |

### SHOPPING_LIST Events
| Detail | Triggered By | Show Karma? |
|--------|---|---|
| CREATED | Shopping list created | ❌ No |
| UPDATED | Shopping list modified | ❌ No |

### RECIPE Events
| Detail | Triggered By | Show Karma? |
|--------|---|---|
| CREATED | Recipe created | ❌ No |
| UPDATED | Recipe modified | ❌ No |

### DIARY Events
| Detail | Triggered By | Show Karma? |
|--------|---|---|
| CREATED | Diary entry created | ❌ No |

### FAMILY_DIARY Events
| Detail | Triggered By | Show Karma? |
|--------|---|---|
| CREATED | Family diary entry created | ❌ No |

### KARMA Events
| Detail | Triggered By | Show Karma? |
|--------|---|---|
| AWARDED | Manual karma grant | ✅ Yes |

## Considerations & Trade-offs

### Why Not Use Task State Machine?
Could use the realtime events (`task.completed`, `task.created`) to infer detail, but:
- Activity events should be independent of realtime event implementation
- Activity events may record actions not covered by realtime events
- Explicit detail is clearer and easier to debug

### Why Optional vs Required?
- **Simplicity**: No migration script needed
- **Backward compatibility**: Doesn't break existing code
- **Safety**: Graceful fallback if detail missing

### Why String vs Enum?
- **Flexibility**: Can add new details without schema breaking
- **Maintainability**: Less coordination between frontend/backend
- **Cost**: Validation should still verify against whitelist in tests
