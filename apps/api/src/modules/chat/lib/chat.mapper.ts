import type {
  Chat,
  ChatDTO,
  ChatWithPreviewDTO,
  LastMessagePreview,
} from "../domain/chat";
import type { Message } from "../domain/message";

/**
 * Converts a Chat entity to a ChatDTO for API responses
 * Converts all ObjectId fields to strings and Date to ISO8601 strings
 */
export function toChatDTO(chat: Chat): ChatDTO {
  return {
    _id: chat._id.toString(),
    type: chat.type,
    title: chat.title,
    createdBy: chat.createdBy.toString(),
    memberIds: chat.memberIds.map((id) => id.toString()),
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  };
}

/**
 * Converts a Message to a LastMessagePreview with truncated body
 * Truncates body to 100 characters if necessary
 */
export function toLastMessagePreview(message: Message): LastMessagePreview {
  const truncatedBody =
    message.body.length > 100 ? message.body.substring(0, 100) : message.body;

  return {
    _id: message._id.toString(),
    senderId: message.senderId.toString(),
    body: truncatedBody,
    createdAt: message.createdAt.toISOString(),
  };
}

/**
 * Converts a Chat with optional last message to ChatWithPreviewDTO
 * Includes unread count and last message preview
 */
export function toChatWithPreviewDTO(
  chat: Chat,
  lastMessage: Message | null,
  unreadCount: number,
): ChatWithPreviewDTO {
  return {
    ...toChatDTO(chat),
    lastMessage: lastMessage ? toLastMessagePreview(lastMessage) : undefined,
    unreadCount,
  };
}
