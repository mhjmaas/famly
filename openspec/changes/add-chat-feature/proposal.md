# Proposal: add-chat-feature

## Overview
Implement a chat feature supporting direct messages (DM) and group chats with plain text/emoji content. Enable chat creation, membership management, message history with cursor-based pagination, read state tracking, and optional message posting via REST endpoints.

## Goals
- Support private DMs and group chats with role-based membership
- Provide cursor-based pagination for chats and messages
- Enforce authorization and membership on all operations
- Ensure idempotency for message creation using client-supplied IDs
- Maintain consistency with existing codebase patterns (error envelopes, logging, validation)

## Non-Goals
- Media attachments (images, files, video)
- Real-time WebSocket/SSR-based messaging
- End-to-end encryption
- Message reactions or threading
- Rich text formatting beyond plain text + emoji

## Background
Families need a communication channel to coordinate household activities, share updates, and maintain connection. The chat feature will complement existing family management capabilities (tasks, diary, shopping lists) by providing asynchronous text-based communication.

### Rationale
- **DMs**: Enable one-on-one conversations between family members
- **Group chats**: Support whole-family or subset discussions
- **Read state tracking**: Help users track unread messages
- **Idempotency**: Prevent duplicate messages due to network retries
- **Cursor pagination**: Handle large message histories efficiently

## User Impact
- Positive: Centralized family communication within the platform
- Positive: Reduces need for external messaging apps
- Neutral: Requires user education on chat vs diary feature differences
- Risk: Potential confusion if both DMs and group chats aren't clearly distinguished in UI

## Technical Approach

### Domain Model
The chat feature introduces three core entities:
- **Chat**: Container for messages, tracks members and metadata
- **Message**: Individual text message with sender, body, and timestamps
- **Membership**: Links users to chats with roles and read state

### Database Collections
- `chats`: Stores chat metadata (type, title, creator, timestamps)
- `messages`: Stores individual messages with chat reference and idempotency keys
- `chat_memberships`: Links users to chats with roles and read cursors

### Authorization Strategy
- All endpoints require authentication via JWT
- Membership verification for all chat operations
- Admin role required for group management operations
- Self-leave always permitted, admin required to remove others

### API Patterns
Following existing codebase conventions:
- Zod validators for request validation
- Repository pattern for data access
- Service layer for business logic
- Mapper functions for DTO transformations
- Express routers with middleware chains
- Structured error responses using HttpError

## Alternatives Considered

### Alternative 1: WebSocket-based real-time messaging
**Rejected**: Adds significant complexity (connection management, presence, scaling) without immediate user demand. REST API sufficient for MVP.

### Alternative 2: Shared entry repository pattern (like diary)
**Rejected**: Chat messages have different characteristics (idempotency, higher volume, different query patterns) warranting separate repository.

### Alternative 3: Single messages table without separate memberships
**Rejected**: Membership tracking (roles, read cursors) requires separate entity to avoid denormalization and complex queries.

## Dependencies
- None: Independent feature using existing infrastructure (MongoDB, Express, Better Auth)

## Risks and Mitigations

### Risk 1: Message volume scaling
- **Likelihood**: Medium
- **Impact**: High (performance degradation)
- **Mitigation**: Implement proper indexing strategy, cursor pagination, and consider archival strategy in future

### Risk 2: Idempotency key collisions
- **Likelihood**: Low
- **Impact**: Medium (duplicate messages)
- **Mitigation**: Use compound unique index on (chatId, clientId), document client-side ID generation requirements

### Risk 3: Read state synchronization across devices
- **Likelihood**: High
- **Impact**: Low (confusing UX)
- **Mitigation**: Document that read state is per-device via clientId; future enhancement can sync across sessions

## Open Questions
1. Should we support editing/deleting messages in MVP?
   - **Proposed**: Add `deleted` flag and `editedAt` timestamp to domain model, but defer implementation to post-MVP

2. What rate limits are appropriate for message creation?
   - **Proposed**: 10 messages per 3 seconds per user (prevents spam while allowing conversation flow)

3. Should DMs support more than 2 participants (i.e., upgrade to group)?
   - **Proposed**: No, create new group chat instead. Simpler logic and clearer UX.

4. How do we handle message search pagination?
   - **Proposed**: Use cursor-based pagination on message ID, same pattern as message history

## Success Metrics
- Users can create DMs and group chats
- Messages are delivered reliably with idempotency guarantees
- Read state tracking works correctly across chat types
- Authorization prevents unauthorized access to chats/messages
- Pagination handles large message histories (100+ messages) efficiently

## Timeline Estimate
- **Design & Planning**: Complete (this proposal)
- **Implementation**: 3-5 days
  - Day 1: Domain models, repositories, indexes
  - Day 2: Validators, services, core CRUD operations
  - Day 3: Membership management, pagination
  - Day 4: Read state tracking, message posting
  - Day 5: E2E tests, integration, documentation
- **Testing & Review**: 1-2 days
- **Total**: ~1 week

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Approval
- [ ] Security Review (if applicable)
