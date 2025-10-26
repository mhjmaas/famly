# Socket.IO Event Reference

Quick reference for all realtime messaging events.

## Client → Server Events

### Connection & Rooms

| Event | Payload | Ack | Description |
|-------|---------|-----|-------------|
| `connect` | `{ auth: { token: string } }` | Connection success/error | Authenticate with JWT or session token |
| `room:join` | `{ chatId: string }` | `{ ok: true }` or error | Join chat room to receive messages |
| `room:leave` | `{ chatId: string }` | `{ ok: true }` or error | Leave chat room |

### Messaging

| Event | Payload | Ack | Description |
|-------|---------|-----|-------------|
| `message:send` | `{ chatId: string, clientId: string, body: string }` | `{ ok: true, data: { clientId, serverId } }` or error | Send message with idempotency |

### Read Receipts

| Event | Payload | Ack | Description |
|-------|---------|-----|-------------|
| `receipt:read` | `{ chatId: string, messageId: string }` | `{ ok: true }` or error | Update read cursor, broadcast to room |

### Typing Indicators

| Event | Payload | Ack | Description |
|-------|---------|-----|-------------|
| `typing:start` | `{ chatId: string }` | None | Broadcast typing start to room |
| `typing:stop` | `{ chatId: string }` | None | Broadcast typing stop to room |

### Presence

| Event | Payload | Ack | Description |
|-------|---------|-----|-------------|
| `presence:ping` | `{}` | `{ ok: true, data: { serverTime: string } }` | Keep-alive ping |

## Server → Client Events

### Messaging

| Event | Payload | Room | Description |
|-------|---------|------|-------------|
| `message:new` | `{ message: MessageDTO }` | `chat:<chatId>` | New message broadcast |
| `message:ack` | `{ clientId: string, serverId: string }` | Direct (via ack) | Message creation confirmation |

### Read Receipts

| Event | Payload | Room | Description |
|-------|---------|------|-------------|
| `receipt:update` | `{ chatId: string, messageId: string, userId: string, readAt: string }` | `chat:<chatId>` | Read cursor updated |

### Typing Indicators

| Event | Payload | Room | Description |
|-------|---------|------|-------------|
| `typing:update` | `{ chatId: string, userId: string, state: 'start'\|'stop' }` | `chat:<chatId>` | Typing status changed |

### Presence

| Event | Payload | Room | Description |
|-------|---------|------|-------------|
| `presence:update` | `{ userId: string, status: 'online'\|'offline' }` | `user:<contactId>` | User presence changed |

### Chat Updates

| Event | Payload | Room | Description |
|-------|---------|------|-------------|
| `chat:update` | `{ chat: ChatDTO }` | `user:<memberId>` | Chat metadata changed (via REST) |

## Error Codes

| Code | HTTP Equivalent | Description |
|------|-----------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized (e.g., not a member) |
| `VALIDATION_ERROR` | 400 | Invalid payload |
| `RATE_LIMITED` | 429 | Too many requests |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INTERNAL` | 500 | Server error |

## Acknowledgment Shape

All request events return acknowledgments in this format:

```typescript
type Ack<T> =
  | { ok: true; data: T }              // Success with data
  | { ok: true }                        // Success without data
  | { ok: false; error: string; message?: string; correlationId?: string } // Error

// Examples:
{ ok: true, data: { clientId: "abc", serverId: "507f..." } }
{ ok: true }
{ ok: false, error: "FORBIDDEN", message: "You are not a member of this chat" }
{ ok: false, error: "INTERNAL", message: "Server error", correlationId: "uuid-..." }
```

## Rate Limits

| Operation | Limit | Window | Action on Exceed |
|-----------|-------|--------|------------------|
| `message:send` | 10 messages | 10 seconds | Return `RATE_LIMITED` error ack |
| `presence:update` broadcasts | 1 update | 2 seconds per user | Throttle (queue final state) |

## Data Validation

### Message Body
- **Min length**: 1 character
- **Max length**: 100,000 bytes (~100KB)
- **Encoding**: UTF-8 (emoji supported)

### Client ID
- **Required**: Yes (for `message:send` idempotency)
- **Format**: Any string, recommend UUID v4
- **Uniqueness**: Per (chatId, clientId) pair

### Chat ID / Message ID
- **Format**: MongoDB ObjectId (24 hex characters)
- **Validation**: Must match pattern `/^[a-f0-9]{24}$/`

## Connection Flow

```
1. Client connects with auth token
   ↓
2. Server validates token (JWT or session)
   ↓
3. Socket auto-joins user:<userId> room
   ↓
4. Connection succeeds
   ↓
5. Client emits room:join { chatId } for each active chat
   ↓
6. Socket joins chat:<chatId> rooms
   ↓
7. Client receives realtime events for joined rooms
```

## Reconnection Flow

```
1. Client detects disconnect
   ↓
2. Socket.IO auto-reconnects
   ↓
3. Client authenticates again
   ↓
4. Client backfills missed messages via REST:
   GET /chats/:chatId/messages?before=<lastKnownId>
   ↓
5. Client re-joins chat rooms via room:join events
   ↓
6. Realtime event stream resumes
```

## Message Ordering

**Client MUST sort messages by**:
1. `createdAt` (server timestamp) - ascending
2. `_id` (ObjectId) - ascending (tiebreaker)

**Never use client-side timestamps for ordering.**

## Rooms

### Auto-Joined (on connect)
- `user:<userId>` - Receives personal notifications (chat:update, presence:update from contacts)

### Manually Joined (via room:join)
- `chat:<chatId>` - Receives chat-specific events (message:new, typing:update, receipt:update)

## Sample Client Code

### Connect and Authenticate

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-or-session-token'
  }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

### Join Room and Listen for Messages

```typescript
// Join chat room
const ack = await socket.emitWithAck('room:join', { chatId: 'abc123...' });
if (!ack.ok) {
  console.error('Failed to join room:', ack.error);
}

// Listen for new messages
socket.on('message:new', ({ message }) => {
  console.log('New message:', message.body);
  // Add to local state and re-sort by createdAt
});
```

### Send Message with Idempotency

```typescript
import { v4 as uuidv4 } from 'uuid';

const clientId = uuidv4(); // Generate unique ID

const ack = await socket.emitWithAck('message:send', {
  chatId: 'abc123...',
  clientId,
  body: 'Hello, world!'
});

if (ack.ok) {
  console.log('Message sent:', ack.data.serverId);
  // Update optimistic message with server ID
} else {
  console.error('Failed to send:', ack.error, ack.message);
}
```

### Typing Indicators

```typescript
// User starts typing
socket.emit('typing:start', { chatId: 'abc123...' });

// Listen for others typing
socket.on('typing:update', ({ chatId, userId, state }) => {
  if (state === 'start') {
    console.log(`${userId} is typing...`);
  } else {
    console.log(`${userId} stopped typing`);
  }
});

// User stops typing (on blur, send, etc.)
socket.emit('typing:stop', { chatId: 'abc123...' });
```

### Read Receipts

```typescript
// Mark message as read
const ack = await socket.emitWithAck('receipt:read', {
  chatId: 'abc123...',
  messageId: 'msg456...'
});

// Listen for read receipts from others
socket.on('receipt:update', ({ chatId, messageId, userId, readAt }) => {
  console.log(`${userId} read message ${messageId} at ${readAt}`);
});
```

### Presence

```typescript
// Listen for presence changes
socket.on('presence:update', ({ userId, status }) => {
  console.log(`${userId} is now ${status}`);
  // Update UI badge (green dot for online, gray for offline)
});

// Send periodic ping (optional, connection itself indicates presence)
setInterval(() => {
  socket.emitWithAck('presence:ping', {});
}, 30000); // Every 30 seconds
```

### Cleanup on Unmount

```typescript
// Leave room before navigating away
await socket.emitWithAck('room:leave', { chatId: 'abc123...' });

// Disconnect socket
socket.disconnect();
```
