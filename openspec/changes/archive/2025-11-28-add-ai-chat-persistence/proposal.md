# Change: Add AI Chat Persistence and @Mention Support

## Why

AI chat messages are currently stored only in client-side state (Redux + useChat hook), meaning they are lost on page refresh. Additionally, users cannot invoke the AI assistant from within DM or Group chats, limiting the AI's utility in collaborative contexts.

## What Changes

### Phase 1: AI Chat Message Persistence
- Persist AI chat messages to the database using existing `messages` collection
- Load AI chat history from API on chat selection (same as DM/Group)
- Allow `AI_SENDER_ID` ("ai-assistant") as a valid sender in message creation
- Remove client-side-only handling for AI chats in Redux slice

### Phase 2: Unified Message Rendering
- Create unified `UnifiedMessageList` component replacing `AIMessageList` and `RegularMessageList`
- Support rich markdown rendering for AI messages in any chat type
- Maintain avatar/timestamp display for user messages
- Single component handles both `MessageDTO[]` input

### Phase 3: @Mention AI in DM/Group Chats
- Detect `@{aiName}` mentions in message input
- Client-side AI invocation using existing `/api/chat` route
- Insert AI response as message with `senderId = AI_SENDER_ID`
- Pass recent chat context (last 20 messages) to AI for relevance

## Impact

- **Affected specs**: `chat`, `web-chat`
- **Affected code**:
  - `apps/api/src/modules/chat/routes/create-message.route.ts` - Allow AI sender ID
  - `apps/api/src/modules/chat/services/message.service.ts` - Handle AI sender
  - `apps/web/src/store/slices/chat.slice.ts` - Remove AI chat skip logic
  - `apps/web/src/components/chat/conversation-view.tsx` - Persist AI messages
  - `apps/web/src/components/chat/message-list-wrapper.tsx` - Unified rendering
  - `apps/web/src/components/chat/regular-message-list.tsx` - Merge into unified
  - `apps/web/src/components/chat/ai-message-list.tsx` - Merge into unified
  - `apps/web/src/components/chat/message-input.tsx` - @mention detection
