# Realtime Messaging Design

## Context

The Famly chat system currently operates via REST endpoints. Users can create chats, send messages, update read cursors, and search messages—but they must poll for updates. This creates:

- **Latency**: Users don't see new messages until they poll (typically 3-10 second intervals)
- **Server load**: Constant polling creates unnecessary database queries even when nothing changes
- **Poor UX**: No typing indicators, no instant presence, no real-time feel

We're adding a Socket.IO layer to enable true bidirectional realtime communication while keeping the REST API as the source of truth for historical data.

## Goals / Non-Goals

### Goals
- Enable instant message delivery without polling
- Provide typing indicators and presence awareness
- Support idempotent message sending with acknowledgments
- Ensure security via authenticated connections
- Maintain simple reconnection strategy using existing REST backfill
- Provide comprehensive test coverage for Socket.IO event flows

### Non-Goals
- Guaranteed message delivery (at-most-once is acceptable; clients dedupe via clientId)
- Message editing or deletion via Socket.IO (use REST for mutations beyond creation)
- Complex offline queue or sync logic (keep it simple: reconnect → backfill via REST → rejoin)
- Real-time voice/video (out of scope)
- Push notifications (future capability)

## Decisions

### Architecture: Socket.IO Over Native WebSockets

**Decision**: Use Socket.IO library instead of native WebSockets.

**Rationale**:
- Automatic reconnection and fallback to long-polling
- Built-in room management (perfect for chat:<chatId> pattern)
- Event-based API matches our REST pattern
- Widely adopted, stable, well-documented
- Native support for acknowledgments (request/response pattern)

**Alternatives considered**:
- Native WebSockets: More control, but requires manual room management, reconnection logic, and fallback strategies
- Server-Sent Events (SSE): Simpler, but unidirectional (no client→server events)

### Connection Security: JWT & Session Token Auth

**Decision**: Authenticate Socket.IO connections using the same JWT and session tokens used by REST endpoints.

**Implementation**:
- Extract token from `auth` handshake payload or query string
- Verify using existing `verifyJWT()` for JWTs or `better-auth.api.getSession()` for session tokens
- Reject connection if authentication fails
- Store authenticated userId on socket for subsequent event authorization

**Rationale**:
- Reuses existing authentication infrastructure
- No new token format needed
- Consistent security model with REST API

### Room Management: Auto-Join User Rooms, Manual Chat Rooms

**Decision**:
- On connect, auto-join socket to `user:<userId>` room for per-user broadcasts (e.g., chat:update when membership changes)
- Client explicitly joins `chat:<chatId>` rooms via `room:join` event when opening a conversation
- Client explicitly leaves via `room:leave` when navigating away

**Rationale**:
- User room enables targeted broadcasts (new chat invites, membership updates)
- Explicit join/leave reduces server memory (don't hold references to every chat a user is in)
- Matches client navigation patterns (join on open, leave on close)

### Idempotency: (chatId, clientId) Unique Constraint

**Decision**: Require client to supply a unique `clientId` per message. Server enforces idempotency by checking `(chatId, clientId)` before creating new message document.

**Implementation**:
- Client generates UUIDs for `clientId` (e.g., `uuid.v4()`)
- On `message:send`, server queries `messages.findOne({ chatId, clientId })`
- If exists, return existing message with `message:ack { clientId, serverId }`
- If not, create message and broadcast `message:new` to `chat:<chatId>`

**Rationale**:
- Prevents duplicates during reconnects or network flakiness
- Matches existing REST pattern (same logic in `MessageService.createMessage`)
- Client controls deduplication key, enabling retry logic

### Message Ordering: Server Timestamp, Then ObjectId

**Decision**: Clients MUST sort messages by `createdAt` (server timestamp), with `_id` (ObjectId) as tiebreaker.

**Rationale**:
- Server timestamps are authoritative (don't trust client clocks)
- ObjectId provides natural ordering when timestamps collide
- Matches existing REST implementation

### Presence Tracking: Simple Per-Device Online/Offline

**Decision**: Track online status per socket (device). Users are "online" if they have at least one active socket. Broadcast `presence:update` on connect/disconnect with 2-second throttle to avoid flapping.

**Implementation**:
- Maintain in-memory map: `presenceMap: Map<userId, Set<socketId>>`
- On connect: add socket to user's set, emit `presence:update { userId, status: 'online' }` to user's contacts
- On disconnect: remove socket from set; if set is empty, emit `presence:update { userId, status: 'offline' }`
- Throttle presence broadcasts (max 1 every 2 seconds per user)

**Rationale**:
- Simple, stateless (ephemeral in-memory storage)
- Per-device granularity allows multi-device scenarios
- Throttling prevents broadcast storms on flaky connections

### Typing Indicators: Broadcast to Room, Exclude Sender

**Decision**: On `typing:start` and `typing:stop`, broadcast to `chat:<chatId>` room excluding sender.

**Implementation**:
- Client emits `typing:start { chatId }` when user starts typing
- Server validates membership, then broadcasts `typing:update { chatId, userId, state: 'start' }` to room (excluding sender)
- Client emits `typing:stop { chatId }` when user stops typing or sends message
- No server-side timeout (client controls state)

**Rationale**:
- Keeps server stateless (no typing timers)
- Client knows when user stops typing (blur, send, etc.)
- Room broadcast is efficient with Socket.IO

### Read Receipts: REST for Update, Socket.IO for Broadcast

**Decision**: Client updates read cursor via `receipt:read { chatId, messageId }` event. Server updates membership, then broadcasts `receipt:update { chatId, messageId, userId, readAt }` to room.

**Implementation**:
- On `receipt:read`, validate membership, update `lastReadMessageId` in membership document
- Broadcast `receipt:update` to `chat:<chatId>` so other members see "read by X" indicators

**Rationale**:
- Complements existing REST endpoint (`POST /chats/:chatId/read-cursor`)
- Realtime broadcast enables "seen by" UX without polling

### Reconnection Strategy: REST Backfill

**Decision**: On reconnect, client:
1. Fetches missed messages via REST `GET /chats/:chatId/messages?before=<lastKnownId>`
2. Re-joins room via `room:join { chatId }`
3. Resumes realtime event stream

**Rationale**:
- Simple: no complex sync or conflict resolution
- Leverages existing, tested REST pagination
- Socket.IO handles reconnection mechanics; we just re-subscribe

### Error Handling: Unified Ack Shape

**Decision**: All acknowledgments follow:
```typescript
type Ack<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; message?: string; correlationId?: string }
```

**Standard error codes**:
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Authenticated but not authorized (e.g., not a member)
- `VALIDATION_ERROR` - Invalid payload
- `RATE_LIMITED` - Too many requests
- `NOT_FOUND` - Resource doesn't exist
- `INTERNAL` - Server error

**Rationale**:
- Matches REST error envelope pattern
- Clients can handle errors uniformly
- Correlation IDs enable tracing

### Testing Strategy: Socket.IO Client in E2E Tests

**Decision**: Use `socket.io-client` in e2e tests to connect to the running test server and verify event flows.

**Implementation**:
- Import `socket.io-client` in test files
- Connect to `baseUrl` (same as REST tests: Testcontainers-backed server)
- Authenticate via `auth` handshake payload or query param
- Emit events and assert on acknowledgments and broadcast events
- Clean up connections in `afterEach`

**Example test structure**:
```typescript
it('should broadcast message:new to room members', async () => {
  const client1 = io(baseUrl, { auth: { token: user1.token } });
  const client2 = io(baseUrl, { auth: { token: user2.token } });

  await client1.emitWithAck('room:join', { chatId });
  await client2.emitWithAck('room:join', { chatId });

  const messagePromise = new Promise((resolve) => {
    client2.on('message:new', resolve);
  });

  await client1.emitWithAck('message:send', {
    chatId,
    clientId: 'msg-1',
    body: 'Hello'
  });

  const message = await messagePromise;
  expect(message.body).toBe('Hello');

  client1.disconnect();
  client2.disconnect();
});
```

**Rationale**:
- Matches existing e2e pattern (black-box testing against running server)
- No mocking—tests real WebSocket connections
- Validates full integration (auth, middleware, event handlers, broadcasts)

## Event Contracts

### Client → Server Events

#### `room:join`
- **Payload**: `{ chatId: string }`
- **Validation**:
  - chatId must be valid ObjectId
  - User must be a member of the chat
- **Action**: Join socket to `chat:<chatId>` room
- **Ack**: `{ ok: true }` or error

#### `room:leave`
- **Payload**: `{ chatId: string }`
- **Validation**: chatId must be valid ObjectId
- **Action**: Leave `chat:<chatId>` room
- **Ack**: `{ ok: true }` or error

#### `message:send`
- **Payload**: `{ chatId: string; clientId: string; body: string }`
- **Validation**:
  - chatId must be valid ObjectId
  - User must be a member
  - body must be 1-8000 chars
  - clientId must be provided (required for idempotency)
  - Rate limit: max 10 messages per 10 seconds per user
- **Action**:
  - Check idempotency: if `(chatId, clientId)` exists, return existing message
  - Otherwise, create message, update chat timestamp, check DM promotion
  - Emit `message:new` to `chat:<chatId>`
  - Ack sender with `message:ack { clientId, serverId }`
- **Ack**: `{ ok: true; data: { clientId: string; serverId: string } }` or error

#### `receipt:read`
- **Payload**: `{ chatId: string; messageId: string }`
- **Validation**:
  - chatId and messageId must be valid ObjectIds
  - User must be a member
  - messageId must belong to chatId
- **Action**:
  - Update user's membership `lastReadMessageId` (only if newer)
  - Emit `receipt:update` to `chat:<chatId>`
- **Ack**: `{ ok: true }` or error

#### `typing:start`
- **Payload**: `{ chatId: string }`
- **Validation**:
  - chatId must be valid ObjectId
  - User must be a member
- **Action**: Broadcast `typing:update { chatId, userId, state: 'start' }` to room (excluding sender)
- **Ack**: None (fire-and-forget for performance)

#### `typing:stop`
- **Payload**: `{ chatId: string }`
- **Validation**: Same as `typing:start`
- **Action**: Broadcast `typing:update { chatId, userId, state: 'stop' }` to room (excluding sender)
- **Ack**: None

#### `presence:ping`
- **Payload**: `{}`
- **Action**: Mark user as online (refresh last-seen)
- **Ack**: `{ ok: true; data: { serverTime: string } }`

### Server → Client Events

#### `message:new`
- **Payload**: `{ message: MessageDTO }`
- **Trigger**: Emitted to `chat:<chatId>` when any member sends a message via `message:send`
- **Usage**: Client appends to local message list and re-sorts by `createdAt`

#### `message:ack`
- **Payload**: `{ clientId: string; serverId: string }`
- **Trigger**: Sent to sender after `message:send` succeeds
- **Usage**: Client updates optimistic message with server ID

#### `receipt:update`
- **Payload**: `{ chatId: string; messageId: string; userId: string; readAt: string }`
- **Trigger**: Emitted to `chat:<chatId>` when member updates read cursor
- **Usage**: Client shows "read by X" indicators

#### `typing:update`
- **Payload**: `{ chatId: string; userId: string; state: 'start' | 'stop' }`
- **Trigger**: Emitted to `chat:<chatId>` when member starts/stops typing
- **Usage**: Client shows "User is typing..." indicator

#### `presence:update`
- **Payload**: `{ userId: string; status: 'online' | 'offline' }`
- **Trigger**: Emitted to `user:<contactId>` when user's presence changes (throttled)
- **Usage**: Client shows online/offline badge

#### `chat:update`
- **Payload**: `{ chat: ChatDTO }`
- **Trigger**: Emitted to `user:<userId>` when chat membership or metadata changes (triggered by REST mutations)
- **Usage**: Client updates chat list (new title, new members, etc.)

## Risks / Trade-offs

### Risk: Socket.IO Server Scaling
- **Issue**: Socket.IO connections are stateful and sticky to a single server instance. Scaling horizontally requires Redis adapter for pub/sub.
- **Mitigation**: For MVP, single-server deployment is acceptable. When scaling, add Redis adapter (well-documented Socket.IO pattern).

### Risk: Message Duplication
- **Issue**: Network retries could cause duplicate messages if clientId isn't enforced.
- **Mitigation**: Enforce clientId as required field for `message:send`. Server deduplicates via `(chatId, clientId)` lookup.

### Risk: Presence Flapping
- **Issue**: Rapid connect/disconnect cycles could spam presence updates.
- **Mitigation**: Throttle presence broadcasts (max 1 per 2 seconds per user). In-memory debounce logic.

### Trade-off: No Message Edit/Delete via Socket.IO
- **Decision**: Keep Socket.IO simple: creation and notifications only. Use REST for mutations.
- **Rationale**: Avoids complex conflict resolution, maintains REST as single source of truth for state changes.

## Migration Plan

This is a net-new feature with no migration required. Existing REST endpoints remain unchanged and continue to function independently. Clients can adopt Socket.IO incrementally.

**Rollout**:
1. Deploy API with Socket.IO support (feature flag not needed—harmless if unused)
2. Update web/mobile clients to connect and subscribe
3. Monitor WebSocket connection metrics (active connections, events/sec, error rates)

**Rollback**: Disable Socket.IO integration in server.ts, revert to REST-only polling.

## Open Questions

None—all requirements are specified in the proposal.
