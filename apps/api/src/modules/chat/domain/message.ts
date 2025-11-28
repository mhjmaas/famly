import type { ObjectId } from "mongodb";

/**
 * Message entity - represents a single chat message
 */
export interface Message {
  _id: ObjectId;
  chatId: ObjectId; // Reference to the chat this message belongs to
  senderId: ObjectId | string; // User who sent the message, or AI_SENDER_ID for AI messages
  body: string; // Plain text + emoji content, max 100KB
  clientId?: string; // Client-supplied ID for idempotency (optional)
  createdAt: Date;
  editedAt?: Date; // Timestamp of last edit (future enhancement)
  deleted: boolean; // Soft-delete flag (future enhancement)
}

/**
 * Input DTO for creating a message
 */
export interface CreateMessageInput {
  chatId: string; // Chat ID in string format from API
  body: string; // Message body, 1-8000 chars
  clientId?: string; // Optional client-supplied ID for idempotency
}

/**
 * Output DTO for message API responses
 * All ObjectId fields are converted to strings
 */
export interface MessageDTO {
  _id: string;
  chatId: string;
  senderId: string;
  body: string;
  clientId?: string;
  createdAt: string;
  editedAt?: string;
  deleted: boolean;
}
