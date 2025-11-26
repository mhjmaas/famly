## ADDED Requirements

### Requirement: AI Chat Type
The system SHALL support an `"ai"` chat type for conversations with an AI assistant.

#### Scenario: AI chat type is valid
- **GIVEN** a chat creation request
- **WHEN** the type is `"ai"`
- **THEN** the system accepts the chat type as valid
- **AND** the chat is created with type `"ai"`

#### Scenario: AI chat has single member
- **GIVEN** an AI chat is created
- **WHEN** the chat is stored
- **THEN** the `memberIds` array contains only the creating user's ID
- **AND** no other members can be added to an AI chat

#### Scenario: AI chat title from settings
- **GIVEN** a family has `aiSettings.aiName` set to "Jarvis"
- **WHEN** an AI chat is created or displayed
- **THEN** the chat title is "Jarvis"
- **AND** the title updates if `aiName` changes in settings

### Requirement: AI Chat Auto-Creation
The system SHALL automatically create an AI chat for a user when they access the chat feature with `aiIntegration` enabled.

#### Scenario: Auto-create AI chat on first access
- **GIVEN** a user belongs to a family with `aiIntegration` enabled
- **AND** the user has no existing AI chat
- **WHEN** the user fetches their chat list
- **THEN** an AI chat is automatically created for the user
- **AND** the AI chat appears in the response

#### Scenario: Return existing AI chat
- **GIVEN** a user already has an AI chat
- **WHEN** the user fetches their chat list
- **THEN** the existing AI chat is returned
- **AND** no duplicate AI chat is created

#### Scenario: No AI chat when feature disabled
- **GIVEN** a user belongs to a family with `aiIntegration` disabled
- **WHEN** the user fetches their chat list
- **THEN** no AI chat is included in the response
- **AND** no AI chat is auto-created

### Requirement: AI Chat Messages
Messages sent to an AI chat SHALL be stored and retrieved like regular chat messages.

#### Scenario: Send message to AI chat
- **GIVEN** a user has an AI chat
- **WHEN** the user sends a message to the AI chat
- **THEN** the message is stored in the database
- **AND** the message appears in the chat history
- **AND** no AI response is generated (placeholder for future integration)

#### Scenario: Retrieve AI chat messages
- **GIVEN** an AI chat has messages
- **WHEN** the user fetches messages for the AI chat
- **THEN** all messages are returned in chronological order
- **AND** the response format matches regular chat messages

### Requirement: AI Chat Isolation
Each user SHALL have their own private AI chat that is not shared with other family members.

#### Scenario: AI chat is user-specific
- **GIVEN** two users in the same family with `aiIntegration` enabled
- **WHEN** each user accesses the chat feature
- **THEN** each user has their own separate AI chat
- **AND** messages in one user's AI chat are not visible to the other user

#### Scenario: AI chat not visible in other users' chat lists
- **GIVEN** UserA has an AI chat with messages
- **WHEN** UserB fetches their chat list
- **THEN** UserA's AI chat does not appear in UserB's list
