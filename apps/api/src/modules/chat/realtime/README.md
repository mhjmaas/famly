# Socket.IO Realtime Messaging

This module provides Socket.IO integration for real-time chat functionality in Famly.

## Architecture Overview

The realtime messaging system uses Socket.IO 4.8+ with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (socket.io-client)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ WebSocket/Polling
┌────────────────────────────▼────────────────────────────────────┐
│                    Socket.IO Server (4.8+)                       │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Authentication Middleware (JWT/Session)                 │  │
│  │  - Extract token from socket.handshake.auth.token        │  │
│  │  - Verify JWT or session token                           │  │
│  │  - Store userId on socket.data                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Event Handlers (registered on connection)                │  │
│  │  - room:join/leave - Room management                     │  │
│  │  - message:send - Send message (idempotent)              │  │
│  │  - receipt:read - Update read cursor                     │  │
│  │  - typing:start/stop - Typing indicators                 │  │
│  │  - presence:ping - Keep-alive                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Socket.IO Rooms                                          │  │
│  │  - user:<userId> - Personal notifications                │  │
│  │  - chat:<chatId> - Chat-specific broadcasts              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Support Services                                         │  │
│  │  - RateLimiter - Sliding window message rate limiting    │  │
│  │  - PresenceTracker - Online/offline status               │  │
│  │  - Chat Events - REST-triggered Socket.IO broadcasts     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    MongoDB (message/chat state)
```

## Setup

### Dependencies

Socket.IO is installed in `apps/api/package.json`:
```json
{
  "dependencies": {
    "socket.io": "^4.8.0"
  },
  "devDependencies": {
    "socket.io-client": "^4.8.0",
    "@types/socket.io": "^3.0.2",
    "@types/socket.io-client": "^3.0.0"
  }
}
```

### Server Initialization

In `apps/api/src/server.ts`:

```typescript
import { createSocketServer } from "./modules/chat/realtime/socket-server";

const app = express();
// ... Express setup ...

const server = http.createServer(app);
const io = createSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Event Contracts

### Client → Server Events

#### room:join (Acknowledgment)
Join a chat room to receive broadcasts.

**Payload:**
```typescript
{
  chatId: string // MongoDB ObjectId
}
```

**Success Response:**
```typescript
{
  ok: true
}
```

**Error Response:**
```typescript
{
  ok: false,
  error: "VALIDATION_ERROR" | "FORBIDDEN",
  message: string,
  correlationId: string
}
```

#### room:leave (Acknowledgment)
Leave a chat room. Idempotent - safe to call multiple times.

**Payload:**
```typescript
{
  chatId: string
}
```

**Success Response:**
```typescript
{
  ok: true
}
```

#### message:send (Acknowledgment)
Send a message to a chat room. Idempotent via clientId.

**Payload:**
```typescript
{
  chatId: string,           // Chat ID
  body: string,             // Message content (1-8000 chars)
  clientId: string          // Client-generated UUID for idempotency
}
```

**Success Response:**
```typescript
{
  ok: true,
  data: {
    clientId: string,       // Echo of client ID
    serverId: string        // MongoDB ObjectId of created message
  }
}
```

**Rate Limit Response:**
```typescript
{
  ok: false,
  error: "RATE_LIMITED",
  message: "Maximum 10 messages per 10 seconds",
  correlationId: string
}
```

#### typing:start (Fire-and-Forget)
Broadcast that user started typing. No acknowledgment expected.

**Payload:**
```typescript
{
  chatId: string
}
```

#### typing:stop (Fire-and-Forget)
Broadcast that user stopped typing. No acknowledgment expected.

**Payload:**
```typescript
{
  chatId: string
}
```

#### receipt:read (Acknowledgment)
Update read cursor to a specific message.

**Payload:**
```typescript
{
  chatId: string,           // Chat ID
  messageId: string         // Message ID to mark as read
}
```

**Success Response:**
```typescript
{
  ok: true,
  data: {
    readAt: string          // ISO timestamp of read update
  }
}
```

#### presence:ping (Acknowledgment)
Keep-alive ping to update last-seen timestamp.

**Payload:**
```typescript
{}
```

**Success Response:**
```typescript
{
  ok: true,
  data: {
    serverTime: string      // ISO timestamp from server
  }
}
```

### Server → Client Events (Broadcasts)

#### message:new
Broadcast when a new message is sent to a room.

**Payload:**
```typescript
{
  chatId: string,
  _id: string,              // Message MongoDB ObjectId
  body: string,
  senderId: string,         // User MongoDB ObjectId
  createdAt: string,        // ISO timestamp
  clientId?: string         // For client-side deduplication
}
```

#### typing:update
Broadcast when user starts/stops typing (excludes sender).

**Payload:**
```typescript
{
  chatId: string,
  userId: string,           // User MongoDB ObjectId
  state: "start" | "stop"
}
```

#### receipt:update
Broadcast when user marks messages as read.

**Payload:**
```typescript
{
  chatId: string,
  messageId: string,
  userId: string,           // User who marked as read
  readAt: string            // ISO timestamp
}
```

#### chat:update
Broadcast when chat metadata changes (member added/removed, title changed).

**Payload:**
```typescript
{
  chat: {
    _id: string,
    type: "dm" | "group",
    title: string | null,
    memberIds: string[],
    createdBy: string,
    createdAt: string,
    updatedAt: string
  }
}
```

#### presence:update
Broadcast when user comes online or goes offline (per contact/friend list).

**Payload:**
```typescript
{
  userId: string,
  status: "online" | "offline",
  timestamp: string
}
```

## Rooms

### auto-join: user:<userId>
Each authenticated socket automatically joins this room upon connection. Used for:
- Personal notifications (chat updates, presence changes)
- Targeted messages to specific users
- Real-time updates to user settings

### room:join: chat:<chatId>
Users explicitly join this room to receive chat-specific broadcasts:
- message:new events
- typing:update events
- receipt:update events

Users can join multiple chat rooms simultaneously.

## Authentication

### Token Sources
Socket.IO client can send token via:
1. `auth.token` in connection options
2. Query parameter (auto-converted to auth object)

### Token Types
- **JWT**: Standard JWT tokens from `/auth/login`
- **Session**: Better-auth session tokens

### Middleware
`authenticateSocket` middleware runs for each connection:
1. Extract token from `socket.handshake.auth.token` or query
2. Detect token type (JWT vs session)
3. Verify token using appropriate method
4. Store `userId` on `socket.data.userId`
5. Reject with error if authentication fails

## Rate Limiting

### Message Rate Limiting
- **Limit**: 10 messages per 10 seconds per user
- **Algorithm**: Sliding window
- **Response**: RATE_LIMITED error code with message

### Presence Broadcasting
- **Throttle**: Max 1 presence broadcast per user per 2 seconds
- **Purpose**: Reduce network traffic for frequent online/offline transitions
- **Applies to**: Online/offline status transitions only

## Idempotency

### Message Sending
Messages are idempotent via `clientId`:
- Client generates unique UUID for each message
- Server uses `clientId` to deduplicate
- Resending same message with same `clientId` returns existing message ID
- Only new messages trigger `message:new` broadcast

### Example Idempotent Flow
```typescript
const clientId = uuid();

// Send attempt 1
const ack1 = await socket.emitWithAck("message:send", {
  chatId, body: "Hello", clientId
});
// { ok: true, data: { clientId, serverId: "msg-123" } }

// Network timeout - retry with same clientId
const ack2 = await socket.emitWithAck("message:send", {
  chatId, body: "Hello", clientId
});
// { ok: true, data: { clientId, serverId: "msg-123" } } - same ID, no broadcast
```

## Error Handling

### Error Codes
- `VALIDATION_ERROR`: Invalid request format or missing required fields
- `FORBIDDEN`: User not authorized (not a chat member, etc.)
- `UNAUTHORIZED`: Authentication failed
- `RATE_LIMITED`: Rate limit exceeded
- `NOT_FOUND`: Resource not found
- `INTERNAL`: Server error

### Error Response Format
```typescript
{
  ok: false,
  error: string,           // Error code
  message: string,         // Human-readable message
  correlationId: string    // UUID for logging/support
}
```

### Correlation IDs
All errors include a `correlationId` UUID for server-side logging and debugging. Clients can include this in bug reports.

## Reconnection Strategy

### Automatic Reconnection
Socket.IO client automatically reconnects with:
- **Reconnection attempts**: 3 (configurable)
- **Reconnection delay**: 1000ms (configurable)
- **Backoff**: Exponential

### Manual Backfill
After reconnection, client should:
1. Re-join chat rooms via `room:join`
2. Fetch missed messages via REST API (`GET /v1/chats/:chatId/messages`)
3. Fetch updated read cursors via REST API

### Message Ordering
Messages are always broadcast with server timestamps (`createdAt`). Client should:
1. Store messages locally with server timestamp
2. Sort by `createdAt` ascending on display
3. Treat messages as immutable (sent via broadcast)

## Presence Tracking

### Multi-Device Support
- Each socket connection is tracked separately
- User is online if ANY device is connected
- User goes offline only when ALL devices disconnect

### Presence Throttling
- Online/offline broadcasts are throttled to 1 per 2 seconds per user
- Rapid connect/disconnect cycles only generate 1 broadcast

### Presence Ping
- Client should ping periodically to keep connection alive
- Server responds with server time (for clock sync)
- Ping updates `lastSeenAt` timestamp

### Presence Broadcast
- Only sent to user's contacts (implementation specific)
- Includes userId and status (online/offline)
- Throttled to prevent broadcast storms

## Typing Indicators

### Fire-and-Forget Pattern
- `typing:start` and `typing:stop` don't expect acknowledgment
- Server broadcasts to room members (excluding sender)
- No client-side deduplication needed
- Failed broadcasts are silent (don't error client)

### Non-Member Behavior
- Non-members emitting typing events are silently ignored
- No error returned to sender
- No broadcast to room

## Read Receipts

### Cursor Update Semantics
- Only updates if new message is newer than current cursor
- Prevents reverting to older messages
- Broadcast includes userId and ISO timestamp

### Membership Update
- Updates `membership.lastReadMessageId` in database
- Used for unread count calculation
- Persists across reconnections

## Client Usage Example

```typescript
import io from "socket.io-client";

// 1. Connect with authentication
const socket = io("http://localhost:3001", {
  auth: {
    token: jwtToken // or session token
  },
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 1000
});

// 2. Wait for connection
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

// 3. Join a chat room
socket.emit("room:join", { chatId }, (ack) => {
  if (ack.ok) {
    console.log("Joined room");
  } else {
    console.error("Failed:", ack.error, ack.message);
  }
});

// 4. Send a message
const clientId = crypto.randomUUID();
socket.emit("message:send", {
  chatId,
  body: "Hello, World!",
  clientId
}, (ack) => {
  if (ack.ok) {
    console.log("Message sent:", ack.data.serverId);
  }
});

// 5. Listen for message broadcasts
socket.on("message:new", (message) => {
  console.log(`${message.senderId}: ${message.body}`);
});

// 6. Send typing indicator
socket.emit("typing:start", { chatId });
setTimeout(() => {
  socket.emit("typing:stop", { chatId });
}, 3000);

// 7. Listen for typing indicators
socket.on("typing:update", (update) => {
  if (update.state === "start") {
    console.log(`${update.userId} is typing...`);
  } else {
    console.log(`${update.userId} stopped typing`);
  }
});

// 8. Mark message as read
socket.emit("receipt:read", {
  chatId,
  messageId: lastMessageId
}, (ack) => {
  if (ack.ok) {
    console.log("Read receipt sent");
  }
});

// 9. Presence ping (keep-alive)
setInterval(() => {
  socket.emit("presence:ping", {}, (ack) => {
    console.log("Last activity:", ack.data.serverTime);
  });
}, 30000);

// 10. Handle disconnection
socket.on("disconnect", () => {
  console.log("Disconnected");
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});
```

## Testing

E2E tests are located in `tests/e2e/chat/realtime/`:
- `room-join.e2e.test.ts` - Room management
- `message-send.e2e.test.ts` - Message sending and idempotency
- `typing.e2e.test.ts` - Typing indicators
- `read-receipt.e2e.test.ts` - Read receipts
- `presence.e2e.test.ts` - Presence tracking
- `chat-update.e2e.test.ts` - Chat metadata updates
- `reconnection.e2e.test.ts` - Reconnection and backfill
- `auth.e2e.test.ts` - Authentication
- `errors.e2e.test.ts` - Error handling

Unit tests are located in `tests/unit/chat/`:
- Handler tests: `*-handler.test.ts`
- Utility tests: `*-tracker.test.ts`, `rate-limiter.test.ts`

Run tests:
```bash
# Unit tests
pnpm -C apps/api run test:unit

# E2E tests
pnpm -C apps/api run test:e2e

# Specific test file
pnpm -C apps/api run test:e2e -- --testPathPattern="room-join"
```

## Performance Considerations

### Network Optimization
- Use `transports: ["websocket", "polling"]` for fallback support
- Typing indicators are fire-and-forget (no ack) for low latency
- Presence broadcasts are throttled to 1 per 2 seconds
- Message broadcasting includes both socket.io and REST backfill

### Memory Usage
- Rate limiter stores sliding window timestamps per user (max 10 per user)
- Presence tracker stores socket IDs per user
- Room membership is ephemeral (not persisted)

### Scalability
- Current implementation uses in-memory storage
- For horizontal scaling (multiple servers), consider:
  - Redis adapter for Socket.IO
  - Separate presence backend
  - Distributed rate limiter

## Debugging

### Enable Debug Logging
```bash
DEBUG=socket.io:* npm run dev
```

### Browser DevTools
```javascript
localStorage.debug = 'socket.io:*';
```

### Server Logs
- All event handlers log with Winston logger
- Error handlers include correlationId for tracing
- Authentication failures are logged with details

### Common Issues

**Connection timeout:**
- Check CORS configuration
- Verify token is valid
- Check network connectivity

**No broadcasts received:**
- Verify user is joined to room with `room:join`
- Check browser console for errors
- Verify other users are in same chat

**Rate limiting issues:**
- Check message count in last 10 seconds
- Each unique clientId counts as new message
- Rate limit resets after 10-second window

## Future Enhancements

1. **Presence Contacts**: Only broadcast presence to contacts/friends
2. **Message Reactions**: Real-time emoji reactions
3. **Typing Timeout**: Auto-stop typing after inactivity
4. **Notification Preferences**: Mute/unmute chat notifications
5. **Voice/Video**: WebRTC integration for calls
6. **Horizontal Scaling**: Redis adapter for multi-server deployments
7. **Offline Queue**: Store messages while disconnected
8. **Encryption**: End-to-end message encryption
