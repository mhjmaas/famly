# Realtime Events Platform

Centralized Socket.IO infrastructure for real-time event broadcasts across all Famly modules.

## Overview

The realtime events platform provides a shared Socket.IO server and event emission infrastructure used by multiple modules:

- **Chat**: Message broadcasts, typing indicators, read receipts
- **Tasks**: Task creation, assignment, completion, deletion events
- **Karma**: Karma awarded and deducted events
- **Rewards**: Claim creation, approval, completion, cancellation events

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Client (socket.io-client)                  │
└────────────────────────────┬─────────────────────────────────┘
                             │ WebSocket/Polling
┌────────────────────────────▼─────────────────────────────────┐
│              @modules/realtime (Shared Infrastructure)        │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Socket.IO Server (socket-server.ts)                  │  │
│  │  - CORS configuration for localhost + HTTPS           │  │
│  │  - Connection lifecycle management                    │  │
│  │  - Server instance singleton                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Authentication Middleware (auth.middleware.ts)        │  │
│  │  - JWT token verification                              │  │
│  │  - Session token verification                          │  │
│  │  - Auto-join user:<userId> room                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Event Emitter (event-emitter.ts)                      │  │
│  │  - emitToUserRooms()  - Broadcast to specific users   │  │
│  │  - emitToRoom()       - Broadcast to named room        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Room Manager (room-manager.ts)                        │  │
│  │  - getUserRoomName()  - Get user:<userId> room name   │  │
│  │  - getChatRoomName()  - Get chat:<chatId> room name   │  │
│  │  - joinRoom()         - Join a room                    │  │
│  │  - leaveRoom()        - Leave a room                   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                             │
    ┌────────────────────────┼────────────────────────────┐
    │                        │                             │
┌───▼────────┐     ┌────────▼───────┐      ┌─────────────▼──────┐
│   @chat    │     │    @tasks      │      │ @karma / @rewards  │
│  handlers  │     │  event emitters│      │   event emitters   │
└────────────┘     └────────────────┘      └────────────────────┘
```

## Core Components

### 1. Socket Server (`server/socket-server.ts`)

Creates and manages the Socket.IO server instance.

```typescript
import { createSocketServer, getSocketIOServer, setSocketIOServer } from "@modules/realtime";

// Create server with authentication and connection handler
const io = createSocketServer(httpServer, authenticateSocket, connectionHandler);

// Later access the server instance
const io = getSocketIOServer();
```

**Features:**
- CORS configuration for multiple origins (localhost:3000, localhost:8443, etc.)
- Singleton pattern for server instance access
- Pluggable connection handlers per module

### 2. Authentication Middleware (`server/auth.middleware.ts`)

Authenticates Socket.IO connections using JWT or session tokens.

```typescript
import { authenticateSocket } from "@modules/realtime";

// Used during server creation
const io = createSocketServer(httpServer, authenticateSocket, connectionHandler);
```

**Authentication Flow:**
1. Extract token from `socket.handshake.auth.token`
2. Try JWT verification first (via `@lib/auth/verifyJWT`)
3. Fall back to session verification (via `@modules/auth/lib/verify-session`)
4. Store `userId` in `socket.data.userId`
5. Auto-join user to `user:<userId>` room
6. Reject connection if both fail

**Supported Token Types:**
- JWT tokens from `/auth/login`
- Better-auth session tokens

### 3. Event Emitter (`events/event-emitter.ts`)

Provides type-safe event emission functions.

```typescript
import { emitToUserRooms, emitToRoom } from "@modules/realtime";

// Broadcast to specific users
emitToUserRooms("task.created", [userId1, userId2], {
  taskId: "123",
  task: taskObject
});

// Broadcast to a named room
emitToRoom("chat:abc123", "message.new", {
  chatId: "abc123",
  message: messageObject
});
```

**Functions:**

- **`emitToUserRooms<T>(eventName, userIds, payload)`**
  - Broadcasts to `user:<userId>` rooms for each user
  - Used for personal notifications
  - Automatically handles multiple users

- **`emitToRoom<T>(roomName, eventName, payload)`**
  - Broadcasts to a single named room
  - Used for room-specific broadcasts (e.g., chat rooms)

### 4. Room Manager (`rooms/room-manager.ts`)

Utility functions for room naming and management.

```typescript
import { getUserRoomName, getChatRoomName, joinRoom, leaveRoom } from "@modules/realtime";

// Get standardized room names
const userRoom = getUserRoomName(userId);        // "user:123"
const chatRoom = getChatRoomName(chatId);        // "chat:abc"

// Room operations
joinRoom(socket, "chat:abc123");
leaveRoom(socket, "chat:abc123");
```

## Room Conventions

### Auto-Joined Rooms

**`user:<userId>`**
- Automatically joined on authentication
- Used for personal notifications:
  - Task assignments
  - Karma awards/deductions
  - Reward claim updates
  - Chat metadata changes (for user's chats)

### Manually Joined Rooms

**`chat:<chatId>`**
- Joined via `room:join` event
- Used for chat-specific broadcasts:
  - New messages
  - Typing indicators
  - Read receipts

## Event Emission Patterns

### Module Event Files

Each module creates its own event emission functions in `events/` directory:

**Example: `@modules/tasks/events/task-events.ts`**
```typescript
import { emitToUserRooms } from "@modules/realtime";
import type { Task } from "../domain/task";

export function emitTaskCreated(task: Task, assignedUserIds?: string[]): void {
  const targetUserIds = assignedUserIds || [];

  // Extract user IDs from task assignment
  if (task.assignment.type === "member") {
    targetUserIds.push(task.assignment.memberId.toString());
  }

  if (targetUserIds.length === 0) return;

  emitToUserRooms("task.created", targetUserIds, {
    taskId: task._id.toString(),
    familyId: task.familyId.toString(),
    task,
  });
}
```

### Event Naming Convention

Events use dot notation: `<entity>.<action>`

**Examples:**
- `task.created`
- `task.assigned`
- `task.completed`
- `task.deleted`
- `karma.awarded`
- `karma.deducted`
- `claim.created`
- `claim.completed`
- `claim.cancelled`
- `approval_task.created`

### Payload Structure

Event payloads should include:
1. **Entity ID** (taskId, claimId, etc.)
2. **Family ID** (for multi-family apps)
3. **User ID** (affected user)
4. **Full Entity** (complete object for client state updates)

```typescript
{
  taskId: string;
  familyId: string;
  userId: string;
  task: Task;
}
```

## Integration Guide

### For New Modules

To add real-time events to a new module:

1. **Create event emitter functions** in `your-module/events/your-events.ts`:

```typescript
import { emitToUserRooms } from "@modules/realtime";
import type { YourEntity } from "../domain/your-entity";

export interface YourEventPayloads {
  "entity.created": {
    entityId: string;
    familyId: string;
    userId: string;
    entity: YourEntity;
  };
}

export function emitEntityCreated(entity: YourEntity, userIds: string[]): void {
  const payload: YourEventPayloads["entity.created"] = {
    entityId: entity._id.toString(),
    familyId: entity.familyId.toString(),
    userId: entity.userId.toString(),
    entity,
  };

  emitToUserRooms("entity.created", userIds, payload);
}
```

2. **Call emit functions** from service layer:

```typescript
import { emitEntityCreated } from "../events/your-events";

export class YourService {
  async createEntity(input: CreateInput): Promise<YourEntity> {
    const entity = await this.repository.create(input);

    // Emit real-time event
    emitEntityCreated(entity, [input.userId]);

    return entity;
  }
}
```

3. **Write E2E tests** in `tests/e2e/your-module/realtime/`:

```typescript
import { connectSocketClient, waitForEvent, disconnectSocketClient } from "../../helpers/socket-client";

describe("E2E: Your Module - Realtime Events", () => {
  it("should broadcast entity.created event", async () => {
    const socket = await connectSocketClient(baseUrl, userToken);

    const eventPromise = waitForEvent<any>(socket, "entity.created", 5000);

    // Trigger event via REST API
    await request(baseUrl)
      .post("/v1/entities")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Test" });

    const event = await eventPromise;
    expect(event.entity.name).toBe("Test");

    await disconnectSocketClient(socket);
  });
});
```

## Testing

### E2E Tests

Realtime event tests are located in each module's `realtime/` subdirectory:

- `tests/e2e/tasks/realtime/task-events.e2e.test.ts`
- `tests/e2e/karma/realtime/karma-events.e2e.test.ts`
- `tests/e2e/rewards/realtime/reward-events.e2e.test.ts`
- `tests/e2e/chat/realtime/*` (multiple test files)

Run tests:
```bash
# All E2E tests
pnpm --filter api test:e2e

# Specific module
pnpm --filter api test:e2e -- --testPathPattern="tasks/realtime"
```

### Test Helpers

Use socket client helpers from `tests/e2e/helpers/socket-client.ts`:

```typescript
import {
  connectSocketClient,
  disconnectSocketClient,
  waitForEvent,
  emitWithAck,
} from "../../helpers/socket-client";

// Connect
const socket = await connectSocketClient(baseUrl, token);

// Wait for event
const event = await waitForEvent<EventPayload>(socket, "event.name", 5000);

// Emit with acknowledgment (for chat events)
const ack = await emitWithAck(socket, "room:join", { chatId });

// Disconnect
await disconnectSocketClient(socket);
```

## Client Usage

### Connection

```typescript
import io from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: {
    token: jwtOrSessionToken
  },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000
});

socket.on("connect", () => {
  console.log("Connected");
});
```

### Listening for Events

```typescript
// Task events
socket.on("task.created", (event) => {
  console.log("New task:", event.task.name);
});

socket.on("task.assigned", (event) => {
  console.log("Task assigned:", event.task._id);
});

socket.on("task.completed", (event) => {
  console.log("Task completed by:", event.completedBy);
});

// Karma events
socket.on("karma.awarded", (event) => {
  console.log("Karma awarded:", event.amount);
});

socket.on("karma.deducted", (event) => {
  console.log("Karma deducted:", event.amount);
});

// Reward events
socket.on("claim.created", (event) => {
  console.log("Claim created:", event.claimId);
});

socket.on("approval_task.created", (event) => {
  console.log("Approval needed:", event.taskId);
});

socket.on("claim.completed", (event) => {
  console.log("Claim completed:", event.claimId);
});
```

### Error Handling

```typescript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);

  if (reason === "io server disconnect") {
    // Server disconnected, reconnect manually
    socket.connect();
  }
});
```

## Performance Considerations

### Broadcasting Efficiency

- **Targeted broadcasts**: Events are only sent to affected users via `user:<userId>` rooms
- **No unnecessary broadcasts**: Empty user lists skip emission entirely
- **Single emit per event**: Multiple users handled in one `emitToUserRooms()` call

### Memory Usage

- **Ephemeral rooms**: Room membership is not persisted
- **Auto-cleanup**: Socket.IO automatically cleans up disconnected sockets
- **No message buffering**: Events are live broadcasts only (no queueing for offline users)

### Scalability

Current implementation uses in-memory Socket.IO server. For horizontal scaling:

1. **Add Redis Adapter**:
```typescript
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

2. **Sticky Sessions**: Ensure load balancer uses sticky sessions or shared state

## Debugging

### Enable Socket.IO Debug Logs

```bash
DEBUG=socket.io:* pnpm run dev
```

### Check Connected Sockets

```typescript
const io = getSocketIOServer();
const sockets = await io.fetchSockets();
console.log(`${sockets.length} sockets connected`);
```

### Verify User Rooms

```typescript
const io = getSocketIOServer();
const room = `user:${userId}`;
const socketsInRoom = await io.in(room).fetchSockets();
console.log(`${socketsInRoom.length} devices for user ${userId}`);
```

## Migration Notes

### From Chat-Only to Shared Infrastructure

The realtime platform was extracted from the chat module. Key changes:

1. **Socket.IO server creation** moved from `@modules/chat` to `@modules/realtime`
2. **Authentication middleware** centralized in `@modules/realtime`
3. **Event emission** now uses shared `emitToUserRooms()` and `emitToRoom()`
4. **Chat module** now imports from `@modules/realtime` for server access

### Backward Compatibility

The chat module maintains full backward compatibility:
- All chat events still work
- Event payloads unchanged
- Client code requires no changes
- E2E tests pass without modification
