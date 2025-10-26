# Realtime Messaging Spec Deltas

## ADDED Requirements

### Requirement: Socket.IO Server Integration
The system SHALL integrate a Socket.IO server to enable bidirectional realtime communication between clients and the API.

#### Scenario: Socket.IO server attached to HTTP server
- **GIVEN** the Express app is running
- **WHEN** the server starts
- **THEN** a Socket.IO server is attached to the HTTP server instance
- **AND** Socket.IO listens on the same port as the Express app
- **AND** Socket.IO CORS is configured to accept connections from authorized origins

#### Scenario: Socket.IO namespaces configured
- **GIVEN** the Socket.IO server is initialized
- **WHEN** the server starts
- **THEN** the default namespace (`/`) is configured for chat operations
- **AND** connection middleware is registered for authentication

### Requirement: Realtime Connection Authentication
The system SHALL authenticate Socket.IO connections using the same authentication tokens (JWT or session) used by REST endpoints.

#### Scenario: Successful JWT authentication
- **GIVEN** a client initiates a Socket.IO connection with a valid JWT token in the auth payload
- **WHEN** the connection handshake occurs
- **THEN** the server verifies the JWT using the existing JWKS verification
- **AND** the userId is extracted from the JWT payload
- **AND** the userId is stored on the socket instance
- **AND** the socket is auto-joined to `user:<userId>` room
- **AND** the connection is accepted

#### Scenario: Successful session token authentication
- **GIVEN** a client initiates a Socket.IO connection with a valid session token
- **WHEN** the connection handshake occurs
- **THEN** the server validates the session via better-auth
- **AND** the userId is extracted from the session
- **AND** the userId is stored on the socket instance
- **AND** the socket is auto-joined to `user:<userId>` room
- **AND** the connection is accepted

#### Scenario: Reject connection with invalid token
- **GIVEN** a client initiates a connection with an invalid or expired token
- **WHEN** the connection handshake occurs
- **THEN** the connection is rejected with authentication error
- **AND** the client receives a connection error event

#### Scenario: Reject connection without token
- **GIVEN** a client initiates a connection without providing an auth token
- **WHEN** the connection handshake occurs
- **THEN** the connection is rejected with UNAUTHORIZED error

### Requirement: Chat Room Management
Users SHALL be able to join and leave chat rooms to receive realtime updates for specific conversations.

#### Scenario: Join chat room
- **GIVEN** an authenticated Socket.IO connection
- **AND** the user is a member of a chat
- **WHEN** the client emits `room:join { chatId: <chatId> }`
- **THEN** the server validates the user's membership
- **AND** the socket joins the `chat:<chatId>` room
- **AND** an acknowledgment `{ ok: true }` is sent to the client

#### Scenario: Reject room join for non-member
- **GIVEN** an authenticated Socket.IO connection
- **AND** the user is NOT a member of the specified chat
- **WHEN** the client emits `room:join { chatId: <chatId> }`
- **THEN** the server returns an error acknowledgment `{ ok: false; error: "FORBIDDEN"; message: "You are not a member of this chat" }`
- **AND** the socket does NOT join the room

#### Scenario: Leave chat room
- **GIVEN** an authenticated Socket.IO connection that has joined `chat:<chatId>`
- **WHEN** the client emits `room:leave { chatId: <chatId> }`
- **THEN** the socket leaves the `chat:<chatId>` room
- **AND** an acknowledgment `{ ok: true }` is sent to the client

#### Scenario: Validate chatId format
- **GIVEN** an authenticated Socket.IO connection
- **WHEN** the client emits `room:join` with an invalid chatId format
- **THEN** the server returns `{ ok: false; error: "VALIDATION_ERROR"; message: "Invalid chatId format" }`

### Requirement: Realtime Message Sending with Idempotency
Users SHALL be able to send messages via Socket.IO with idempotency guarantees using a client-supplied ID.

#### Scenario: Send new message via Socket.IO
- **GIVEN** an authenticated Socket.IO connection
- **AND** the user is a member of the chat
- **WHEN** the client emits `message:send { chatId, clientId: "uuid-123", body: "Hello" }`
- **THEN** the server validates membership and message body
- **AND** the server checks if a message with `(chatId, clientId)` already exists
- **AND** since it doesn't exist, a new message is created in the database
- **AND** the chat's `updatedAt` timestamp is updated
- **AND** a `message:new` event is broadcast to all members in `chat:<chatId>` room
- **AND** a `message:ack { clientId: "uuid-123", serverId: <messageId> }` is sent to the sender via acknowledgment
- **AND** the acknowledgment is `{ ok: true; data: { clientId: "uuid-123"; serverId: <messageId> } }`

#### Scenario: Idempotent message send returns existing message
- **GIVEN** a message with `chatId=X` and `clientId="uuid-123"` already exists
- **WHEN** the client emits `message:send { chatId: X, clientId: "uuid-123", body: "Hello" }`
- **THEN** the server finds the existing message
- **AND** NO new message is created
- **AND** NO `message:new` event is broadcast
- **AND** the server returns `{ ok: true; data: { clientId: "uuid-123"; serverId: <existingMessageId> } }`

#### Scenario: Reject message without clientId
- **GIVEN** an authenticated Socket.IO connection
- **WHEN** the client emits `message:send { chatId, body: "Hello" }` without a clientId
- **THEN** the server returns `{ ok: false; error: "VALIDATION_ERROR"; message: "clientId is required" }`

#### Scenario: Reject message exceeding max length
- **GIVEN** an authenticated Socket.IO connection
- **WHEN** the client emits `message:send` with a body exceeding 100,000 bytes (~100KB)
- **THEN** the server returns `{ ok: false; error: "VALIDATION_ERROR"; message: "Message body exceeds maximum size of 100KB" }`

#### Scenario: Reject message for non-member
- **GIVEN** an authenticated Socket.IO connection
- **AND** the user is NOT a member of the chat
- **WHEN** the client emits `message:send { chatId, clientId, body }`
- **THEN** the server returns `{ ok: false; error: "FORBIDDEN"; message: "You are not a member of this chat" }`

#### Scenario: Rate limit message sending
- **GIVEN** an authenticated Socket.IO connection
- **AND** the user has sent 10 messages in the last 10 seconds
- **WHEN** the client emits an 11th `message:send` within the same 10-second window
- **THEN** the server returns `{ ok: false; error: "RATE_LIMITED"; message: "Too many messages. Please slow down." }`

#### Scenario: Broadcast message:new to room members
- **GIVEN** UserA and UserB are both in `chat:<chatId>` room
- **WHEN** UserA emits `message:send` successfully
- **THEN** both UserA and UserB receive a `message:new { message: MessageDTO }` event
- **AND** the message includes server-authoritative `createdAt` timestamp
- **AND** the message shape matches the REST API MessageDTO format

### Requirement: Typing Indicators
Users SHALL see realtime typing indicators when other chat members are composing messages.

#### Scenario: Broadcast typing start
- **GIVEN** UserA and UserB are both in `chat:<chatId>` room
- **WHEN** UserA emits `typing:start { chatId }`
- **THEN** the server validates UserA's membership
- **AND** the server broadcasts `typing:update { chatId, userId: <userA_id>, state: "start" }` to `chat:<chatId>`
- **AND** UserB receives the `typing:update` event
- **AND** UserA does NOT receive their own typing event (excluded from broadcast)

#### Scenario: Broadcast typing stop
- **GIVEN** UserA previously emitted `typing:start`
- **WHEN** UserA emits `typing:stop { chatId }`
- **THEN** the server broadcasts `typing:update { chatId, userId: <userA_id>, state: "stop" }` to the room
- **AND** UserB receives the update

#### Scenario: Reject typing event for non-member
- **GIVEN** UserA is NOT a member of the chat
- **WHEN** UserA emits `typing:start { chatId }`
- **THEN** no broadcast occurs
- **AND** the event is silently ignored (no acknowledgment sent for performance)

### Requirement: Read Receipt Updates
Users SHALL receive realtime notifications when other members read messages.

#### Scenario: Update read cursor and broadcast receipt
- **GIVEN** UserA and UserB are both members of a chat
- **WHEN** UserA emits `receipt:read { chatId, messageId }`
- **THEN** the server validates membership and message existence
- **AND** the server updates UserA's membership `lastReadMessageId` (only if messageId is newer)
- **AND** the server broadcasts `receipt:update { chatId, messageId, userId: <userA_id>, readAt: <timestamp> }` to `chat:<chatId>`
- **AND** UserB receives the receipt update
- **AND** UserA receives acknowledgment `{ ok: true }`

#### Scenario: Do not update if messageId is older
- **GIVEN** UserA's `lastReadMessageId` is message #10
- **WHEN** UserA emits `receipt:read { chatId, messageId: #5 }`
- **THEN** the `lastReadMessageId` remains #10
- **AND** no `receipt:update` is broadcast

#### Scenario: Reject receipt for non-existent message
- **GIVEN** an authenticated connection
- **WHEN** the client emits `receipt:read { chatId, messageId: <invalid> }`
- **THEN** the server returns `{ ok: false; error: "NOT_FOUND"; message: "Message not found" }`

#### Scenario: Reject receipt for message in different chat
- **GIVEN** messageId belongs to ChatX
- **WHEN** the client emits `receipt:read { chatId: ChatY, messageId }`
- **THEN** the server returns `{ ok: false; error: "VALIDATION_ERROR"; message: "Message does not belong to this chat" }`

### Requirement: Presence Tracking
The system SHALL track and broadcast user online/offline presence with per-device granularity.

#### Scenario: Mark user online on connect
- **GIVEN** a user successfully authenticates a Socket.IO connection
- **WHEN** the connection is established
- **THEN** the userId is added to the in-memory presence map
- **AND** the socket is added to the user's device set
- **AND** a `presence:update { userId, status: "online" }` event is broadcast to the user's contacts (throttled)

#### Scenario: Mark user offline on disconnect
- **GIVEN** a user has an active Socket.IO connection
- **WHEN** the socket disconnects
- **THEN** the socketId is removed from the user's device set
- **AND** if the user has no remaining active sockets, a `presence:update { userId, status: "offline" }` event is broadcast to contacts

#### Scenario: Throttle presence updates
- **GIVEN** a user connects and disconnects rapidly (3 times in 1 second)
- **WHEN** these presence changes occur
- **THEN** presence broadcasts are throttled to a maximum of 1 update per 2 seconds per user
- **AND** only the final state is broadcast after the throttle window

#### Scenario: Handle presence ping
- **GIVEN** an authenticated Socket.IO connection
- **WHEN** the client emits `presence:ping {}`
- **THEN** the server updates the user's last-seen timestamp
- **AND** returns `{ ok: true; data: { serverTime: <ISO timestamp> } }`

### Requirement: Chat Metadata Updates via REST Integration
When chat metadata changes via REST endpoints (membership changes, title updates), those changes SHALL be broadcast to affected users via Socket.IO.

#### Scenario: Broadcast chat update on membership change
- **GIVEN** UserA is a member of a group chat
- **WHEN** an admin adds UserB via REST `POST /chats/:chatId/members`
- **THEN** the REST handler emits a `chat:update` event internally
- **AND** the Socket.IO server broadcasts `chat:update { chat: ChatDTO }` to all members in `user:<userId>` rooms
- **AND** UserA receives the updated chat object with the new member

#### Scenario: Broadcast chat update on title change
- **GIVEN** a group chat with title "Old Title"
- **WHEN** an admin updates the title via REST (future endpoint)
- **THEN** a `chat:update` event is broadcast to all members

### Requirement: Reconnection and Backfill Strategy
Clients SHALL backfill missed messages using REST endpoints after reconnecting to Socket.IO.

#### Scenario: Client reconnects and backfills
- **GIVEN** a client was disconnected and missed messages
- **WHEN** the client reconnects to Socket.IO
- **THEN** the client authenticates successfully
- **AND** the client queries REST `GET /chats/:chatId/messages?before=<lastKnownMessageId>`
- **AND** the client receives missed messages in the response
- **AND** the client emits `room:join { chatId }` to resume realtime updates
- **AND** subsequent messages arrive via `message:new` events

### Requirement: Error Handling and Acknowledgments
All Socket.IO request events SHALL return acknowledgments following a unified error shape.

#### Scenario: Successful acknowledgment
- **GIVEN** a client emits a valid event
- **WHEN** the server processes the event successfully
- **THEN** the acknowledgment is `{ ok: true }` or `{ ok: true; data: <payload> }`

#### Scenario: Error acknowledgment with correlation ID
- **GIVEN** a client emits an event that causes a server error
- **WHEN** the server encounters an internal error
- **THEN** the acknowledgment is `{ ok: false; error: "INTERNAL"; message: "An error occurred"; correlationId: <uuid> }`
- **AND** the correlationId is logged for tracing

#### Scenario: Standard error codes
- **GIVEN** various error conditions
- **THEN** errors use standard codes:
  - `UNAUTHORIZED` - Not authenticated
  - `FORBIDDEN` - Authenticated but not authorized
  - `VALIDATION_ERROR` - Invalid payload
  - `RATE_LIMITED` - Too many requests
  - `NOT_FOUND` - Resource doesn't exist
  - `INTERNAL` - Server error

### Requirement: Realtime Message Ordering
Clients SHALL render messages in chronological order using server-authoritative timestamps.

#### Scenario: Messages ordered by server timestamp
- **GIVEN** multiple messages arrive via `message:new` events
- **WHEN** the client receives these messages
- **THEN** the client sorts messages by `createdAt` (server timestamp) ascending
- **AND** ties are broken by `_id` (ObjectId) ascending
- **AND** client-side timestamps are NEVER used for ordering

### Requirement: Socket.IO Event Logging
All Socket.IO events SHALL be logged with appropriate detail for monitoring and debugging.

#### Scenario: Log connection events
- **GIVEN** a Socket.IO connection is established or terminated
- **WHEN** the event occurs
- **THEN** the server logs the event with level INFO
- **AND** the log includes userId, socketId, and connection status

#### Scenario: Log message events
- **GIVEN** a message is sent via Socket.IO
- **WHEN** the `message:send` event is processed
- **THEN** the server logs with level INFO
- **AND** the log includes chatId, userId, messageId, and isIdempotent flag

#### Scenario: Log errors
- **GIVEN** an error occurs during event processing
- **WHEN** the error is caught
- **THEN** the server logs with level ERROR
- **AND** the log includes error message, stack trace, userId, and correlationId
