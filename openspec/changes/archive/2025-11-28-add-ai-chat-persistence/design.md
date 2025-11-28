# Design: AI Chat Persistence and @Mention Support

## Context

The Famly application has two backend systems:
1. **Express API** (`apps/api`) - Handles data persistence, authentication, realtime events
2. **Next.js API Routes** (`apps/web/src/app/api`) - Handles AI interactions with streaming

Currently, AI chat messages exist only in client-side state (Redux + `useChat` hook from `@ai-sdk/react`). This means:
- Messages are lost on page refresh
- No message history persistence
- AI cannot be invoked from DM/Group chats

The frontend has two separate message list components:
- `AIMessageList` - Renders `UIMessage[]` with markdown, reasoning, regenerate support
- `RegularMessageList` - Renders `MessageDTO[]` with avatars, timestamps

## Goals / Non-Goals

### Goals
- Persist all AI chat messages to MongoDB via existing `messages` collection
- Load AI chat history from API (same pattern as DM/Group chats)
- Unify message rendering into a single component
- Enable @mention AI invocation in DM/Group chats
- Maintain streaming AI responses via `useChat` hook

### Non-Goals
- Using `useChat` for DM/Group chats (unnecessary complexity)
- Server-side AI invocation (would require backend-to-backend calls)
- Real-time typing indicators for AI responses
- AI message editing or deletion

## Decisions

### 1. AI Sender ID Handling

**Decision**: Use reserved string `"ai-assistant"` as `senderId` for AI messages.

**Rationale**:
- Already defined as `AI_SENDER_ID` in `ai-message-utils.ts`
- Avoids creating fake user records for AI
- Easy to identify AI messages in queries
- Works with existing `MessageDTO` schema

**Implementation**:
- Backend: Skip ObjectId validation when `senderId === "ai-assistant"`
- Frontend: Already handles this via `isAIMessage()` utility

### 2. AI Message Persistence Flow

**Decision**: Persist AI messages client-side after streaming completes.

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Chat Flow                                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. User sends message                                           │
│  2. POST to /api/chat (Next.js) - AI streams response           │
│  3. On stream complete:                                          │
│     a. POST user message to /v1/chats/:id/messages              │
│     b. POST AI response to /v1/chats/:id/messages               │
│  4. Messages now in database                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale**:
- Keeps streaming via `useChat` hook intact
- Uses existing message API for persistence
- Idempotency via `clientId` prevents duplicates on retry
- No changes to AI streaming infrastructure

**Alternative Considered**: Persist during streaming
- Rejected: Complex, partial messages, harder error handling

### 3. @Mention AI in DM/Group Chats

**Decision**: Client-side detection and AI invocation.

```
┌─────────────────────────────────────────────────────────────────┐
│  @Mention Flow (DM/Group)                                        │
├─────────────────────────────────────────────────────────────────┤
│  1. User types "@Jarvis what should we cook?"                   │
│  2. Client detects @mention pattern                              │
│  3. Client sends user message to API (normal flow)              │
│  4. Client extracts last 20 messages as context                 │
│  5. Client calls /api/chat with context + question              │
│  6. AI streams response (show typing indicator)                 │
│  7. On complete: POST AI response to /v1/chats/:id/messages     │
│  8. AI message appears in chat for all participants             │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale**:
- No backend-to-backend calls needed
- Reuses existing `/api/chat` Next.js route
- Context gathering from Redux (already loaded)
- AI response persisted via same message API
- Realtime events broadcast AI message to other participants

**Alternative Considered**: Server-side detection in Express API
- Rejected: Would require Express to call Next.js API route

### 4. Unified Message Rendering

**Decision**: Create `UnifiedMessageList` component that handles both AI and user messages.

**Structure**:
```typescript
interface UnifiedMessageListProps {
  messages: MessageDTO[];
  currentUser: UserProfile | null;
  familyMembers: readonly FamilyMember[];
  aiName?: string;
  onRegenerate?: (messageId: string) => void;
}
```

**Rendering Logic**:
- Check `message.senderId === AI_SENDER_ID` to identify AI messages
- AI messages: Render with markdown support, optional regenerate button
- User messages: Render with avatar, timestamp, sender grouping

**Rationale**:
- Single source of truth for message rendering
- AI messages can appear in any chat type
- Consistent styling across chat types
- Easier maintenance

### 5. Loading AI Chat History

**Decision**: Fetch AI chat messages from API on chat selection (same as DM/Group).

**Changes**:
- Remove skip logic in `selectChat` thunk for AI chats
- Initialize `useChat` with loaded messages via `setMessages()`
- `useChat` manages streaming state, Redux manages persistence

**Rationale**:
- Consistent data flow for all chat types
- Messages always loaded from database
- `useChat` only handles active streaming session

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| AI responses can be very long | Increase body limit for AI messages (16KB vs 8KB) |
| Duplicate messages on network retry | Use `clientId` for idempotency (already implemented) |
| @mention parsing edge cases | Use regex with word boundaries, configurable AI name |
| Streaming interrupted before persist | Only persist on successful completion; user can resend |
| AI message in DM visible to all | Intentional - AI assists the conversation |

## Migration Plan

1. **Phase 1**: Backend changes (allow AI sender ID) - No user impact
2. **Phase 2**: AI chat persistence - Existing AI chats start fresh (acceptable)
3. **Phase 3**: Unified message list - Visual consistency improvement
4. **Phase 4**: @Mention support - New feature, opt-in via usage

No data migration needed. Existing AI chat messages (client-only) will not be preserved.

## Open Questions

None - all clarified with user:
- ✅ `useChat` only for AI chats, not DM/Group
- ✅ Client-side AI invocation for @mentions
- ✅ @Mention only in DM/Group chats (not AI chat)
- ✅ Unified message list with markdown support for AI messages
