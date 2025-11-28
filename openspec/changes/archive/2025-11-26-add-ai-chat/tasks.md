## 1. Backend - Chat Type Extension
- [x] 1.1 Add `"ai"` to ChatType enum in shared package
- [x] 1.2 Update chat validators to accept `"ai"` type
- [x] 1.3 Add AI chat creation endpoint or auto-creation logic
- [x] 1.4 Ensure AI chat messages are stored like regular messages
- [x] 1.5 Write unit tests for AI chat type validation

## 2. Backend - AI Chat Retrieval
- [x] 2.1 Update list chats endpoint to include AI chat when aiIntegration is enabled
- [x] 2.2 Add logic to auto-create AI chat for family if it doesn't exist
- [x] 2.3 Write e2e tests for AI chat listing behavior

## 3. Frontend - Chat List Updates
- [x] 3.1 Update ChatList component to display AI chat at top when enabled
- [x] 3.2 Add visual distinction for AI chat item (icon, styling)
- [x] 3.3 Add translations for AI chat labels
- [x] 3.4 Write unit tests for AI chat display logic

## 4. Frontend - Conversation View
- [x] 4.1 Ensure ConversationView works with AI chat type
- [x] 4.2 Add AI-specific empty state message
- [x] 4.3 Update message input placeholder for AI chat context

## 5. Integration Testing
- [x] 5.1 Write e2e tests for AI chat feature toggle behavior
- [x] 5.2 Test AI chat visibility when aiIntegration is enabled/disabled
- [x] 5.3 Test message sending to AI chat
