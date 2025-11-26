# chat Specification

## Purpose
TBD - created by archiving change add-chat-feature. Update Purpose after archive.
## Requirements
### Requirement: Direct Message (DM) Creation
Users MUST be able to create direct message chats with exactly one other family member, with automatic deduplication.

#### Scenario: Create new DM between two users
- **GIVEN** an authenticated user (UserA) with valid JWT token
- **AND** another registered user (UserB) exists in the system
- **WHEN** UserA POSTs to `/v1/chats` with `{ type: "dm", memberIds: [userB_id] }`
- **THEN** the API responds with HTTP 201 and returns a chat object
- **AND** the chat has `type: "dm"`, `title: null`, both users in `memberIds`
- **AND** the chat is stored in the `chats` collection
- **AND** two membership records are created with `role: "member"`

#### Scenario: Return existing DM instead of creating duplicate
- **GIVEN** UserA and UserB already have a DM chat
- **WHEN** UserA POSTs to `/v1/chats` with `{ type: "dm", memberIds: [userB_id] }`
- **THEN** the API responds with HTTP 200 and returns the existing chat
- **AND** no new chat or membership records are created

#### Scenario: Reject DM with more than 2 total members
- **GIVEN** an authenticated user
- **WHEN** they POST to `/v1/chats` with `{ type: "dm", memberIds: [user2_id, user3_id] }`
- **THEN** the API responds with HTTP 400 and validation error "DM must have exactly 2 members"

#### Scenario: Reject DM with only creator (no other member)
- **GIVEN** an authenticated user
- **WHEN** they POST to `/v1/chats` with `{ type: "dm", memberIds: [] }`
- **THEN** the API responds with HTTP 400 and validation error "DM must have exactly 2 members"

#### Scenario: Reject DM with non-existent user
- **GIVEN** an authenticated user
- **WHEN** they POST with a memberIds array containing a non-existent userId
- **THEN** the API responds with HTTP 400 and validation error "Invalid user ID"

#### Scenario: Promote DM members to admin after 2 messages
- **GIVEN** a DM exists with 1 message sent by UserA
- **WHEN** UserB sends a second message to the chat
- **THEN** both UserA and UserB memberships are updated to `role: "admin"`

#### Scenario: Require authentication for DM creation
- **GIVEN** an unauthenticated request (no JWT token)
- **WHEN** attempting to POST to `/v1/chats`
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Group Chat Creation
Users MUST be able to create group chats with multiple members and an optional title.

#### Scenario: Create group chat with title and members
- **GIVEN** an authenticated user (UserA)
- **AND** multiple other registered users exist (UserB, UserC)
- **WHEN** UserA POSTs to `/v1/chats` with `{ type: "group", memberIds: [userB_id, userC_id], title: "Family Planning" }`
- **THEN** the API responds with HTTP 201 and returns the chat object
- **AND** the chat has `type: "group"`, `title: "Family Planning"`, and all users in `memberIds`
- **AND** UserA membership has `role: "admin"`
- **AND** UserB and UserC memberships have `role: "member"`

#### Scenario: Create group chat without title
- **GIVEN** an authenticated user
- **WHEN** they POST to `/v1/chats` with `{ type: "group", memberIds: [user2_id, user3_id] }`
- **THEN** the group is created with `title: null`

#### Scenario: Reject group with less than 2 total members
- **GIVEN** an authenticated user
- **WHEN** they POST to `/v1/chats` with `{ type: "group", memberIds: [] }`
- **THEN** the API responds with HTTP 400 and validation error "Minimum 2 members required"

#### Scenario: Reject group with duplicate member IDs
- **GIVEN** an authenticated user
- **WHEN** they POST with `memberIds: [user2_id, user2_id]`
- **THEN** the API responds with HTTP 400 and validation error "Member IDs must be unique"

#### Scenario: Require authentication for group creation
- **GIVEN** an unauthenticated request
- **WHEN** attempting to POST to `/v1/chats` with type="group"
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Chat Listing
Users MUST be able to list all chats they are members of, sorted by most recent activity, with pagination and last message preview.

#### Scenario: List all user's chats with last message preview
- **GIVEN** an authenticated user who is a member of multiple chats
- **AND** each chat has at least one message
- **WHEN** they GET `/v1/chats`
- **THEN** the API responds with HTTP 200 and an array of chat objects
- **AND** each chat includes `_id`, `type`, `title`, `memberIds`, `createdBy`, `createdAt`, `updatedAt`
- **AND** each chat includes a `lastMessage` object with `_id`, `senderId`, `body` (truncated to 100 chars), `createdAt`
- **AND** each chat includes an `unreadCount` number
- **AND** chats are sorted by `updatedAt` descending (most recent first)

#### Scenario: Empty chat list for user with no chats
- **GIVEN** an authenticated user who is not a member of any chats
- **WHEN** they GET `/v1/chats`
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: Paginate chat list with cursor and limit
- **GIVEN** an authenticated user with 50 chats
- **WHEN** they GET `/v1/chats?limit=20`
- **THEN** the response includes the first 20 chats and a `nextCursor` field
- **WHEN** they GET `/v1/chats?cursor={nextCursor}&limit=20`
- **THEN** the response includes the next 20 chats

#### Scenario: Reject invalid pagination limit
- **GIVEN** an authenticated user
- **WHEN** they GET `/v1/chats?limit=500`
- **THEN** the API responds with HTTP 400 and validation error "Limit must not exceed 100"

#### Scenario: Calculate unread count based on read cursor
- **GIVEN** a user with a chat membership where `lastReadMessageId` is set to message #5
- **AND** the chat has 10 total messages
- **WHEN** the user GET `/v1/chats`
- **THEN** the chat's `unreadCount` is 5 (messages #6-10)

#### Scenario: User only sees chats they are members of
- **GIVEN** UserA is a member of ChatX
- **AND** UserB is a member of ChatY
- **WHEN** UserA GET `/v1/chats`
- **THEN** the response includes ChatX but not ChatY

#### Scenario: Require authentication for listing
- **GIVEN** an unauthenticated request
- **WHEN** attempting to GET `/v1/chats`
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Individual Chat Retrieval
Users MUST be able to retrieve a specific chat by ID if they are a member.

#### Scenario: Get chat by ID
- **GIVEN** an authenticated user who is a member of a chat
- **WHEN** they GET `/v1/chats/{chatId}`
- **THEN** the API responds with HTTP 200 and the complete chat object
- **AND** the response includes all chat fields and a list of member details

#### Scenario: Chat not found
- **GIVEN** an authenticated user
- **WHEN** they GET a non-existent chat ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Cannot access chat without membership
- **GIVEN** UserA is not a member of ChatX
- **WHEN** UserA attempts to GET `/v1/chats/{chatX_id}`
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Require authentication for retrieval
- **GIVEN** an unauthenticated request
- **WHEN** attempting to GET `/v1/chats/{chatId}`
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Group Member Addition
Users with admin role MUST be able to add new members to group chats.

#### Scenario: Admin adds new member to group
- **GIVEN** UserA is an admin of a group chat
- **AND** UserC is a registered user not in the group
- **WHEN** UserA POSTs to `/v1/chats/{chatId}/members` with `{ userIds: [userC_id] }`
- **THEN** the API responds with HTTP 200 and updated chat object
- **AND** UserC membership is created with `role: "member"`
- **AND** the chat's `memberIds` array includes UserC

#### Scenario: Admin adds multiple members at once
- **GIVEN** UserA is an admin of a group chat
- **WHEN** UserA POSTs with `{ userIds: [user2_id, user3_id, user4_id] }`
- **THEN** all three memberships are created successfully

#### Scenario: Reject adding members to DM
- **GIVEN** UserA is a member of a DM chat
- **WHEN** UserA attempts to POST to `/v1/chats/{dm_chatId}/members`
- **THEN** the API responds with HTTP 400 and error "Cannot add members to DM"

#### Scenario: Non-admin cannot add members
- **GIVEN** UserB is a member (not admin) of a group chat
- **WHEN** UserB attempts to add a new member
- **THEN** the API responds with HTTP 403 and error "Admin role required"

#### Scenario: Reject adding already-existing member
- **GIVEN** UserA is an admin and UserB is already a member
- **WHEN** UserA attempts to add UserB again
- **THEN** the API responds with HTTP 400 and error "User is already a member"

#### Scenario: Reject adding non-existent user
- **GIVEN** UserA is an admin
- **WHEN** UserA attempts to add a non-existent userId
- **THEN** the API responds with HTTP 400 and validation error "Invalid user ID"

#### Scenario: Require membership to add members
- **GIVEN** UserA is not a member of ChatX
- **WHEN** UserA attempts to POST to `/v1/chats/{chatX_id}/members`
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Group Member Removal
Users MUST be able to remove themselves from group chats, and admins MUST be able to remove other members.

#### Scenario: User removes themselves from group
- **GIVEN** UserB is a member of a group chat
- **WHEN** UserB DELETEs `/v1/chats/{chatId}/members/{userB_id}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** UserB's membership is deleted
- **AND** UserB is removed from the chat's `memberIds` array

#### Scenario: Admin removes another member
- **GIVEN** UserA is an admin of a group chat
- **AND** UserC is a member of the group
- **WHEN** UserA DELETEs `/v1/chats/{chatId}/members/{userC_id}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** UserC's membership is deleted

#### Scenario: Non-admin cannot remove other members
- **GIVEN** UserB is a member (not admin) of a group chat
- **WHEN** UserB attempts to DELETE another member
- **THEN** the API responds with HTTP 403 and error "Admin role required"

#### Scenario: Reject removal from DM
- **GIVEN** UserA is a member of a DM chat
- **WHEN** UserA attempts to DELETE `/v1/chats/{dm_chatId}/members/{userA_id}`
- **THEN** the API responds with HTTP 400 and error "Cannot remove members from DM"

#### Scenario: Member not found in chat
- **GIVEN** UserA is an admin of ChatX
- **WHEN** UserA attempts to remove a userId not in ChatX
- **THEN** the API responds with HTTP 404 and error "Member not found"

### Requirement: Message Listing with Pagination
Users MUST be able to retrieve paginated message history for chats they are members of.

#### Scenario: List messages for a chat
- **GIVEN** an authenticated user who is a member of a chat
- **AND** the chat has multiple messages
- **WHEN** they GET `/v1/chats/{chatId}/messages`
- **THEN** the API responds with HTTP 200 and an array of message objects
- **AND** each message includes `_id`, `chatId`, `senderId`, `body`, `createdAt`, `editedAt`, `deleted`
- **AND** messages are sorted by `createdAt` descending (newest first)
- **AND** the default limit of 50 messages is applied

#### Scenario: Paginate messages with before cursor
- **GIVEN** a chat with 100 messages
- **WHEN** the user GET `/v1/chats/{chatId}/messages?limit=50`
- **THEN** the response includes the newest 50 messages and a `nextCursor`
- **WHEN** the user GET `/v1/chats/{chatId}/messages?before={nextCursor}&limit=50`
- **THEN** the response includes the next 50 older messages

#### Scenario: Reject invalid pagination limit
- **GIVEN** an authenticated user
- **WHEN** they GET `/v1/chats/{chatId}/messages?limit=500`
- **THEN** the API responds with HTTP 400 and validation error "Limit must not exceed 200"

#### Scenario: Empty message list for chat with no messages
- **GIVEN** a newly created chat with no messages
- **WHEN** a member GET `/v1/chats/{chatId}/messages`
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: Cannot list messages without membership
- **GIVEN** UserA is not a member of ChatX
- **WHEN** UserA attempts to GET `/v1/chats/{chatX_id}/messages`
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Require authentication for message listing
- **GIVEN** an unauthenticated request
- **WHEN** attempting to GET `/v1/chats/{chatId}/messages`
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Message Creation with Idempotency
Users MUST be able to post messages to chats they are members of, with idempotency support via client-supplied ID.

#### Scenario: Create message with client ID (idempotency)
- **GIVEN** an authenticated user who is a member of a chat
- **WHEN** they POST to `/v1/messages` with `{ chatId, clientId: "unique-123", body: "Hello family!" }`
- **THEN** the API responds with HTTP 201 and the created message object
- **AND** the message is stored with the provided `clientId`

#### Scenario: Idempotent message creation returns existing message
- **GIVEN** a message already exists with `chatId=X` and `clientId="unique-123"`
- **WHEN** the user POSTs again with the same `chatId` and `clientId`
- **THEN** the API responds with HTTP 200 and the existing message
- **AND** no new message is created

#### Scenario: Create message without client ID
- **GIVEN** an authenticated user who is a member of a chat
- **WHEN** they POST to `/v1/messages` with `{ chatId, body: "Hello!" }` (no clientId)
- **THEN** the message is created successfully with `clientId: null`

#### Scenario: Reject message exceeding max body length
- **GIVEN** an authenticated user
- **WHEN** they POST a message with body exceeding 8000 characters
- **THEN** the API responds with HTTP 400 and validation error "Message body exceeds maximum length"

#### Scenario: Reject empty message body
- **GIVEN** an authenticated user
- **WHEN** they POST with `body: ""`
- **THEN** the API responds with HTTP 400 and validation error "Message body is required"

#### Scenario: Cannot post to chat without membership
- **GIVEN** UserA is not a member of ChatX
- **WHEN** UserA attempts to POST a message to ChatX
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Update chat timestamp on message creation
- **GIVEN** a chat with `updatedAt: T1`
- **WHEN** a member posts a new message at time T2
- **THEN** the chat's `updatedAt` is updated to T2

#### Scenario: Require authentication for message creation
- **GIVEN** an unauthenticated request
- **WHEN** attempting to POST to `/v1/messages`
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Read Cursor Management
Users MUST be able to update their read position in a chat to track unread messages.

#### Scenario: Update read cursor to mark messages as read
- **GIVEN** an authenticated user who is a member of a chat
- **AND** the chat has messages with IDs msg1, msg2, msg3
- **WHEN** they POST to `/v1/chats/{chatId}/read-cursor` with `{ messageId: "msg2" }`
- **THEN** the API responds with HTTP 200
- **AND** the user's membership `lastReadMessageId` is updated to "msg2"

#### Scenario: Only update read cursor if new message is newer
- **GIVEN** a user's membership has `lastReadMessageId: msg5`
- **WHEN** they POST with `{ messageId: "msg3" }` (older message)
- **THEN** the `lastReadMessageId` remains "msg5" (not updated)

#### Scenario: Reject invalid message ID
- **GIVEN** an authenticated user
- **WHEN** they POST with a non-existent `messageId`
- **THEN** the API responds with HTTP 404 and error "Message not found"

#### Scenario: Reject message ID from different chat
- **GIVEN** a message that belongs to ChatY
- **WHEN** the user attempts to set it as read cursor for ChatX
- **THEN** the API responds with HTTP 400 and error "Message does not belong to this chat"

#### Scenario: Cannot update read cursor without membership
- **GIVEN** UserA is not a member of ChatX
- **WHEN** UserA attempts to POST to `/v1/chats/{chatX_id}/read-cursor`
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Require authentication for read cursor update
- **GIVEN** an unauthenticated request
- **WHEN** attempting to POST to `/v1/chats/{chatId}/read-cursor`
- **THEN** the API responds with HTTP 401 Unauthorized

### Requirement: Message Search
Users MUST be able to search messages across their chats using a text query with pagination.

#### Scenario: Search messages by text query
- **GIVEN** an authenticated user who is a member of multiple chats
- **AND** several messages contain the word "birthday"
- **WHEN** they GET `/v1/search/messages?q=birthday`
- **THEN** the API responds with HTTP 200 and an array of matching messages
- **AND** each message includes `_id`, `chatId`, `senderId`, `body`, `createdAt`
- **AND** messages are sorted by `createdAt` descending
- **AND** only messages from the user's chats are returned

#### Scenario: Search messages within specific chat
- **GIVEN** an authenticated user
- **WHEN** they GET `/v1/search/messages?q=birthday&chatId={chatId}`
- **THEN** only messages from the specified chat are searched and returned

#### Scenario: Paginate search results
- **GIVEN** a search query returns 100 results
- **WHEN** the user GET `/v1/search/messages?q=text&limit=20`
- **THEN** the response includes the first 20 results and a `nextCursor`
- **WHEN** they GET with `cursor={nextCursor}`
- **THEN** the next 20 results are returned

#### Scenario: Empty search results
- **GIVEN** an authenticated user
- **WHEN** they search for text that doesn't exist in any messages
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: Reject search without query parameter
- **GIVEN** an authenticated user
- **WHEN** they GET `/v1/search/messages` without a `q` parameter
- **THEN** the API responds with HTTP 400 and validation error "Search query is required"

#### Scenario: Reject invalid search limit
- **GIVEN** an authenticated user
- **WHEN** they GET `/v1/search/messages?q=text&limit=500`
- **THEN** the API responds with HTTP 400 and validation error "Limit must not exceed 100"

#### Scenario: Cannot search messages from non-member chats
- **GIVEN** UserA is a member of ChatX but not ChatY
- **AND** both chats contain messages with the word "dinner"
- **WHEN** UserA searches for "dinner"
- **THEN** only messages from ChatX are returned, not ChatY

#### Scenario: Require authentication for search
- **GIVEN** an unauthenticated request
- **WHEN** attempting to GET `/v1/search/messages`
- **THEN** the API responds with HTTP 401 Unauthorized

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

### Requirement: Cascade chat cleanup on family member removal
Removing a family member MUST clean up their chat participation to avoid orphaned chats or memberships.

#### Scenario: Remove member from all group chats
- **GIVEN** a family member participates in one or more group chats
- **WHEN** a parent calls `DELETE /v1/families/{familyId}/members/{memberId}`
- **THEN** the member's chat memberships are deleted for each group chat
- **AND** each chat's `memberIds` no longer includes the removed member
- **AND** the chats remain accessible to remaining members

#### Scenario: Delete DM when a participant is removed
- **GIVEN** a direct-message chat that includes the member being removed
- **WHEN** a parent calls `DELETE /v1/families/{familyId}/members/{memberId}`
- **THEN** the DM chat document is deleted
- **AND** all chat memberships for that DM are deleted
- **AND** all messages for that DM are deleted
- **AND** subsequent chat listings for both participants no longer include the deleted DM

### Requirement: AI Chat Type
The system SHALL support an `"ai"` chat type for conversations with an AI assistant.

#### Scenario: AI chat type is valid
- **GIVEN** a chat creation request
- **WHEN** the type is `"ai"`
- **THEN** the system accepts the chat type as valid
- **AND** the chat is created with type `"ai"`

#### Scenario: AI chat has single member
- **GIVEN** an AI chat is created
- **WHEN** the chat is stored
- **THEN** the `memberIds` array contains only the creating user's ID
- **AND** no other members can be added to an AI chat

#### Scenario: AI chat title from settings
- **GIVEN** a family has `aiSettings.aiName` set to "Jarvis"
- **WHEN** an AI chat is created or displayed
- **THEN** the chat title is "Jarvis"
- **AND** the title updates if `aiName` changes in settings

### Requirement: AI Chat Auto-Creation
The system SHALL automatically create an AI chat for a user when they access the chat feature with `aiIntegration` enabled.

#### Scenario: Auto-create AI chat on first access
- **GIVEN** a user belongs to a family with `aiIntegration` enabled
- **AND** the user has no existing AI chat
- **WHEN** the user fetches their chat list
- **THEN** an AI chat is automatically created for the user
- **AND** the AI chat appears in the response

#### Scenario: Return existing AI chat
- **GIVEN** a user already has an AI chat
- **WHEN** the user fetches their chat list
- **THEN** the existing AI chat is returned
- **AND** no duplicate AI chat is created

#### Scenario: No AI chat when feature disabled
- **GIVEN** a user belongs to a family with `aiIntegration` disabled
- **WHEN** the user fetches their chat list
- **THEN** no AI chat is included in the response
- **AND** no AI chat is auto-created

### Requirement: AI Chat Messages
Messages sent to an AI chat SHALL be stored and retrieved like regular chat messages.

#### Scenario: Send message to AI chat
- **GIVEN** a user has an AI chat
- **WHEN** the user sends a message to the AI chat
- **THEN** the message is stored in the database
- **AND** the message appears in the chat history
- **AND** no AI response is generated (placeholder for future integration)

#### Scenario: Retrieve AI chat messages
- **GIVEN** an AI chat has messages
- **WHEN** the user fetches messages for the AI chat
- **THEN** all messages are returned in chronological order
- **AND** the response format matches regular chat messages

### Requirement: AI Chat Isolation
Each user SHALL have their own private AI chat that is not shared with other family members.

#### Scenario: AI chat is user-specific
- **GIVEN** two users in the same family with `aiIntegration` enabled
- **WHEN** each user accesses the chat feature
- **THEN** each user has their own separate AI chat
- **AND** messages in one user's AI chat are not visible to the other user

#### Scenario: AI chat not visible in other users' chat lists
- **GIVEN** UserA has an AI chat with messages
- **WHEN** UserB fetches their chat list
- **THEN** UserA's AI chat does not appear in UserB's list

