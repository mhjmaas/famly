# Implementation Tasks: add-chat-feature

## Task Sequencing
Tasks are ordered to deliver incremental user-visible progress while maintaining testability. Related tasks can be parallelized where noted.

---

## Phase 1: Foundation (Domain & Data Access) ✅ COMPLETE

### Task 1.1: Create domain models for Chat, Message, and Membership ✅ COMPLETE
**Dependencies**: None
**Parallelizable**: Yes (with 1.2)

**Steps**:
1. Create `apps/api/src/modules/chat/domain/chat.ts`
   - Define `Chat` interface with ObjectId fields
   - Define `CreateChatInput`, `ChatDTO` interfaces
   - Add chat type enum ('dm' | 'group')
2. Create `apps/api/src/modules/chat/domain/message.ts`
   - Define `Message` interface with ObjectId fields
   - Define `CreateMessageInput`, `MessageDTO` interfaces
3. Create `apps/api/src/modules/chat/domain/membership.ts`
   - Define `Membership` interface with ObjectId fields
   - Define `MembershipDTO` interface
   - Add role enum ('admin' | 'member')

**Validation**:
- TypeScript compilation succeeds
- All interfaces follow existing codebase patterns (e.g., diary, family modules)

**User-Visible Progress**: None (infrastructure)

---

### Task 1.2: Implement Chat, Message, and Membership repositories ✅ COMPLETE
**Dependencies**: Task 1.1
**Parallelizable**: No (depends on domain models)

**Steps**:
1. Create `apps/api/src/modules/chat/repositories/chat.repository.ts`
   - Implement `create()`, `findById()`, `findByMemberIds()`, `updateMembers()`, `updateTimestamp()`
   - Add `ensureIndexes()` method for chat collection
   - Add index on `{ memberIds: 1, updatedAt: -1 }`
   - Add unique index on `{ type: 1, memberIds: 1 }` (sparse, for DMs)
2. Create `apps/api/src/modules/chat/repositories/message.repository.ts`
   - Implement `create()`, `findById()`, `findByChatId()`, `findByClientId()`, `search()`
   - Add `ensureIndexes()` for message collection
   - Add index on `{ chatId: 1, createdAt: -1 }`
   - Add unique sparse index on `{ chatId: 1, clientId: 1 }`
   - Add text index on `{ body: "text" }`
3. Create `apps/api/src/modules/chat/repositories/membership.repository.ts`
   - Implement `create()`, `createBulk()`, `findByUserAndChat()`, `findByChat()`, `findByUser()`, `updateReadCursor()`, `delete()`
   - Add `ensureIndexes()` for membership collection
   - Add unique index on `{ chatId: 1, userId: 1 }`
   - Add index on `{ userId: 1, chatId: 1 }`
4. Register index creation in `apps/api/src/server.ts`

**Validation**:
- Write unit tests for repository methods (mocked MongoDB operations)
- Verify index creation on application startup
- Test query patterns match expected behavior

**User-Visible Progress**: None (infrastructure)

---

### Task 1.3: Create mapper utilities for DTOs ✅ COMPLETE
**Dependencies**: Task 1.1
**Parallelizable**: Yes (with 1.2)

**Steps**:
1. Create `apps/api/src/modules/chat/lib/chat.mapper.ts`
   - Implement `toChatDTO()` to convert `Chat` entity to `ChatDTO`
   - Handle ObjectId → string conversions
2. Create `apps/api/src/modules/chat/lib/message.mapper.ts`
   - Implement `toMessageDTO()` to convert `Message` entity to `MessageDTO`
3. Create `apps/api/src/modules/chat/lib/membership.mapper.ts`
   - Implement `toMembershipDTO()` to convert `Membership` entity to `MembershipDTO`

**Validation**:
- Write unit tests for each mapper function
- Test edge cases (null values, missing optional fields)
- Verify ISO8601 date formatting

**User-Visible Progress**: None (infrastructure)

---

## Phase 2: Chat Creation & Management ✅ COMPLETE

### Task 2.1: Implement DM creation validator and service ✅ COMPLETE
**Dependencies**: Tasks 1.1, 1.2, 1.3
**Parallelizable**: No

**Steps**:
1. Create `apps/api/src/modules/chat/validators/create-chat.validator.ts`
   - Define Zod schema for `{ type, memberIds, title? }`
   - Validate type is 'dm' or 'group'
   - For DM: require exactly 2 total members (creator + 1)
   - For Group: require minimum 2 total members
   - Validate memberIds are unique ObjectIds
2. Create `apps/api/src/modules/chat/services/chat.service.ts`
   - Implement `createDM(creatorId, otherUserId)` method
   - Check for existing DM between users
   - Create chat with type='dm', title=null
   - Create memberships with role='member'
3. Write unit tests for validator
4. Write unit tests for chat service (mock repositories)

**Validation**:
- Unit tests pass for all validation rules
- Unit tests verify DM deduplication logic
- Service correctly creates chat and memberships

**User-Visible Progress**: None (logic only, no routes)

---

### Task 2.2: Implement DM creation route and E2E tests ✅ COMPLETE
**Dependencies**: Task 2.1
**Parallelizable**: No

**Steps**:
1. Create `apps/api/src/modules/chat/routes/create-chat.route.ts`
   - Implement POST handler with authenticate middleware
   - Validate request body with Zod validator
   - Call chat service to create DM
   - Return 201 with ChatDTO (or 200 for existing DM)
2. Create `apps/api/src/modules/chat/routes/chat.router.ts`
   - Register create-chat route
3. Register chat router in `apps/api/src/app.ts`
4. Create `apps/api/tests/e2e/chat/create-dm.e2e.test.ts`
   - Test: Create new DM between two users
   - Test: Return existing DM (deduplication)
   - Test: Reject DM with invalid member count
   - Test: Reject DM with non-existent user
   - Test: Require authentication
5. Run E2E tests with `pnpm -C apps/api run test:e2e`

**Validation**:
- E2E tests pass
- API returns correct status codes and response format
- DM deduplication works correctly

**User-Visible Progress**: ✅ Users can create DMs

---

### Task 2.3: Implement group creation service and route ✅ COMPLETE
**Dependencies**: Task 2.1
**Parallelizable**: Yes (with 2.2 after 2.1 complete)

**Steps**:
1. Update `apps/api/src/modules/chat/services/chat.service.ts`
   - Implement `createGroup(creatorId, memberIds, title?)` method
   - Create chat with type='group'
   - Create creator membership with role='admin'
   - Create other memberships with role='member'
2. Update `apps/api/src/modules/chat/routes/create-chat.route.ts`
   - Add logic to handle type='group' requests
3. Write unit tests for group creation service logic
4. Create `apps/api/tests/e2e/chat/create-group.e2e.test.ts`
   - Test: Create group with title and members
   - Test: Create group without title
   - Test: Reject group with < 2 members
   - Test: Reject group with duplicate member IDs
   - Test: Creator has admin role
   - Test: Other members have member role
5. Run E2E tests

**Validation**:
- E2E tests pass
- Group chat created with correct roles
- Title optional handling works

**User-Visible Progress**: ✅ Users can create group chats

---

### Task 2.4: Implement member addition to groups ✅ COMPLETE
**Dependencies**: Tasks 1.2, 1.3
**Parallelizable**: Yes (with 2.3)

**Steps**:
1. Create `apps/api/src/modules/chat/validators/add-members.validator.ts`
   - Define Zod schema for `{ userIds: string[] }`
   - Validate userIds array is non-empty and contains valid ObjectIds
2. Create `apps/api/src/modules/chat/services/membership.service.ts`
   - Implement `addMembers(chatId, userIds, addedBy)` method
   - Verify chat type is 'group'
   - Check users are not already members
   - Create membership records with role='member'
   - Update chat's memberIds array
3. Create `apps/api/src/modules/chat/middleware/verify-membership.ts`
   - Check if authenticated user is a member of the chat
   - Attach membership to request object
4. Create `apps/api/src/modules/chat/middleware/require-admin.ts`
   - Check if membership role is 'admin'
5. Create `apps/api/src/modules/chat/routes/add-members.route.ts`
   - POST handler with authenticate, verifyMembership, requireAdmin middleware
6. Register route in chat router
7. Write unit tests for validator and service
8. Create `apps/api/tests/e2e/chat/add-members.e2e.test.ts`
   - Test: Admin adds new member to group
   - Test: Admin adds multiple members
   - Test: Reject adding members to DM
   - Test: Non-admin cannot add members
   - Test: Reject adding already-existing member
   - Test: Reject adding non-existent user

**Validation**:
- E2E tests pass
- Admin authorization works correctly
- memberIds array updated

**User-Visible Progress**: ✅ Admins can add members to groups

---

### Task 2.5: Implement member removal from groups ✅ COMPLETE
**Dependencies**: Task 2.4 (middleware)
**Parallelizable**: Yes (with 2.4 after middleware created)

**Steps**:
1. Update `apps/api/src/modules/chat/services/membership.service.ts`
   - Implement `removeMember(chatId, userId, removedBy)` method
   - Check if chat is group (not DM)
   - Check authorization: self-removal always OK, otherwise require admin
   - Delete membership record
   - Update chat's memberIds array
2. Create `apps/api/src/modules/chat/routes/remove-member.route.ts`
   - DELETE handler with authenticate, verifyMembership middleware
   - Check admin role if removing others
3. Register route in chat router
4. Write unit tests for service logic
5. Create `apps/api/tests/e2e/chat/remove-member.e2e.test.ts`
   - Test: User removes themselves from group
   - Test: Admin removes another member
   - Test: Non-admin cannot remove other members
   - Test: Reject removal from DM
   - Test: Member not found error

**Validation**:
- E2E tests pass
- Self-removal works without admin role
- Admin can remove others

**User-Visible Progress**: ✅ Users can leave groups, admins can remove members

---

## Phase 3: Chat Listing & Retrieval ✅ COMPLETE

### Task 3.1: Implement chat listing with pagination ✅ COMPLETE
**Dependencies**: Tasks 1.2, 1.3, 2.4 (membership verification)
**Parallelizable**: No

**Steps**:
1. Update `apps/api/src/modules/chat/services/chat.service.ts`
   - Implement `listUserChats(userId, cursor?, limit?)` method
   - Query memberships by userId
   - Query chats by chatIds with pagination
   - For each chat, fetch last message
   - Calculate unread count (messages after lastReadMessageId)
   - Return chats with lastMessage and unreadCount
2. Create `apps/api/src/modules/chat/routes/list-chats.route.ts`
   - GET handler with authenticate middleware
   - Parse cursor and limit query params
   - Call chat service
   - Return paginated response with nextCursor
3. Create validator for query params (cursor, limit)
4. Register route in chat router
5. Write unit tests for service logic
6. Create `apps/api/tests/e2e/chat/list-chats.e2e.test.ts`
   - Test: List all user's chats with last message
   - Test: Empty list for user with no chats
   - Test: Pagination with cursor and limit
   - Test: Reject invalid limit
   - Test: Unread count calculation
   - Test: User only sees their chats
   - Test: Require authentication

**Validation**:
- E2E tests pass
- Pagination works correctly
- Unread counts accurate
- Chats sorted by updatedAt descending

**User-Visible Progress**: ✅ Users can see their chat list

---

### Task 3.2: Implement individual chat retrieval ✅ COMPLETE
**Dependencies**: Task 2.4 (membership verification)
**Parallelizable**: Yes (with 3.1)

**Steps**:
1. Create `apps/api/src/modules/chat/services/chat.service.ts` method
   - Implement `getChatById(chatId, userId)` method
   - Verify user is member
   - Fetch chat details
   - Include member details
2. Create `apps/api/src/modules/chat/routes/get-chat.route.ts`
   - GET handler with authenticate, verifyMembership middleware
3. Register route in chat router
4. Write unit tests for service
5. Create `apps/api/tests/e2e/chat/get-chat.e2e.test.ts`
   - Test: Get chat by ID
   - Test: Chat not found
   - Test: Cannot access without membership
   - Test: Require authentication

**Validation**:
- E2E tests pass
- Membership verification works

**User-Visible Progress**: ✅ Users can view chat details

---

## Phase 4: Messaging ✅ COMPLETE

### Task 4.1: Implement message creation with idempotency ✅ COMPLETE
**Dependencies**: Tasks 1.2, 1.3, 2.4 (membership verification)
**Parallelizable**: No

**Steps**:
1. Create `apps/api/src/modules/chat/validators/create-message.validator.ts`
   - Define Zod schema for `{ chatId, clientId?, body }`
   - Validate chatId is valid ObjectId
   - Validate body is non-empty string, max 8000 chars
   - Validate clientId is valid string if provided
2. Create `apps/api/src/modules/chat/services/message.service.ts`
   - Implement `createMessage(chatId, senderId, body, clientId?)` method
   - Check idempotency: if clientId exists, check for duplicate
   - If duplicate found, return existing message
   - Otherwise, create new message
   - Update chat's updatedAt timestamp
   - Check if DM needs role promotion (message count = 2)
3. Create `apps/api/src/modules/chat/routes/create-message.route.ts`
   - POST handler with authenticate middleware
   - Validate membership before creating message
   - Return 201 for new message, 200 for existing (idempotent)
4. Register route in chat router
5. Write unit tests for validator and service
6. Create `apps/api/tests/e2e/chat/create-message.e2e.test.ts`
   - Test: Create message with client ID
   - Test: Idempotent creation returns existing message
   - Test: Create message without client ID
   - Test: Reject message exceeding max length
   - Test: Reject empty body
   - Test: Cannot post without membership
   - Test: Chat timestamp updated
   - Test: DM role promotion after 2 messages
   - Test: Require authentication

**Validation**:
- E2E tests pass
- Idempotency works correctly
- DM role promotion triggers at right time

**User-Visible Progress**: ✅ Users can send messages

---

### Task 4.2: Implement message listing with pagination ✅ COMPLETE
**Dependencies**: Tasks 1.2, 1.3, 2.4
**Parallelizable**: Yes (with 4.1)

**Steps**:
1. Update `apps/api/src/modules/chat/services/message.service.ts`
   - Implement `listMessages(chatId, userId, before?, limit?)` method
   - Verify user membership
   - Query messages with cursor pagination
   - Return messages with nextCursor
2. Create `apps/api/src/modules/chat/routes/list-messages.route.ts`
   - GET handler with authenticate, verifyMembership middleware
   - Parse before and limit query params
3. Create validator for query params
4. Register route in chat router
5. Write unit tests for service
6. Create `apps/api/tests/e2e/chat/list-messages.e2e.test.ts`
   - Test: List messages for a chat
   - Test: Pagination with before cursor
   - Test: Reject invalid limit
   - Test: Empty list for chat with no messages
   - Test: Cannot list without membership
   - Test: Require authentication

**Validation**:
- E2E tests pass
- Cursor pagination works correctly
- Messages sorted descending by createdAt

**User-Visible Progress**: ✅ Users can view message history

---

### Task 4.3: Implement message search ✅ COMPLETE
**Dependencies**: Tasks 1.2, 1.3, 2.4
**Parallelizable**: Yes (with 4.2)

**Steps**:
1. Create `apps/api/src/modules/chat/validators/search-messages.validator.ts`
   - Define Zod schema for query params `{ q, chatId?, cursor?, limit? }`
   - Validate q (query string) is required, non-empty
   - Validate chatId is valid ObjectId if provided
2. Update `apps/api/src/modules/chat/services/message.service.ts`
   - Implement `searchMessages(userId, query, chatId?, cursor?, limit?)` method
   - Get user's chat memberships
   - Filter chatIds to user's chats (or single chatId if provided)
   - Use MongoDB text search on message body
   - Apply cursor pagination
   - Return messages with nextCursor
3. Create `apps/api/src/modules/chat/routes/search-messages.route.ts`
   - GET handler with authenticate middleware
   - Parse and validate query params
4. Register route in main app router (not chat router, as it's `/v1/search/messages`)
5. Write unit tests for validator and service
6. Create `apps/api/tests/e2e/chat/search-messages.e2e.test.ts`
   - Test: Search messages by text query
   - Test: Search within specific chat
   - Test: Paginate search results
   - Test: Empty results
   - Test: Reject search without query
   - Test: Reject invalid limit
   - Test: Cannot search non-member chats
   - Test: Require authentication

**Validation**:
- E2E tests pass
- Text search works correctly
- Only searches user's chats

**User-Visible Progress**: ✅ Users can search messages

---

## Phase 5: Read State Management ✅ COMPLETE

### Task 5.1: Implement read cursor update ✅ COMPLETE
**Dependencies**: Tasks 1.2, 1.3, 2.4
**Parallelizable**: Yes (with Phase 4 tasks)

**Steps**:
1. Create `apps/api/src/modules/chat/validators/update-read-cursor.validator.ts`
   - Define Zod schema for `{ messageId }`
   - Validate messageId is valid ObjectId
2. Update `apps/api/src/modules/chat/services/membership.service.ts`
   - Implement `updateReadCursor(chatId, userId, messageId)` method
   - Verify message exists and belongs to chat
   - Check if messageId is newer than current lastReadMessageId
   - Update membership if newer
3. Create `apps/api/src/modules/chat/routes/update-read-cursor.route.ts`
   - POST handler with authenticate, verifyMembership middleware
4. Register route in chat router
5. Write unit tests for validator and service
6. Create `apps/api/tests/e2e/chat/update-read-cursor.e2e.test.ts`
   - Test: Update read cursor to mark messages as read
   - Test: Only update if new message is newer
   - Test: Reject invalid message ID
   - Test: Reject message from different chat
   - Test: Cannot update without membership
   - Test: Require authentication

**Validation**:
- E2E tests pass
- Read cursor updates correctly
- Unread counts in chat list reflect cursor changes

**User-Visible Progress**: ✅ Users can mark messages as read

---

## Phase 6: Integration & Testing ✅ COMPLETE

### Task 6.1: Add authorization test matrix for chat endpoints ✅ COMPLETE
**Dependencies**: All previous tasks
**Parallelizable**: No

**Steps**:
1. Create `apps/api/tests/e2e/chat/authorization.e2e.test.ts`
   - Test authorization matrix for all chat endpoints
   - Verify non-members cannot access chat operations
   - Verify admin vs member role restrictions
   - Verify authentication requirements
2. Use existing `authorization-matrix.ts` helper pattern
3. Run full E2E test suite

**Validation**:
- All authorization tests pass
- No gaps in access control

**User-Visible Progress**: None (security validation)

---

### Task 6.2: Integration testing and bug fixes ✅ COMPLETE
**Dependencies**: Task 6.1
**Parallelizable**: No

**Steps**:
1. Run full test suite: `pnpm run test`
2. Fix any failing tests
3. Test manual scenarios via Bruno or curl:
   - Create DM and group chats
   - Send messages with idempotency
   - Add/remove members
   - Paginate chats and messages
   - Search messages
   - Update read cursors
4. Verify error handling and logging
5. Check performance with realistic data volumes

**Validation**:
- All tests pass (unit + E2E)
- Manual testing scenarios work
- No console errors or warnings
- Logging provides useful diagnostic info

**User-Visible Progress**: ✅ Feature complete and stable

---

## Phase 7: Documentation & Finalization ✅ COMPLETE

### Task 7.1: Create Bruno API requests for chat feature ✅ COMPLETE
**Dependencies**: Task 6.2
**Parallelizable**: Yes

**Steps**:
1. Create `bruno/Famly/chat/` folder
2. Add Bruno requests for:
   - Create DM
   - Create group
   - Add members
   - Remove member
   - List chats
   - Get chat
   - List messages
   - Create message
   - Update read cursor
   - Search messages
3. Set up environment variables and auth tokens
4. Test all requests against local API

**Validation**:
- All Bruno requests work correctly
- Responses match expected format

**User-Visible Progress**: None (developer tooling)

---

### Task 7.2: Update OpenSpec with final implementation notes ✅ COMPLETE
**Dependencies**: Task 7.1
**Parallelizable**: Yes

**Steps**:
1. Review implementation against spec
2. Document any deviations or clarifications
3. Update `openspec/changes/add-chat-feature/` files if needed
4. Run `openspec validate add-chat-feature --strict`
5. Resolve any validation issues

**Validation**:
- OpenSpec validation passes
- Docs accurately reflect implementation

**User-Visible Progress**: None (documentation)

---

## Summary

**Total Tasks**: 18 main tasks across 7 phases
**Estimated Duration**: 5-7 days
**Key Milestones**:
- End of Phase 2: Chat creation and management working
- End of Phase 3: Chat listing and retrieval complete
- End of Phase 4: Full messaging functionality
- End of Phase 5: Read state tracking complete
- End of Phase 6: Feature tested and stable

**Parallelization Opportunities**:
- Tasks 1.2 and 1.3 can run in parallel after 1.1
- Tasks 2.3 and 2.4 can partially overlap with 2.2
- Phase 3 tasks can overlap with Phase 2 completion
- Phase 4 tasks can partially overlap
- Phase 5 can run in parallel with Phase 4

**Dependencies to Watch**:
- Middleware (verifyMembership, requireAdmin) needed for many routes
- Repository methods needed before service layer
- Service layer needed before route handlers
- Each route needs corresponding E2E tests before moving on
