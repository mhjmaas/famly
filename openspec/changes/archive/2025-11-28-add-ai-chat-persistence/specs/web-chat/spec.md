# web-chat Specification Delta

## ADDED Requirements

### Requirement: Unified Message List Component
The web application SHALL use a single unified message list component that renders both user messages and AI messages appropriately.

#### Scenario: Render user messages with avatar
- **GIVEN** a message list containing user messages
- **WHEN** the message list is rendered
- **THEN** user messages display with sender avatar
- **AND** user messages display with timestamp
- **AND** own messages are aligned to the right
- **AND** other users' messages are aligned to the left

#### Scenario: Render AI messages with markdown
- **GIVEN** a message list containing AI assistant messages (senderId = "ai-assistant")
- **WHEN** the message list is rendered
- **THEN** AI messages are rendered with markdown formatting support
- **AND** AI messages display with a bot/AI icon instead of user avatar
- **AND** AI messages are visually distinct from user messages

#### Scenario: Mixed message rendering
- **GIVEN** a DM or Group chat containing both user messages and AI responses
- **WHEN** the message list is rendered
- **THEN** all messages are displayed in chronological order
- **AND** user messages use standard rendering
- **AND** AI messages use markdown rendering with AI styling

#### Scenario: Regenerate button for AI messages
- **GIVEN** an AI chat with AI assistant messages
- **WHEN** the last message is from the AI assistant
- **THEN** a regenerate button is displayed on the last AI message
- **WHEN** the user clicks regenerate
- **THEN** the AI is invoked again with the same context

### Requirement: AI Chat Message Persistence
The web application SHALL persist AI chat messages to the database after streaming completes.

#### Scenario: Persist user message to AI chat
- **GIVEN** a user sends a message in an AI chat
- **WHEN** the message is submitted
- **THEN** the user message is sent to the AI for processing
- **AND** the user message is persisted to the database via API
- **AND** the message uses a clientId for idempotency

#### Scenario: Persist AI response after streaming
- **GIVEN** the AI is streaming a response
- **WHEN** the streaming completes successfully
- **THEN** the AI response is persisted to the database via API
- **AND** the message has senderId = "ai-assistant"
- **AND** the message uses a clientId for idempotency

#### Scenario: Load AI chat history from database
- **GIVEN** a user selects an AI chat
- **WHEN** the chat is loaded
- **THEN** messages are fetched from the API (same as DM/Group)
- **AND** the useChat hook is initialized with the loaded messages
- **AND** the user sees their previous conversation history

#### Scenario: Handle persistence failure gracefully
- **GIVEN** the AI has generated a response
- **WHEN** persisting to the database fails
- **THEN** an error toast is displayed
- **AND** the message remains visible in the UI
- **AND** the user can retry sending

### Requirement: AI Mention Detection in Message Input
The web application SHALL detect @mentions of the AI assistant in the message input for DM and Group chats.

#### Scenario: Detect AI name mention
- **GIVEN** a user is composing a message in a DM or Group chat
- **AND** the family has aiIntegration enabled with aiName "Jarvis"
- **WHEN** the user types "@Jarvis"
- **THEN** the system detects the AI mention
- **AND** the mention is highlighted in the input

#### Scenario: Show autocomplete for AI mention
- **GIVEN** a user types "@" in a DM or Group chat
- **AND** the family has aiIntegration enabled
- **WHEN** the autocomplete menu appears
- **THEN** the AI assistant name is shown as an option
- **WHEN** the user selects the AI name
- **THEN** the mention is inserted into the message

#### Scenario: No AI mention in AI chat
- **GIVEN** a user is in their dedicated AI chat
- **WHEN** the user types "@Jarvis"
- **THEN** no special mention handling occurs
- **AND** the text is treated as regular message content

### Requirement: AI Mention Invocation Flow
The web application SHALL invoke the AI when a message with an AI mention is sent in a DM or Group chat.

#### Scenario: Send message with AI mention
- **GIVEN** a user has composed a message with "@Jarvis what's for dinner?"
- **WHEN** the user sends the message
- **THEN** the user's message is sent to the API and stored
- **AND** the last 20 messages are extracted as context
- **AND** the AI is invoked via /api/chat with context and question
- **AND** a typing indicator is shown while AI responds

#### Scenario: AI response appears in chat
- **GIVEN** the AI has been invoked via @mention
- **WHEN** the AI finishes generating a response
- **THEN** the AI response is persisted as a message with senderId "ai-assistant"
- **AND** the message appears in the chat for all participants
- **AND** other participants receive the message via realtime events

#### Scenario: AI mention error handling
- **GIVEN** a user sends a message with an AI mention
- **WHEN** the AI invocation fails
- **THEN** an error toast is displayed
- **AND** the user's original message remains in the chat
- **AND** no AI response message is created

#### Scenario: AI mention streaming indicator
- **GIVEN** a user has sent a message with an AI mention
- **WHEN** the AI is generating a response
- **THEN** a typing indicator shows "AI is thinking..."
- **AND** other chat participants see the typing indicator

### Requirement: AI Mention Internationalization
The AI mention feature SHALL support multiple languages.

#### Scenario: English AI mention translations
- **WHEN** the user's language is set to en-US
- **THEN** AI mention UI text displays in English
- **AND** translations include:
  - Autocomplete hint text
  - Typing indicator text
  - Error messages

#### Scenario: Dutch AI mention translations
- **WHEN** the user's language is set to nl-NL
- **THEN** AI mention UI text displays in Dutch
- **AND** translations include:
  - Autocomplete hint text
  - Typing indicator text
  - Error messages

### Requirement: AI Mention Test IDs
The AI mention components SHALL have data-testid attributes for E2E testing.

#### Scenario: AI mention autocomplete has test ID
- **GIVEN** the AI mention autocomplete is displayed
- **THEN** the autocomplete container has `data-testid="ai-mention-autocomplete"`
- **AND** each suggestion has `data-testid="ai-mention-suggestion"`

#### Scenario: AI typing indicator has test ID
- **GIVEN** the AI is generating a response to a mention
- **THEN** the typing indicator has `data-testid="ai-typing-indicator"`
