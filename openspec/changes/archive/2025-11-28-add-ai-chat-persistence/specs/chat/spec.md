# chat Specification Delta

## MODIFIED Requirements

### Requirement: AI Chat Messages
Messages sent to an AI chat SHALL be stored and retrieved like regular chat messages, including messages from the AI assistant.

#### Scenario: Send message to AI chat
- **GIVEN** a user has an AI chat
- **WHEN** the user sends a message to the AI chat
- **THEN** the message is stored in the database
- **AND** the message appears in the chat history

#### Scenario: Store AI assistant response
- **GIVEN** a user has sent a message to an AI chat
- **WHEN** the AI assistant generates a response
- **THEN** the response is stored as a message with `senderId: "ai-assistant"`
- **AND** the message appears in the chat history
- **AND** the message is retrievable via the messages API

#### Scenario: Retrieve AI chat messages
- **GIVEN** an AI chat has messages from both user and AI assistant
- **WHEN** the user fetches messages for the AI chat
- **THEN** all messages are returned in chronological order
- **AND** the response format matches regular chat messages
- **AND** AI assistant messages have `senderId: "ai-assistant"`

## ADDED Requirements

### Requirement: AI Sender ID Support
The system SHALL accept a reserved sender ID `"ai-assistant"` for messages created by the AI assistant.

#### Scenario: Create message with AI sender ID
- **GIVEN** an authenticated user who is a member of a chat
- **WHEN** they POST to `/v1/chats/{chatId}/messages` with `{ body: "AI response", senderId: "ai-assistant", clientId: "uuid" }`
- **THEN** the API responds with HTTP 201 and the created message
- **AND** the message is stored with `senderId: "ai-assistant"`
- **AND** no ObjectId validation is performed on the sender ID

#### Scenario: AI sender ID in realtime events
- **GIVEN** a message is created with `senderId: "ai-assistant"`
- **WHEN** the `message:new` event is broadcast
- **THEN** the message payload includes `senderId: "ai-assistant"`
- **AND** clients can identify the message as AI-generated

#### Scenario: Reject AI sender ID from non-member
- **GIVEN** an unauthenticated request or non-member user
- **WHEN** they attempt to POST a message with `senderId: "ai-assistant"`
- **THEN** the API responds with HTTP 401 or 403
- **AND** no message is created

### Requirement: AI Mention in DM and Group Chats
Users SHALL be able to mention the AI assistant in DM and Group chats to invoke AI responses within the conversation context.

#### Scenario: Detect AI mention in message
- **GIVEN** a user is composing a message in a DM or Group chat
- **AND** the family has `aiIntegration` enabled with `aiName: "Jarvis"`
- **WHEN** the user types `@Jarvis what should we have for dinner?`
- **THEN** the system detects the AI mention pattern
- **AND** the mention is identified as an AI invocation request

#### Scenario: AI responds to mention in DM
- **GIVEN** a DM chat between UserA and UserB
- **AND** UserA sends a message containing `@Jarvis suggest a movie`
- **WHEN** the message is sent
- **THEN** UserA's message is stored in the database
- **AND** the AI is invoked with the last 20 messages as context
- **AND** the AI response is stored as a new message with `senderId: "ai-assistant"`
- **AND** both UserA and UserB see the AI response in the chat

#### Scenario: AI responds to mention in Group chat
- **GIVEN** a Group chat with UserA, UserB, and UserC
- **AND** UserA sends a message containing `@Jarvis plan our weekend`
- **WHEN** the message is sent
- **THEN** UserA's message is stored in the database
- **AND** the AI is invoked with the last 20 messages as context
- **AND** the AI response is stored as a new message with `senderId: "ai-assistant"`
- **AND** all group members see the AI response in the chat

#### Scenario: AI mention not available when feature disabled
- **GIVEN** a family has `aiIntegration` disabled
- **WHEN** a user types `@Jarvis` in a DM or Group chat
- **THEN** no AI invocation occurs
- **AND** the message is sent as a regular text message

#### Scenario: AI mention only in DM and Group chats
- **GIVEN** a user is in their dedicated AI chat
- **WHEN** the user types `@Jarvis` in the message
- **THEN** no special mention handling occurs
- **AND** the message is processed as a normal AI chat message
