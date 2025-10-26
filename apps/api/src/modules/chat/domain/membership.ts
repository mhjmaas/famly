import type { ObjectId } from "mongodb";

/**
 * Chat membership role enum
 * Defines the allowed roles for chat memberships
 */
export type ChatMembershipRole = "admin" | "member";

/**
 * Membership entity - links users to chats with roles and read state
 */
export interface Membership {
  _id: ObjectId;
  chatId: ObjectId; // Reference to the chat
  userId: ObjectId; // Reference to the user
  role: ChatMembershipRole; // 'admin' for creators and group admins, 'member' for regular members
  lastReadMessageId?: ObjectId; // Cursor tracking last read message (optional)
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Output DTO for membership API responses
 * All ObjectId fields are converted to strings
 */
export interface MembershipDTO {
  _id: string;
  chatId: string;
  userId: string;
  role: ChatMembershipRole;
  lastReadMessageId?: string;
  createdAt: string;
  updatedAt: string;
}
