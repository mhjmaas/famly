## ADDED Requirements

### Requirement: AI Chat Display in Chat List
The web application SHALL display the AI chat at the top of the chat list when `aiIntegration` is enabled.

#### Scenario: AI chat appears at top of list
- **GIVEN** a user belongs to a family with `aiIntegration` enabled
- **AND** the user has an AI chat
- **WHEN** the chat list is rendered
- **THEN** the AI chat appears as the first item in the list
- **AND** regular chats appear below the AI chat sorted by last message time

#### Scenario: AI chat not shown when feature disabled
- **GIVEN** a user belongs to a family with `aiIntegration` disabled
- **WHEN** the chat list is rendered
- **THEN** no AI chat appears in the list
- **AND** only regular DM and group chats are shown

#### Scenario: AI chat has visual distinction
- **GIVEN** the AI chat is displayed in the chat list
- **WHEN** the user views the chat list
- **THEN** the AI chat has a distinct icon (bot/AI icon)
- **AND** the AI chat title displays the configured `aiName`
- **AND** the AI chat is visually distinguishable from regular chats

### Requirement: AI Chat Title from Settings
The AI chat title SHALL be derived from the `aiName` setting in family settings.

#### Scenario: Display configured AI name
- **GIVEN** a family has `aiSettings.aiName` set to "Jarvis"
- **WHEN** the AI chat is displayed in the chat list
- **THEN** the chat title shows "Jarvis"

#### Scenario: Default AI name when not configured
- **GIVEN** a family has `aiIntegration` enabled
- **AND** `aiSettings.aiName` is empty or not set
- **WHEN** the AI chat is displayed
- **THEN** the chat title shows a default name (e.g., "AI Assistant")

### Requirement: AI Chat Conversation View
The AI chat conversation view SHALL use the same interface as regular chats.

#### Scenario: Open AI chat conversation
- **GIVEN** the AI chat is displayed in the chat list
- **WHEN** the user clicks on the AI chat
- **THEN** the conversation view opens
- **AND** the message input is available
- **AND** existing messages are displayed

#### Scenario: AI chat empty state
- **GIVEN** the AI chat has no messages
- **WHEN** the user opens the AI chat
- **THEN** an empty state message is displayed
- **AND** the message suggests starting a conversation with the AI

#### Scenario: Send message in AI chat
- **GIVEN** the user has the AI chat conversation open
- **WHEN** the user types a message and sends it
- **THEN** the message appears in the conversation
- **AND** the message is sent to the backend
- **AND** no AI response appears (placeholder for future integration)

### Requirement: AI Chat Internationalization
The AI chat UI text SHALL support multiple languages.

#### Scenario: English AI chat translations
- **WHEN** the user's language is set to en-US
- **THEN** AI chat UI text displays in English
- **AND** translations include:
  - AI chat empty state message
  - AI chat placeholder text
  - Default AI name

#### Scenario: Dutch AI chat translations
- **WHEN** the user's language is set to nl-NL
- **THEN** AI chat UI text displays in Dutch
- **AND** translations include:
  - AI chat empty state message
  - AI chat placeholder text
  - Default AI name

### Requirement: AI Chat Test IDs
The AI chat components SHALL have data-testid attributes for E2E testing.

#### Scenario: AI chat list item has test ID
- **GIVEN** the AI chat is displayed in the chat list
- **THEN** the AI chat item has `data-testid="ai-chat-item"`

#### Scenario: AI chat conversation has test IDs
- **GIVEN** the AI chat conversation is open
- **THEN** the conversation view has `data-testid="ai-chat-conversation"`
- **AND** the message input has `data-testid="ai-chat-input"`
