import type { ObjectId } from "mongodb";

/**
 * Chat type enum
 * Defines the type of chat
 * - dm: Direct message between two users
 * - group: Group chat with multiple members
 * - ai: AI assistant chat (single user, auto-created when aiIntegration is enabled)
 */
export type ChatType = "dm" | "group" | "ai";

/**
 * Chat entity - represents a chat container
 */
export interface Chat {
  _id: ObjectId;
  type: ChatType; // 'dm' for direct messages, 'group' for group chats
  title: string | null; // Required for groups, null for DMs
  createdBy: ObjectId; // User who created the chat
  memberIds: ObjectId[]; // Array of member IDs in the chat (denormalized for quick access)
  memberIdsHash?: string; // Hash of sorted memberIds for DM deduplication (used for unique index on DMs)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input DTO for creating a chat
 */
export interface CreateChatInput {
  type: ChatType;
  memberIds: string[]; // Array of user IDs to add to chat (in string format from API)
  title?: string | null; // Optional title for group chats
}

/**
 * Output DTO for chat API responses
 * All ObjectId fields are converted to strings
 */
export interface ChatDTO {
  _id: string;
  type: ChatType;
  title: string | null;
  createdBy: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Last message preview for chat listing
 */
export interface LastMessagePreview {
  _id: string;
  senderId: string;
  body: string; // Truncated to 100 characters
  createdAt: string;
}

/**
 * Chat with preview for listing (includes last message and unread count)
 */
export interface ChatWithPreviewDTO extends ChatDTO {
  lastMessage?: LastMessagePreview;
  unreadCount: number;
}

/**
 * Response DTO for listing chats with pagination
 */
export interface ListChatsResponse {
  chats: ChatWithPreviewDTO[];
  nextCursor?: string;
}
