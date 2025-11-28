# Tasks: AI Chat Persistence and @Mention Support

## 1. Backend: Allow AI Sender ID

- [x] 1.1 Update `create-message.route.ts` to accept `AI_SENDER_ID` as valid sender
- [x] 1.2 Update `message.service.ts` to skip ObjectId validation for AI sender
- [x] 1.3 Add constant `AI_SENDER_ID = "ai-assistant"` to shared constants
- [x] 1.4 Write unit tests for AI sender ID handling
- [x] 1.5 Write e2e tests for creating messages with AI sender

## 2. Backend: AI Chat Message Loading

- [x] 2.1 Verify `list-messages.route.ts` works for AI chat type (no changes expected)
- [x] 2.2 Add e2e test for fetching AI chat messages

## 3. Frontend: AI Chat Persistence

- [x] 3.1 Update `chat.slice.ts` to remove AI chat skip logic in `selectChat` thunk
- [x] 3.2 Update `conversation-view.tsx` to persist messages after AI streaming completes
- [x] 3.3 Create `persistAIMessages` utility function for saving user + AI messages
- [x] 3.4 Initialize `useChat` with messages loaded from Redux/API
- [x] 3.5 Handle idempotency with `clientId` for AI message persistence
- [x] 3.6 Update `use-chat-events.ts` to handle AI chat realtime events
- [x] 3.7 Write unit tests for AI message persistence flow
- [x] 3.8 Write integration tests for AI chat load/save cycle

## 4. Frontend: Unified Message List

- [x] 4.1 Create `UnifiedMessageList` component
- [x] 4.2 Add markdown rendering support for AI messages (using existing markdown component)
- [x] 4.3 Add AI message visual distinction (bot icon, different styling)
- [x] 4.4 Support optional `onRegenerate` callback for last AI message
- [x] 4.5 Migrate `conversation-view.tsx` to use `UnifiedMessageList`
- [x] 4.6 Remove `AIMessageList` component (deprecated)
- [x] 4.7 Remove `RegularMessageList` component (deprecated)
- [x] 4.8 Update `message-list-wrapper.tsx` to use unified component
- [x] 4.9 Write unit tests for unified message list
- [x] 4.10 Verify visual regression with existing chat UI

## 5. Frontend: @Mention AI Detection

- [x] 5.1 Create `useMentionDetection` hook for parsing @mentions
- [x] 5.2 Add AI name pattern matching (configurable via family settings)
- [x] 5.3 Extract mention and question from message text
- [x] 5.4 Write unit tests for mention detection patterns

## 6. Frontend: @Mention AI Invocation

- [x] 6.1 Update `message-input.tsx` to detect @mention before send
- [x] 6.2 Create `useAIMention` hook for handling AI invocation flow
- [x] 6.3 Extract context from last 20 messages in Redux
- [x] 6.4 Call `/api/chat` with context and user question
- [x] 6.5 Show typing indicator while AI is responding
- [x] 6.6 Persist AI response as message with `AI_SENDER_ID`
- [x] 6.7 Handle errors gracefully (toast notification)
- [x] 6.8 Write unit tests for @mention flow

## 7. Frontend: @Mention UI Enhancements

- [x] 7.1 Add autocomplete suggestion when typing `@`
- [x] 7.2 Highlight AI name in message input
- [x] 7.3 Add translations for @mention UI text
- [x] 7.4 Write unit tests for autocomplete behavior

## 8. Documentation and Cleanup

- [x] 8.1 Update README with AI chat persistence details
- [x] 8.2 Remove deprecated `syncAIMessages` action from chat slice
- [x] 8.3 Clean up unused AI message utility functions
- [x] 8.4 Final review and code cleanup
