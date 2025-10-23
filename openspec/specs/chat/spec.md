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

