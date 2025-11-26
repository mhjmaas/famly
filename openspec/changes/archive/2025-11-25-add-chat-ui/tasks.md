# Implementation Tasks

## 1. Redux State Management
- [x] 1.1 Create `chatSlice.ts` with state for chats, messages, and active chat
- [x] 1.2 Add thunks for fetching chats, fetching messages, and sending messages
- [x] 1.3 Add reducers for handling real-time message events
- [x] 1.4 Add selectors for accessing chat data
- [x] 1.5 Integrate chat slice into root store

## 2. API Integration Hooks
- [x] 2.1 Create `useChats` hook for fetching and managing chat list (implemented via Redux thunks)
- [x] 2.2 Create `useMessages` hook for fetching messages in a chat (implemented via Redux thunks)
- [x] 2.3 Create `useSendMessage` hook for sending messages (implemented via Redux thunks)
- [x] 2.4 Create `useCreateChat` hook for initiating DMs and group chats (implemented via Redux thunks)
- [x] 2.5 Create `useWebSocket` hook for real-time chat events (implemented as useChatEvents)

## 3. Chat List Component
- [x] 3.1 Create `ChatList` component displaying all chats with scroll
- [x] 3.2 Create `ChatListItem` component showing chat preview, last message, and unread count
- [x] 3.3 Add empty state when no chats exist
- [x] 3.4 Add loading state with skeleton loaders
- [x] 3.5 Implement chat selection highlighting
- [x] 3.6 Add "New Chat" button to initiate DM or group chat

## 4. Conversation View Component
- [x] 4.1 Create `ConversationView` component with message list and input
- [x] 4.2 Create `MessageList` component displaying messages chronologically
- [x] 4.3 Create `MessageItem` component for individual messages
- [x] 4.4 Create `MessageInput` component with textarea and send button
- [x] 4.5 Add empty state when no chat is selected
- [x] 4.6 Add loading state for messages
- [x] 4.7 Implement auto-scroll to bottom on new messages
- [x] 4.8 Display message timestamps and sender information

## 5. New Chat Dialog
- [x] 5.1 Create `NewChatDialog` component with tabs for DM and Group
- [x] 5.2 Add family member selector for DM creation
- [x] 5.3 Add multi-select member list for group chat creation
- [x] 5.4 Add group chat title input field
- [x] 5.5 Implement chat creation logic and navigation to new chat

## 6. Real-time Integration
- [x] 6.1 Subscribe to `message:new` events and update Redux store
- [x] 6.2 Subscribe to `chat:update` events for membership changes
- [x] 6.3 Subscribe to `receipt:update` events for read status
- [x] 6.4 Handle WebSocket connection lifecycle (connect, disconnect, reconnect)
- [x] 6.5 Display connection status indicator
- [x] 6.6 Implement automatic message refetch on reconnection

## 7. Desktop Layout
- [x] 7.1 Create two-column layout with chat list (30%) and conversation (70%)
- [x] 7.2 Make chat list resizable with drag handle
- [x] 7.3 Ensure responsive behavior for different desktop screen sizes
- [x] 7.4 Add proper overflow handling for both columns

## 8. Translations
- [x] 8.1 Add en-US translations for all chat UI text
- [x] 8.2 Add nl-NL translations for all chat UI text
- [x] 8.3 Use translation keys in all components
- [x] 8.4 Test language switching

## 9. Styling and Polish
- [x] 9.1 Apply Tailwind CSS styling consistent with existing pages
- [x] 9.2 Use shadcn/ui components (Button, Input, Textarea, Dialog, ScrollArea, Avatar, Badge)
- [x] 9.3 Add hover and focus states for interactive elements
- [x] 9.4 Implement unread badge styling
- [x] 9.5 Add message grouping by sender and time
- [x] 9.6 Style DM vs group chat differently in list

## 10. Testing
- [x] 10.1 Write unit tests for Redux slice and thunks
- [x] 10.2 Write unit tests for custom hooks
- [x] 10.3 Write component tests for ChatList and ChatListItem
- [x] 10.4 Write component tests for ConversationView and MessageItem
- [x] 10.5 Write component tests for NewChatDialog
- [x] 10.6 Write integration tests for real-time message flow
- [x] 10.7 Write e2e tests for complete chat workflow

## 11. Documentation
- [x] 11.1 Add inline code comments for complex logic
- [x] 11.2 Document WebSocket event handling patterns
- [x] 11.3 Document Redux state structure
