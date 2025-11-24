# Change: Add Chat UI for Desktop

## Why
Users need a visual interface to access chat functionality. Currently, the chat API and WebSocket infrastructure exist, but there is no UI to list chats, view conversations, or send messages. This change delivers a desktop-first chat interface that enables users to initiate DMs, create group chats, view their chat list, and participate in conversations.

## What Changes
- Create a new `web-chat` capability specification
- Implement a desktop chat UI with side-by-side layout (chat list + conversation view)
- Add chat list component displaying both DMs and group chats with unread counts and last message previews
- Add conversation view component showing messages in chronological order
- Add message input component for sending new messages
- Integrate with existing REST API endpoints (`GET /chats`, `GET /chats/:chatId/messages`, `POST /chats/:chatId/messages`)
- Integrate with WebSocket events for real-time message delivery and read receipts
- Add UI for initiating new DMs and group chats
- Include comprehensive translations (en-US and nl-NL)
- Use shadcn/ui components for consistent design
- Implement Redux state management for chat data

## Impact
- Affected specs: `web-chat` (new), `chat` (reference), `realtime-events` (reference)
- Affected code:
  - New: `apps/web/src/app/[lang]/app/chat/page.tsx` (replace placeholder)
  - New: `apps/web/src/components/chat/*` (chat components)
  - New: `apps/web/src/store/slices/chatSlice.ts` (Redux state)
  - New: `apps/web/src/hooks/useChat.ts` (chat hooks)
  - Modified: `apps/web/src/dictionaries/en-US/dashboard/chat.json` (translations)
  - Modified: `apps/web/src/dictionaries/nl-NL/dashboard/chat.json` (translations)
