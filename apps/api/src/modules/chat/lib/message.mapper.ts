import type { Message, MessageDTO } from "../domain/message";

/**
 * Converts a Message entity to a MessageDTO for API responses
 * Converts all ObjectId fields to strings and Date to ISO8601 strings
 */
export function toMessageDTO(message: Message): MessageDTO {
  const dto: MessageDTO = {
    _id: message._id.toString(),
    chatId: message.chatId.toString(),
    senderId: message.senderId.toString(),
    body: message.body,
    deleted: message.deleted,
    createdAt: message.createdAt.toISOString(),
  };

  // Include optional fields if they exist
  if (message.clientId !== undefined) {
    dto.clientId = message.clientId;
  }

  if (message.editedAt !== undefined) {
    dto.editedAt = message.editedAt.toISOString();
  }

  return dto;
}
