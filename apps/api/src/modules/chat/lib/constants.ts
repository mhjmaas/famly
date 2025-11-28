/**
 * Special sender ID used for AI-generated messages.
 * This allows us to identify AI messages in regular chats (e.g., @mentions).
 */
export const AI_SENDER_ID = "ai-assistant";

/**
 * Check if a sender ID is the AI assistant.
 */
export function isAISenderId(senderId: string): boolean {
  return senderId === AI_SENDER_ID;
}
