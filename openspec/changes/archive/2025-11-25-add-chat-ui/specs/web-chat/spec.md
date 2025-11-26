# Web Chat UI Specification

## ADDED Requirements

### Requirement: Desktop Chat Layout
The web application SHALL provide a desktop-first two-column layout for chat functionality with a chat list and conversation view side by side.

#### Scenario: Initial page load
- **WHEN** a user navigates to `/app/chat`
- **THEN** the page SHALL display a two-column layout
- **AND** the left column SHALL show the chat list (30% width)
- **AND** the right column SHALL show the conversation view (70% width)
- **AND** both columns SHALL have independent scrolling

#### Scenario: No chat selected
- **WHEN** no chat is selected
- **THEN** the conversation view SHALL display an empty state
- **AND** the empty state SHALL prompt the user to select a chat or create a new one

#### Scenario: Resizable chat list
- **WHEN** a user drags the resize handle between columns
- **THEN** the chat list width SHALL adjust between 20% and 50%
- **AND** the conversation view SHALL adjust proportionally
- **AND** the resize preference SHALL persist in local storage

### Requirement: Chat List Display
The web application SHALL display a list of all user's chats with preview information and unread indicators.

#### Scenario: Display chat list with previews
- **WHEN** the chat page loads
- **THEN** the application SHALL fetch all user's chats via `GET /v1/chats`
- **AND** SHALL display each chat as a list item
- **AND** each item SHALL show the chat title (or member names for DMs)
- **AND** each item SHALL show the last message preview (truncated to 50 characters)
- **AND** each item SHALL show the last message timestamp
- **AND** chats SHALL be sorted by last message timestamp descending

#### Scenario: Display unread count badge
- **WHEN** a chat has unread messages
- **THEN** the chat list item SHALL display an unread count badge
- **AND** the badge SHALL show the number of unread messages
- **AND** the badge SHALL use accent color styling

#### Scenario: Distinguish DM from group chat
- **WHEN** displaying a DM chat
- **THEN** the chat SHALL show the other member's avatar
- **AND** the title SHALL be the other member's name
- **WHEN** displaying a group chat
- **THEN** the chat SHALL show a group icon
- **AND** the title SHALL be the group chat title

#### Scenario: Empty chat list
- **WHEN** the user has no chats
- **THEN** the chat list SHALL display an empty state
- **AND** the empty state SHALL include a "Start a conversation" message
- **AND** SHALL include a button to create a new chat

#### Scenario: Loading state
- **WHEN** chats are being fetched
- **THEN** the chat list SHALL display skeleton loaders
- **AND** SHALL show 5 skeleton items

### Requirement: Chat Selection
The web application SHALL allow users to select a chat from the list and display its conversation.

#### Scenario: Select a chat
- **WHEN** a user clicks on a chat list item
- **THEN** the chat SHALL be marked as selected with highlight styling
- **AND** the conversation view SHALL load messages for that chat
- **AND** the URL SHALL update to `/app/chat?chatId=<chatId>`
- **AND** the unread count for that chat SHALL reset to 0

#### Scenario: Navigate via URL
- **WHEN** a user navigates to `/app/chat?chatId=<chatId>`
- **THEN** the application SHALL select the corresponding chat
- **AND** SHALL display its conversation
- **AND** SHALL scroll the chat list to make the selected chat visible

#### Scenario: Invalid chat ID
- **WHEN** a user navigates to a chat ID they don't have access to
- **THEN** the application SHALL display an error message
- **AND** SHALL clear the selection
- **AND** SHALL show the empty state in the conversation view

### Requirement: Conversation View
The web application SHALL display messages in a conversation with proper formatting and chronological ordering.

#### Scenario: Display messages chronologically
- **WHEN** a chat is selected
- **THEN** the application SHALL fetch messages via `GET /v1/chats/:chatId/messages`
- **AND** SHALL display messages in chronological order (oldest first)
- **AND** SHALL scroll to the bottom to show the most recent message
- **AND** each message SHALL show the sender's name and avatar
- **AND** each message SHALL show the message body
- **AND** each message SHALL show the timestamp

#### Scenario: Group consecutive messages
- **WHEN** multiple consecutive messages are from the same sender within 5 minutes
- **THEN** only the first message SHALL show the sender's avatar and name
- **AND** subsequent messages SHALL be grouped with reduced spacing
- **AND** timestamps SHALL only show on the last message in the group

#### Scenario: Distinguish own messages
- **WHEN** displaying the current user's messages
- **THEN** messages SHALL be right-aligned
- **AND** SHALL use a different background color
- **AND** SHALL not show the sender's name (only avatar)

#### Scenario: Display other users' messages
- **WHEN** displaying other users' messages
- **THEN** messages SHALL be left-aligned
- **AND** SHALL show the sender's name and avatar
- **AND** SHALL use the default message background color

#### Scenario: Empty conversation
- **WHEN** a chat has no messages
- **THEN** the conversation view SHALL display an empty state
- **AND** the empty state SHALL say "No messages yet. Start the conversation!"

#### Scenario: Loading messages
- **WHEN** messages are being fetched
- **THEN** the conversation view SHALL display a loading spinner
- **AND** SHALL maintain scroll position if messages already exist

#### Scenario: Message pagination
- **WHEN** a user scrolls to the top of the message list
- **AND** more messages are available
- **THEN** the application SHALL fetch older messages
- **AND** SHALL prepend them to the list
- **AND** SHALL maintain the scroll position relative to the previously visible message

### Requirement: Send Message
The web application SHALL allow users to compose and send messages in a chat.

#### Scenario: Compose and send message
- **WHEN** a user types in the message input
- **AND** presses Enter or clicks the send button
- **THEN** the application SHALL send the message via `POST /v1/chats/:chatId/messages`
- **AND** SHALL display the message optimistically in the conversation
- **AND** SHALL clear the input field
- **AND** SHALL scroll to the bottom to show the new message

#### Scenario: Send with Shift+Enter for new line
- **WHEN** a user types in the message input
- **AND** presses Shift+Enter
- **THEN** a new line SHALL be inserted
- **AND** the message SHALL NOT be sent

#### Scenario: Empty message validation
- **WHEN** a user attempts to send an empty message
- **THEN** the send button SHALL be disabled
- **AND** pressing Enter SHALL not send the message

#### Scenario: Message length validation
- **WHEN** a user types more than 8000 characters
- **THEN** the input SHALL display a character count warning
- **AND** SHALL prevent typing beyond the limit
- **AND** the send button SHALL be disabled

#### Scenario: Send message error
- **WHEN** sending a message fails
- **THEN** the optimistic message SHALL be marked as failed
- **AND** SHALL display a retry button
- **AND** SHALL show an error toast notification

#### Scenario: Message idempotency
- **WHEN** sending a message
- **THEN** the application SHALL generate a unique `clientId`
- **AND** SHALL include it in the API request
- **AND** SHALL prevent duplicate sends if the user clicks send multiple times

### Requirement: New Chat Creation
The web application SHALL allow users to initiate new DM and group chats.

#### Scenario: Open new chat dialog
- **WHEN** a user clicks the "New Chat" button
- **THEN** a dialog SHALL open
- **AND** SHALL display tabs for "Direct Message" and "Group Chat"

#### Scenario: Create DM chat
- **WHEN** a user selects the "Direct Message" tab
- **THEN** the dialog SHALL display a list of family members
- **AND** SHALL exclude the current user
- **AND** SHALL show existing DM status if one exists
- **WHEN** a user selects a family member
- **THEN** the application SHALL create a DM via `POST /v1/chats` with `type: "dm"`
- **AND** SHALL navigate to the new chat
- **AND** SHALL close the dialog

#### Scenario: Create DM with existing chat
- **WHEN** a user selects a family member with an existing DM
- **THEN** the application SHALL navigate to the existing chat
- **AND** SHALL NOT create a duplicate DM
- **AND** SHALL close the dialog

#### Scenario: Create group chat
- **WHEN** a user selects the "Group Chat" tab
- **THEN** the dialog SHALL display a group title input field
- **AND** SHALL display a multi-select list of family members
- **AND** SHALL exclude the current user from the list (auto-included)
- **WHEN** a user enters a title and selects at least 2 members
- **AND** clicks "Create Group"
- **THEN** the application SHALL create a group chat via `POST /v1/chats` with `type: "group"`
- **AND** SHALL navigate to the new chat
- **AND** SHALL close the dialog

#### Scenario: Group chat validation
- **WHEN** creating a group chat
- **AND** the title is empty
- **THEN** the "Create Group" button SHALL be disabled
- **AND** SHALL display a validation message
- **WHEN** fewer than 2 members are selected
- **THEN** the "Create Group" button SHALL be disabled
- **AND** SHALL display a validation message

### Requirement: Real-time Message Updates
The web application SHALL subscribe to real-time chat events and update the UI automatically.

#### Scenario: Connect to WebSocket on page load
- **WHEN** the chat page loads
- **THEN** the application SHALL establish a WebSocket connection
- **AND** SHALL authenticate using the user's session token
- **AND** SHALL join the user's personal room `user:<userId>`

#### Scenario: Receive new message event
- **WHEN** a `message:new` event is received
- **AND** the message belongs to a chat in the user's list
- **THEN** the application SHALL add the message to the Redux store
- **AND** SHALL update the chat's last message preview
- **AND** SHALL increment the unread count if the chat is not selected
- **AND** SHALL display the message in the conversation if the chat is selected
- **AND** SHALL scroll to the bottom if the user is near the bottom

#### Scenario: Receive message for selected chat
- **WHEN** a `message:new` event is received
- **AND** the message belongs to the currently selected chat
- **THEN** the application SHALL display the message immediately
- **AND** SHALL emit a `receipt:read` event to mark the message as read
- **AND** SHALL NOT increment the unread count

#### Scenario: Receive chat update event
- **WHEN** a `chat:update` event is received
- **THEN** the application SHALL update the chat in the Redux store
- **AND** SHALL re-render the chat list item
- **AND** SHALL update the conversation view if the chat is selected

#### Scenario: Receive read receipt event
- **WHEN** a `receipt:update` event is received
- **THEN** the application SHALL update the read status in the Redux store
- **AND** SHALL display read indicators on messages (future enhancement)

#### Scenario: WebSocket disconnection
- **WHEN** the WebSocket connection is lost
- **THEN** the application SHALL display a connection status warning
- **AND** SHALL attempt to reconnect automatically
- **AND** SHALL refetch the chat list upon reconnection
- **AND** SHALL refetch messages for the selected chat upon reconnection

#### Scenario: WebSocket reconnection
- **WHEN** the WebSocket connection is re-established
- **THEN** the application SHALL dismiss the connection warning
- **AND** SHALL re-authenticate
- **AND** SHALL rejoin the user's personal room
- **AND** SHALL resume real-time updates

### Requirement: Chat State Management
The web application SHALL use Redux to manage chat state including chats, messages, and UI state.

#### Scenario: Redux chat slice structure
- **WHEN** the application initializes
- **THEN** the Redux store SHALL include a `chat` slice
- **AND** the slice SHALL contain `chats` (array of ChatWithPreviewDTO)
- **AND** SHALL contain `messages` (map of chatId to array of MessageDTO)
- **AND** SHALL contain `activeChatId` (currently selected chat)
- **AND** SHALL contain `loading` states for chats and messages
- **AND** SHALL contain `error` states for chats and messages

#### Scenario: Fetch chats thunk
- **WHEN** the `fetchChats` thunk is dispatched
- **THEN** the application SHALL set `loading.chats` to true
- **AND** SHALL call `GET /v1/chats`
- **AND** SHALL update the `chats` array in the store
- **AND** SHALL set `loading.chats` to false
- **AND** SHALL set `error.chats` if the request fails

#### Scenario: Fetch messages thunk
- **WHEN** the `fetchMessages` thunk is dispatched with a chatId
- **THEN** the application SHALL set `loading.messages` to true
- **AND** SHALL call `GET /v1/chats/:chatId/messages`
- **AND** SHALL update the `messages[chatId]` array in the store
- **AND** SHALL set `loading.messages` to false
- **AND** SHALL set `error.messages` if the request fails

#### Scenario: Send message thunk
- **WHEN** the `sendMessage` thunk is dispatched
- **THEN** the application SHALL add the message optimistically to the store
- **AND** SHALL call `POST /v1/chats/:chatId/messages`
- **AND** SHALL update the message with the server response
- **AND** SHALL mark the message as failed if the request fails

#### Scenario: Select chat action
- **WHEN** the `selectChat` action is dispatched with a chatId
- **THEN** the application SHALL set `activeChatId` to the chatId
- **AND** SHALL dispatch `fetchMessages` for that chat
- **AND** SHALL reset the unread count for that chat to 0

### Requirement: Internationalization
The web application SHALL support multiple languages for all chat UI text.

#### Scenario: English translations
- **WHEN** the user's language is set to en-US
- **THEN** all chat UI text SHALL display in English
- **AND** translations SHALL be loaded from `dictionaries/en-US/dashboard/chat.json`

#### Scenario: Dutch translations
- **WHEN** the user's language is set to nl-NL
- **THEN** all chat UI text SHALL display in Dutch
- **AND** translations SHALL be loaded from `dictionaries/nl-NL/dashboard/chat.json`

#### Scenario: Translation keys coverage
- **WHEN** rendering any chat UI component
- **THEN** all user-facing text SHALL use translation keys
- **AND** SHALL NOT contain hardcoded English strings
- **AND** translation keys SHALL cover:
  - Chat list headers and empty states
  - Conversation view headers and empty states
  - Message input placeholder and validation messages
  - New chat dialog titles, labels, and buttons
  - Error messages and connection status
  - Timestamps and relative time formatting

### Requirement: UI Component Library Integration
The web application SHALL use shadcn/ui components for consistent styling and behavior.

#### Scenario: Use shadcn/ui Button
- **WHEN** rendering action buttons (send, new chat, etc.)
- **THEN** the application SHALL use the `Button` component from `@/components/ui/button`
- **AND** SHALL apply appropriate variants (default, ghost, outline)

#### Scenario: Use shadcn/ui Input and Textarea
- **WHEN** rendering text input fields
- **THEN** the application SHALL use `Input` or `Textarea` from `@/components/ui`
- **AND** SHALL apply consistent styling and focus states

#### Scenario: Use shadcn/ui Dialog
- **WHEN** rendering the new chat dialog
- **THEN** the application SHALL use `Dialog` components from `@/components/ui/dialog`
- **AND** SHALL include DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription

#### Scenario: Use shadcn/ui ScrollArea
- **WHEN** rendering scrollable lists (chat list, message list)
- **THEN** the application SHALL use `ScrollArea` from `@/components/ui/scroll-area`
- **AND** SHALL apply consistent scrollbar styling

#### Scenario: Use shadcn/ui Avatar
- **WHEN** rendering user avatars
- **THEN** the application SHALL use `Avatar` from `@/components/ui/avatar`
- **AND** SHALL include AvatarImage and AvatarFallback

#### Scenario: Use shadcn/ui Badge
- **WHEN** rendering unread count badges
- **THEN** the application SHALL use `Badge` from `@/components/ui/badge`
- **AND** SHALL apply the appropriate variant

#### Scenario: Use shadcn/ui Tabs
- **WHEN** rendering the new chat dialog tabs
- **THEN** the application SHALL use `Tabs` from `@/components/ui/tabs`
- **AND** SHALL include TabsList, TabsTrigger, and TabsContent

### Requirement: Accessibility
The web application SHALL follow accessibility best practices for the chat UI.

#### Scenario: Keyboard navigation
- **WHEN** a user navigates using the keyboard
- **THEN** all interactive elements SHALL be focusable
- **AND** focus indicators SHALL be visible
- **AND** Tab key SHALL move focus in logical order
- **AND** Enter key SHALL activate buttons and send messages
- **AND** Escape key SHALL close dialogs

#### Scenario: Screen reader support
- **WHEN** a screen reader is active
- **THEN** all UI elements SHALL have appropriate ARIA labels
- **AND** chat list items SHALL announce chat name, last message, and unread count
- **AND** messages SHALL announce sender and content
- **AND** loading states SHALL announce "Loading chats" or "Loading messages"

#### Scenario: Focus management
- **WHEN** a dialog opens
- **THEN** focus SHALL move to the first interactive element
- **WHEN** a dialog closes
- **THEN** focus SHALL return to the trigger element
- **WHEN** a chat is selected
- **THEN** focus SHALL move to the message input

### Requirement: Performance Optimization
The web application SHALL optimize performance for smooth user experience.

#### Scenario: Virtual scrolling for large chat lists
- **WHEN** a user has more than 50 chats
- **THEN** the chat list SHALL use virtual scrolling
- **AND** SHALL only render visible items plus a buffer
- **AND** SHALL maintain smooth scrolling performance

#### Scenario: Message list virtualization
- **WHEN** a conversation has more than 100 messages
- **THEN** the message list SHALL use virtual scrolling
- **AND** SHALL only render visible messages plus a buffer
- **AND** SHALL maintain scroll position when loading older messages

#### Scenario: Debounced typing indicators
- **WHEN** a user types in the message input
- **THEN** typing indicator events SHALL be debounced to 500ms
- **AND** SHALL not emit on every keystroke

#### Scenario: Optimistic UI updates
- **WHEN** a user sends a message
- **THEN** the message SHALL appear immediately in the UI
- **AND** SHALL show a sending indicator
- **AND** SHALL update with server confirmation
- **AND** SHALL handle failures gracefully

### Requirement: Error Handling
The web application SHALL handle errors gracefully and provide clear feedback to users.

#### Scenario: API error handling
- **WHEN** an API request fails
- **THEN** the application SHALL display an error toast
- **AND** SHALL log the error with correlation ID
- **AND** SHALL provide a retry action when appropriate

#### Scenario: WebSocket error handling
- **WHEN** a WebSocket event fails to process
- **THEN** the application SHALL log the error
- **AND** SHALL NOT crash the application
- **AND** SHALL continue processing subsequent events

#### Scenario: Network error recovery
- **WHEN** the network connection is lost
- **THEN** the application SHALL display a connection status warning
- **AND** SHALL queue outgoing messages
- **AND** SHALL retry sending when connection is restored

#### Scenario: Chat not found error
- **WHEN** a user tries to access a non-existent chat
- **THEN** the application SHALL display "Chat not found" message
- **AND** SHALL provide a link to return to the chat list

#### Scenario: Permission error
- **WHEN** a user tries to access a chat they're not a member of
- **THEN** the application SHALL display "Access denied" message
- **AND** SHALL redirect to the chat list
