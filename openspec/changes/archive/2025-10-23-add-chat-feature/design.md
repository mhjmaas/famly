# Design: add-chat-feature

## Architecture Overview

The chat feature follows the established modular Express architecture pattern used throughout the API. It introduces a new `chat` module under `apps/api/src/modules/chat/` that encapsulates all chat-related functionality.

### Module Structure
```
modules/chat/
├── domain/
│   ├── chat.ts           # Chat entity and DTOs
│   ├── message.ts        # Message entity and DTOs
│   └── membership.ts     # Membership entity and DTOs
├── repositories/
│   ├── chat.repository.ts       # Chat data access
│   ├── message.repository.ts    # Message data access
│   └── membership.repository.ts # Membership data access
├── services/
│   ├── chat.service.ts          # Chat business logic
│   ├── message.service.ts       # Message business logic
│   └── membership.service.ts    # Membership business logic
├── validators/
│   ├── create-chat.validator.ts
│   ├── add-members.validator.ts
│   ├── create-message.validator.ts
│   └── update-read-cursor.validator.ts
├── lib/
│   ├── chat.mapper.ts           # DTO transformations
│   ├── message.mapper.ts
│   └── membership.mapper.ts
├── routes/
│   ├── chat.router.ts           # Main chat router
│   ├── list-chats.route.ts
│   ├── create-chat.route.ts
│   ├── get-chat.route.ts
│   ├── add-members.route.ts
│   ├── remove-member.route.ts
│   ├── list-messages.route.ts
│   ├── update-read-cursor.route.ts
│   ├── create-message.route.ts
│   └── search-messages.route.ts
└── index.ts                     # Module exports
```

## Data Model

### Chat Entity
```typescript
interface Chat {
  _id: ObjectId;
  type: 'dm' | 'group';
  title?: string;                // Required for groups, null for DMs
  createdBy: ObjectId;           // User who created the chat
  memberIds: ObjectId[];         // Current members (denormalized for quick access)
  createdAt: Date;
  updatedAt: Date;
}
```

**Design Decisions**:
- `type` field distinguishes DMs from groups for validation and UI purposes
- `title` is optional (only for groups) to keep DMs simple
- `memberIds` array denormalized for efficient membership checks without JOIN
- No soft-delete flag (chats are permanent; members can leave)

### Message Entity
```typescript
interface Message {
  _id: ObjectId;
  chatId: ObjectId;
  senderId: ObjectId;
  body: string;                  // Plain text + emoji, max 8KB
  clientId?: string;             // Client-supplied ID for idempotency
  createdAt: Date;
  editedAt?: Date;               // Timestamp of last edit (future enhancement)
  deleted: boolean;              // Soft-delete flag (future enhancement)
}
```

**Design Decisions**:
- `clientId` enables idempotency; compound unique index on (chatId, clientId) prevents duplicates
- `body` max length 8KB (~8000 characters) balances usability with storage efficiency
- `deleted` flag supports soft-delete pattern (set to true, keep in DB for history)
- `editedAt` prepared for future edit functionality
- Server-side timestamps (`createdAt`) are source of truth

### Membership Entity
```typescript
interface Membership {
  _id: ObjectId;
  chatId: ObjectId;
  userId: ObjectId;
  role: 'admin' | 'member';      // Admin for creators + group admins
  lastReadMessageId?: ObjectId;  // Cursor for unread tracking
  createdAt: Date;
  updatedAt: Date;
}
```

**Design Decisions**:
- Separate entity for membership allows independent role/read-state management
- `role` supports admin vs member distinction for group management
- `lastReadMessageId` tracks read position (null = no messages read)
- DM creators both get 'member' role initially; both become 'admin' after 2+ messages

## Database Indexes

### Chat Collection
```typescript
// Find chats by member (for listing user's chats)
{ "memberIds": 1, "updatedAt": -1 }

// Unique DM constraint (prevent duplicate DMs)
{ "type": 1, "memberIds": 1 }  // unique, sparse (only for type=dm)
```

### Message Collection
```typescript
// Pagination by chat (newest first)
{ "chatId": 1, "createdAt": -1 }

// Idempotency enforcement
{ "chatId": 1, "clientId": 1 }  // unique, sparse (only when clientId exists)

// Message search
{ "chatId": 1, "body": "text" }  // text index for search
```

### Membership Collection
```typescript
// Find memberships by user (for authorization)
{ "userId": 1, "chatId": 1 }  // compound index

// Find memberships by chat (for member management)
{ "chatId": 1, "userId": 1 }  // compound index

// Unique membership constraint
{ "chatId": 1, "userId": 1 }  // unique
```

## Business Logic Flows

### Create DM Chat
1. Validate: Exactly 2 members, both exist and distinct
2. Check: Does DM already exist between these users?
   - Query: `{ type: 'dm', memberIds: { $all: [userId1, userId2] } }`
   - If exists: Return existing chat
   - If not: Continue
3. Create chat document with type='dm', title=null
4. Create 2 membership documents with role='member'
5. Return chat DTO

**DM-to-Group Promotion**:
- On 2nd message creation, check message count
- If count reaches 2, update both memberships to role='admin'
- No changes to chat document (remains type='dm')

### Create Group Chat
1. Validate: Minimum 2 members (including creator), title optional
2. Create chat document with type='group', creator as member
3. Create membership for creator with role='admin'
4. Create memberships for other members with role='member'
5. Return chat DTO

### List Chats
1. Query memberships for authenticated user
2. Extract chatIds
3. Query chats by _id in chatIds, sort by updatedAt desc
4. For each chat, fetch last message (limit 1, sort by createdAt desc)
5. Count unread: messages with createdAt > lastReadMessageId
6. Apply cursor pagination if provided
7. Return chat list DTOs with last message preview and unread count

**Pagination**:
- Cursor = last chat's `_id` from previous page
- Query: `{ _id: { $lt: cursor }, ... }`
- Default limit=20, max=100

### List Messages
1. Validate membership for chat
2. Query messages by chatId, apply `before` cursor if provided
3. Sort by createdAt descending
4. Limit results (default=50, max=200)
5. Calculate `nextCursor` if more results exist
6. Return message DTOs

**Pagination**:
- Cursor = `before` parameter (messageId)
- Query: `{ chatId: X, _id: { $lt: before } }`
- Reverse chronological order (newest first)

### Create Message
1. Validate membership for chat
2. Validate body length (1-8000 chars)
3. Check idempotency: if clientId provided, check for existing message with (chatId, clientId)
   - If exists: Return existing message (idempotent)
   - If not: Continue
4. Create message document
5. Update chat's updatedAt timestamp
6. Check if DM promotion needed (message count = 2)
7. Return message DTO

### Update Read Cursor
1. Validate membership for chat
2. Validate messageId exists and belongs to chat
3. Update membership's lastReadMessageId if provided ID is newer
4. Return updated membership DTO

### Add Members (Groups Only)
1. Validate chat type = 'group'
2. Validate caller has 'admin' role
3. Validate new members exist and not already members
4. Create membership documents with role='member'
5. Update chat's memberIds array
6. Return updated chat DTO

### Remove Member (Groups Only)
1. Validate chat type = 'group'
2. Check authorization:
   - If removing self: Always allowed
   - If removing others: Caller must have 'admin' role
3. Delete membership document
4. Update chat's memberIds array
5. Return success

## Authorization Patterns

### Membership Verification Middleware
```typescript
// apps/api/src/modules/chat/middleware/verify-membership.ts
export const verifyMembership = async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const membership = await membershipRepository.findByUserAndChat(userId, chatId);
  if (!membership) {
    throw new HttpError(403, "You are not a member of this chat");
  }

  req.membership = membership;  // Attach to request for downstream use
  next();
};
```

### Admin Role Check Middleware
```typescript
// apps/api/src/modules/chat/middleware/require-admin.ts
export const requireAdmin = (req, res, next) => {
  if (req.membership.role !== 'admin') {
    throw new HttpError(403, "Admin role required for this operation");
  }
  next();
};
```

### Middleware Composition
```typescript
// Example: Add members route
router.post('/:chatId/members',
  authenticate,              // JWT validation
  verifyMembership,          // Check chat membership
  requireAdmin,              // Check admin role
  validateAddMembers,        // Zod validation
  addMembersHandler          // Route handler
);
```

## Error Handling

Following existing HttpError pattern:

```typescript
// Membership errors
throw new HttpError(403, "You are not a member of this chat");
throw new HttpError(403, "Admin role required for this operation");

// Validation errors
throw new HttpError(400, "Minimum 2 members required");
throw new HttpError(400, "Message body exceeds maximum length");

// Not found errors
throw new HttpError(404, "Chat not found");
throw new HttpError(404, "Message not found");

// Idempotency conflicts
// (Return existing entity with 200 OK, not error)
```

## Cursor Pagination Pattern

### Chat Pagination
```typescript
interface ListChatsQuery {
  cursor?: string;  // Chat _id
  limit?: number;   // Default 20, max 100
}

interface PaginatedChatsResponse {
  chats: ChatDTO[];
  nextCursor?: string;  // Present if more results exist
}
```

### Message Pagination
```typescript
interface ListMessagesQuery {
  before?: string;  // Message _id
  limit?: number;   // Default 50, max 200
}

interface PaginatedMessagesResponse {
  messages: MessageDTO[];
  nextCursor?: string;
}
```

## Testing Strategy

Following TDD principles from constitution.md:

### Unit Tests
- **Validators**: Test all validation rules (required fields, formats, lengths)
- **Mappers**: Test DTO transformations (ObjectId → string conversions)
- **Services**: Test business logic (DM deduplication, role promotion, idempotency)

### E2E Tests
- **Chat Creation**: DM creation, DM deduplication, group creation
- **Membership Management**: Add/remove members, role enforcement, self-leave
- **Messaging**: Message creation, idempotency, pagination, ordering
- **Read State**: Update read cursor, unread count calculation
- **Authorization**: Membership verification, admin role checks, isolation
- **Search**: Message search with query string, chat filtering

### Test Data Helpers
```typescript
// tests/e2e/helpers/chat-setup.ts
export async function createTestChat(type: 'dm' | 'group', memberIds: string[]) { }
export async function createTestMessage(chatId: string, senderId: string, body: string) { }
export async function setupChatScenario(config: ScenarioConfig) { }
```

## Migration Strategy

No migrations required (new feature, no existing data).

### Index Creation
Run during application startup:
```typescript
// apps/api/src/modules/chat/repositories/*.repository.ts
async ensureIndexes() {
  // Create indexes for each collection
}
```

Called from:
```typescript
// apps/api/src/server.ts
await chatRepository.ensureIndexes();
await messageRepository.ensureIndexes();
await membershipRepository.ensureIndexes();
```

## Rate Limiting (Future Enhancement)

Proposed rate limits (not implemented in MVP):
- Create chat: 5 per minute per user
- Create message: 10 per 3 seconds per user
- Search messages: 10 per 10 seconds per user

Implementation approach:
- Use express-rate-limit middleware
- Store limits in Redis (or in-memory for MVP)
- Apply per-route and per-user

## Open Design Questions

### Q1: Message editing vs immutability?
**Decision**: Support soft-delete flag and editedAt timestamp in domain model, but defer implementation. Keep messages immutable for MVP simplicity.

### Q2: How to handle chat archival?
**Decision**: Not in scope for MVP. Future enhancement could add `archived` flag to memberships (per-user) or `archivedAt` to chats (global).

### Q3: Should we support message reactions?
**Decision**: No, out of scope. Future enhancement would add separate `message_reactions` collection.

### Q4: Read receipts (vs read cursors)?
**Decision**: Use read cursors (simpler, no per-message tracking). Read receipts could be future enhancement.

## Performance Considerations

### Query Optimization
- Denormalize memberIds in chat document for O(1) membership checks
- Use compound indexes for efficient membership lookups
- Limit message queries with cursor pagination

### Write Optimization
- Batch membership creation during chat creation
- Single update for chat.updatedAt on message creation
- Sparse indexes for optional fields (clientId)

### Scaling Considerations
- Message volume could grow large; consider archival strategy post-MVP
- Read-heavy workload (chat lists, message history); consider caching
- Write contention on chat.updatedAt; acceptable for MVP scale

## Security Considerations

### Authorization
- All endpoints protected by JWT authentication
- Membership verification required for all chat operations
- Admin role required for management operations

### Input Validation
- Zod validators for all request payloads
- Max body length (8KB) prevents abuse
- memberIds uniqueness prevents duplicate memberships

### Data Privacy
- Users can only access chats they're members of
- Message search scoped to user's chats
- No global message search or user discovery

## Observability

### Logging
Follow existing Winston logger pattern:
```typescript
logger.info('Chat created', { chatId, type, memberCount });
logger.info('Message created', { chatId, messageId, senderId });
logger.error('Failed to create chat', { error, userId });
```

### Metrics (Future)
- Chat creation rate
- Message creation rate
- Average messages per chat
- Unread message distribution
