# Change: Add AI Chat Feature

## Why
Users should be able to initiate conversations with an AI assistant from the chat page when the `aiIntegration` feature is enabled. This provides a foundation for future AI capabilities while giving users immediate access to the chat interface.

## What Changes
- Add a new `"ai"` chat type to distinguish AI conversations from regular DMs and group chats
- Display a special AI chat entry at the top of the chat list when `aiIntegration` is enabled
- The AI chat title is derived from the `aiName` setting (configured in family settings)
- AI chat uses the same conversation view and message input as regular chats
- Messages sent to the AI chat are stored in the database (ready for future AI response integration)
- No AI response generation is implemented in this change (placeholder for future integration)

## Impact
- Affected specs: `chat`, `web-chat`
- Affected code:
  - `apps/api/src/modules/chat/` - Add `"ai"` chat type support
  - `apps/web/src/components/chat/` - Display AI chat in chat list
  - `apps/web/src/store/slices/chat.slice.ts` - Handle AI chat state
  - `packages/shared/src/` - Add `"ai"` chat type constant
