# Design: Realtime Events Platform

## Context

Currently, the WebSocket infrastructure is embedded within the `chat` module (`apps/api/src/modules/chat/realtime/`). This module contains:
- Socket.IO server setup and authentication middleware
- User room pattern (`user:<userId>`) for targeted broadcasts
- Event handler registration pattern
- Presence tracking and rate limiting utilities

Multiple modules now need real-time capabilities:
- **Tasks**: Notify users when recurring tasks are generated, when tasks are assigned, or when tasks are completed
- **Karma**: Notify users when they receive karma (manual grants, task completion rewards, etc.)
- **Rewards**: Notify parents when a child claims a reward and an approval task is created

Future needs:
- **PWA Push Notifications**: Service workers need to send push notifications when app is backgrounded
- **Activity Feed**: Real-time updates to user activity streams
- **Family Presence**: Show which family members are online

## Goals

1. **Extract reusable infrastructure** from chat module without breaking existing chat functionality
2. **Standardize event emission pattern** across all modules (DRY principle)
3. **Maintain SOLID principles**: Single Responsibility (event emission vs business logic), Dependency Inversion (modules depend on abstractions)
4. **Keep implementation simple** (KISS): Avoid over-engineering with message queues, event sourcing, etc. until proven necessary
5. **Ensure PWA compatibility**: WebSocket design must coexist with service workers and push notifications

## Non-Goals

- Horizontal scaling with Redis adapter (defer until load requires it)
- Event persistence or replay (not needed for current use cases)
- Complex event routing or pub/sub patterns (simple room-based broadcasting suffices)
- Replacing REST APIs (WebSockets are for real-time updates only, not request/response)

## Architecture

### Layered Approach

```
┌─────────────────────────────────────────────────────────┐
│  Business Logic Layer (tasks, karma, rewards, etc.)     │
│  - Services call event emitters after mutations         │
└────────────────────┬────────────────────────────────────┘
                     │ depends on
┌────────────────────▼────────────────────────────────────┐
│  Event Emission Layer (module-specific event emitters)  │
│  - taskEvents.emit('task.created', payload)             │
│  - karmaEvents.emit('karma.awarded', payload)           │
└────────────────────┬────────────────────────────────────┘
                     │ depends on
┌────────────────────▼────────────────────────────────────┐
│  Realtime Infrastructure (shared Socket.IO server)      │
│  - getSocketIOServer() returns io instance              │
│  - Broadcasts to user rooms: user:<userId>              │
└─────────────────────────────────────────────────────────┘
```

### Module Structure

**New shared module**: `apps/api/src/modules/realtime/`
```
realtime/
├── server/
│   ├── socket-server.ts           # Socket.IO server creation
│   ├── auth.middleware.ts         # JWT/session authentication
│   └── connection-handler.ts      # Connection lifecycle
├── events/
│   └── event-emitter.ts           # Base event emitter interface
├── rooms/
│   └── room-manager.ts            # User room join/leave logic
└── types.ts                       # Shared types
```

**Refactored chat module**: `apps/api/src/modules/chat/realtime/`
```
realtime/
├── handlers/                      # Chat-specific handlers (unchanged)
├── events/
│   └── chat-events.ts             # Uses shared event emitter
└── register-handlers.ts           # Registers chat handlers
```

**New event emitters** in other modules:
- `apps/api/src/modules/tasks/events/task-events.ts`
- `apps/api/src/modules/karma/events/karma-events.ts`
- `apps/api/src/modules/rewards/events/reward-events.ts`

### Event Contract Design

Each module defines typed events:

```typescript
// tasks/events/task-events.ts
export interface TaskEventPayloads {
  'task.created': {
    taskId: string;
    familyId: string;
    assignedTo: string[];  // User IDs to notify
    task: TaskDTO;
  };
  'task.assigned': {
    taskId: string;
    assignedTo: string[];
    task: TaskDTO;
  };
  'task.completed': {
    taskId: string;
    completedBy: string;
    task: TaskDTO;
  };
  'task.deleted': {
    taskId: string;
    familyId: string;
    affectedUsers: string[];
  };
}

export function emitTaskEvent<K extends keyof TaskEventPayloads>(
  event: K,
  payload: TaskEventPayloads[K]
): void;
```

### User Room Pattern

All events broadcast to `user:<userId>` rooms:
- Users auto-join their personal room on connection
- Services emit events to specific user IDs
- Chat also uses `chat:<chatId>` rooms for chat-specific broadcasts (unchanged)

### Frontend Architecture

**Reusable hooks pattern**:

```
apps/web/src/lib/realtime/
├── use-realtime-connection.ts     # Manages Socket.IO connection
├── use-task-events.ts             # Subscribes to task.* events
├── use-karma-events.ts            # Subscribes to karma.* events
├── use-reward-events.ts           # Subscribes to reward.* events
└── types.ts                       # Event payload types
```

**Usage in components**:
```typescript
// In task list page
import { useAppDispatch } from '@/store/hooks';
import { fetchTasks } from '@/store/slices/tasks.slice';

const dispatch = useAppDispatch();
const familyId = useSelector(selectCurrentFamilyId);

useTaskEvents({
  onTaskCreated: () => {
    dispatch(fetchTasks(familyId));
  },
  onTaskAssigned: (event) => {
    dispatch(fetchTasks(familyId));
    toast.success('New task assigned', { description: event.task.name });
  },
  onTaskCompleted: () => {
    dispatch(fetchTasks(familyId));
  },
  onTaskDeleted: () => {
    dispatch(fetchTasks(familyId));
  },
});
```

**Hook implementation pattern**:
```typescript
// lib/realtime/use-task-events.ts
export function useTaskEvents(callbacks: TaskEventCallbacks) {
  const socket = useRealtimeConnection();
  const dispatch = useAppDispatch(); // Access Redux dispatch
  
  useEffect(() => {
    if (!socket) return;
    
    const handleTaskCreated = (event: TaskCreatedEvent) => {
      callbacks.onTaskCreated?.(event);
    };
    
    socket.on('task.created', handleTaskCreated);
    
    return () => {
      socket.off('task.created', handleTaskCreated);
    };
  }, [socket, callbacks]);
}
```

## Decisions

### Decision 1: Centralized vs Distributed Socket.IO Server

**Chosen**: Single centralized Socket.IO server instance managed by `realtime` module

**Alternatives considered**:
- Multiple Socket.IO servers per module (increases complexity, port conflicts)
- No shared infrastructure (extreme code duplication)

**Rationale**: 
- Follows DRY principle - authentication, room management, and connection handling are identical across modules
- Simplifies client connection (one WebSocket connection, not N)
- Easier to add global features (presence, rate limiting)

### Decision 2: Event Emitter Pattern

**Chosen**: Lightweight typed event emitters that wrap `io.to(room).emit()`

**Alternatives considered**:
- Event bus with publish/subscribe (over-engineering for current scale)
- Direct Socket.IO calls from services (violates SRP and DRY)
- Message queue like RabbitMQ (unnecessary complexity and operational overhead)

**Rationale**:
- Keeps services focused on business logic (SRP)
- Type-safe event contracts prevent runtime errors
- Easy to test (mock event emitter)
- Follows KISS principle

### Decision 3: When to Emit Events

**Chosen**: Emit events AFTER successful database mutations

**Alternatives considered**:
- Emit before mutation (risk of notifying about failed changes)
- Use database triggers (couples database schema to real-time logic)

**Rationale**:
- Guarantees event accuracy (only emit if mutation succeeded)
- Services control when events fire (clear code flow)
- Easy to add event emission to existing code paths

### Decision 4: Frontend State Management with Redux Integration

**Chosen**: Redux thunk dispatch pattern on WebSocket events

**Alternatives considered**:
- Direct state mutation in event handlers (bypasses Redux, breaks architecture)
- Complex event-driven state sync (over-engineering)
- Optimistic updates everywhere (complex rollback logic)

**Rationale**:
- **Redux store is single source of truth**: All data flows through existing Redux slices
- **Refetch pattern via thunks**: Events trigger `fetchTasks`, `fetchKarma`, `fetchRewards` thunks
- **Follows existing architecture**: Tasks, karma, and rewards already use Redux Toolkit with async thunks
- **100% test coverage requirement**: Event handlers dispatch actions, which are easily testable with mocked dispatch
- **KISS principle**: Simple dispatch calls, Redux handles the rest
- **Optimistic UI where it exists**: Rewards slice already has optimistic updates, we preserve that pattern

### Decision 5: PWA Push Notification Integration

**Chosen**: WebSocket for foreground, Service Worker for background

**Alternatives considered**:
- Only WebSockets (won't work when app is backgrounded)
- Only push notifications (requires server-side push infrastructure, worse latency)

**Rationale**:
- WebSocket provides instant updates when app is active
- Service Worker receives push notifications when app is backgrounded
- Both mechanisms share the same event payload types
- Allows graceful degradation if push notifications aren't granted

## Event Flow Examples

### Example 1: Recurring Task Generation

```
1. Cron job triggers TaskGeneratorService.generateTasksForDate()
2. Service creates tasks in database
3. For each created task:
   - Service calls emitTaskEvent('task.created', { assignedTo: [...], task })
4. Event emitter broadcasts to user:<userId> rooms for each assignedTo user
5. Frontend receives task.created event
6. useTaskEvents hook triggers refetch + shows toast notification
```

### Example 2: Manual Karma Grant

```
1. Parent grants karma via POST /v1/karma/grant
2. KarmaService.grantKarma() creates karma event in DB
3. Service calls emitKarmaEvent('karma.awarded', { userId, amount, ... })
4. Event emitter broadcasts to user:<userId> room
5. Frontend receives karma.awarded event
6. useKarmaEvents hook updates karma balance display
```

### Example 3: Reward Claim with Auto-Task

```
1. Child claims reward via POST /v1/rewards/:id/claim
2. ClaimService.createClaim() creates claim + auto-task for parents
3. Service calls:
   - emitRewardEvent('claim.created', { memberId, ... })
   - emitTaskEvent('task.created', { assignedTo: [parent], task })
4. Event emitters broadcast to respective user rooms
5. Child sees claim.created toast, parent sees task.created toast
```

## Risks & Trade-offs

### Risk 1: WebSocket Connection Limits

**Risk**: Too many concurrent connections could exhaust server resources

**Mitigation**: 
- Monitor connection counts and memory usage
- Implement connection limits per IP if needed
- Document horizontal scaling path with Redis adapter

### Risk 2: Event Ordering

**Risk**: Events may arrive out of order due to network conditions

**Mitigation**:
- Include timestamps in event payloads
- Frontend always refetches from server (server is source of truth)
- Optimistic UI only where we control the ordering client-side

### Risk 3: Missed Events During Disconnection

**Risk**: User misses events while disconnected

**Mitigation**:
- Refetch data on reconnection
- No persistent event replay needed (current state is in DB)
- Critical events (task assignments) can be shown on next page load

### Risk 4: Chat Module Refactoring

**Risk**: Extracting infrastructure could break existing chat functionality

**Mitigation**:
- Maintain 100% backward compatibility in chat event contracts
- Comprehensive E2E tests for chat before and after refactor
- Incremental migration (shared infrastructure first, then refactor chat)

## Migration Plan

### Phase 1: Create Shared Infrastructure (No Breaking Changes)

1. Create `realtime` module with Socket.IO server
2. Update `server.ts` to use new `createRealtimeServer()` function
3. Migrate chat to use shared `getSocketIOServer()`
4. Run all chat E2E tests to verify no regression

### Phase 2: Add Events to Modules (Additive)

5. Create event emitters in tasks, karma, rewards modules
6. Add event emission calls in service methods
7. Write unit tests for event emission

### Phase 3: Frontend Integration (Additive)

8. Create WebSocket client hooks
9. Add event subscriptions to task/karma/reward pages
10. Add toast notifications for key events
11. Write E2E tests for real-time updates

### Phase 4: Documentation & Cleanup

12. Update API documentation with event contracts
13. Create developer guide for adding new events
14. Add monitoring/logging for event emission

## PWA Compatibility Analysis

Based on Next.js PWA guide review:

**Service Worker Registration**: 
- Register service worker in `public/sw.js` with `registerServiceWorker()` in client components
- Service worker can handle `push` events when app is backgrounded

**WebSocket Behavior**:
- When app is foregrounded: WebSocket connection active, instant updates
- When app is backgrounded/closed: WebSocket disconnects, service worker takes over
- Push notification payload uses same event structure as WebSocket events

**Implementation Path**:
1. Current change adds WebSocket events (foreground)
2. Future change adds service worker + push subscription
3. Backend sends both WebSocket events AND push notifications
4. Client receives whichever is appropriate based on app state

**No Conflicts**: WebSocket and service workers are complementary, not competing technologies.

## Open Questions

1. **Rate Limiting**: Should we rate-limit event emissions per user? (Probably not needed initially, monitor first)
2. **Event Batching**: Should we batch rapid events (e.g., 5 tasks created at once)? (Defer until proven necessary)
3. **Reconnection Backfill**: Should we fetch missed events on reconnect? (Simple refetch on reconnect is sufficient)
4. **Event Logging**: Should we log all emitted events for debugging? (Yes, at debug level with structured logging)
