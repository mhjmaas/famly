# Chat API Reference

## Overview

The Chat API provides endpoints for managing chats, messages, and real-time communication.

## REST Endpoints

### Chat Management

#### Create Chat
```
POST /v1/chats
```
Create a new chat (DM or group).

**Request Body:**
- `type`: "dm" | "group"
- `memberIds`: string[] (user IDs to add)
- `title`: string (optional, for groups)

**Response:** `ChatDTO`

#### List Chats
```
GET /v1/chats?cursor={cursor}&limit={limit}
```
List all user's chats with pagination.

**Query Parameters:**
- `cursor`: string (optional, pagination cursor)
- `limit`: number (optional, default 20, max 100)

**Response:** `{ chats: ChatDTO[], nextCursor?: string }`

#### Get Chat
```
GET /v1/chats/:chatId
```
Get a specific chat by ID.

**Response:** `ChatDTO`

### Membership Management

#### Add Members
```
POST /v1/chats/:chatId/members
```
Add members to a group chat (admin only).

**Request Body:**
- `userIds`: string[] (user IDs to add)

**Response:** `ChatDTO`

#### Remove Member
```
DELETE /v1/chats/:chatId/members/:userId
```
Remove a member from a group chat (admin only, or self-removal).

**Response:** 204 No Content

### Messages

#### List Messages
```
GET /v1/chats/:chatId/messages?before={messageId}&limit={limit}
```
List messages in a chat with pagination.

**Query Parameters:**
- `before`: string (optional, message ID for pagination)
- `limit`: number (optional, default 20, max 100)

**Response:** `{ messages: MessageDTO[], hasMore: boolean }`

#### Send Message
```
POST /v1/chats/:chatId/messages
```
Send a message to a chat with idempotency support.

**Request Body:**
- `body`: string (1-8000 chars)
- `clientId`: string (optional, for idempotency)

**Response:** `MessageDTO` (201 for new, 200 for existing)

#### Search Messages
```
GET /v1/chats/search/messages?q={query}&chatId={chatId}&cursor={cursor}&limit={limit}
```
Search messages across all user's chats.

**Query Parameters:**
- `q`: string (required, search query)
- `chatId`: string (optional, limit to specific chat)
- `cursor`: string (optional, pagination cursor)
- `limit`: number (optional, default 20, max 100)

**Response:** `{ messages: MessageDTO[], nextCursor?: string }`

### Read Status

#### Update Read Cursor
```
PUT /v1/chats/:chatId/read-cursor
```
Update read cursor for a chat (marks messages as read).

**Request Body:**
- `messageId`: string (message ID to mark as read)

**Response:** `MembershipDTO`

## Socket.IO Events

### Connection

```typescript
// Connect with authentication
const socket = io('http://localhost:4000', {
  auth: { token: 'your-jwt-or-session-token' }
});
```

### Client → Server Events

#### Room Management
- `room:join { chatId: string }` - Join chat room
- `room:leave { chatId: string }` - Leave chat room

#### Messages
- `message:send { chatId: string, clientId: string, body: string }` - Send message

#### Read Receipts
- `receipt:read { chatId: string, messageId: string }` - Mark message as read

#### Typing Indicators
- `typing:start { chatId: string }` - Start typing
- `typing:stop { chatId: string }` - Stop typing

#### Presence
- `presence:ping {}` - Keep-alive ping

### Server → Client Events

#### Messages
- `message:new { message: MessageDTO }` - New message broadcast
- `message:ack { clientId: string, serverId: string }` - Message creation confirmation

#### Read Receipts
- `receipt:update { chatId, messageId, userId, readAt }` - Read cursor updated

#### Typing Indicators
- `typing:update { chatId, userId, state: 'start'|'stop' }` - Typing status changed

#### Presence
- `presence:update { userId, status: 'online'|'offline' }` - User presence changed

#### Chat Updates
- `chat:update { chat: ChatDTO }` - Chat metadata changed (via REST)

## Data Models

### ChatDTO
```typescript
{
  _id: string;
  type: "dm" | "group";
  memberIds: string[];
  title?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### MessageDTO
```typescript
{
  _id: string;
  chatId: string;
  senderId: string;
  body: string;
  clientId?: string;
  deleted: boolean;
  createdAt: string;
}
```

### MembershipDTO
```typescript
{
  _id: string;
  chatId: string;
  userId: string;
  role: "admin" | "member";
  lastReadMessageId?: string;
  createdAt: string;
  updatedAt: string;
}
```

## Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (not authorized)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limits

- Message sending (Socket.IO): 10 messages per 10 seconds
- Presence updates: Throttled to 1 per 2 seconds per user
