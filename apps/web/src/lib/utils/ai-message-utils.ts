import type { UIMessage } from "ai";
import type { MessageDTO } from "@/types/api.types";

/**
 * Special sender ID used for AI-generated messages.
 * This allows us to identify AI messages in regular chats (e.g., @mentions).
 */
export const AI_SENDER_ID = "ai-assistant";

/**
 * Convert a MessageDTO (Redux/API format) to UIMessage (AI SDK format).
 * Used when initializing useChat with messages from Redux.
 *
 * Note: We store createdAt in metadata since UIMessage doesn't have a createdAt field.
 */
export function toUIMessage(
  message: MessageDTO,
): UIMessage<{ createdAt: string }> {
  const isAIMessage = message.senderId === AI_SENDER_ID;

  return {
    id: message._id,
    role: isAIMessage ? "assistant" : "user",
    parts: [{ type: "text" as const, text: message.body }],
    metadata: { createdAt: message.createdAt },
  };
}

/**
 * Convert an array of MessageDTO to UIMessage array.
 * Messages are sorted by createdAt ascending (oldest first) for the AI SDK.
 */
export function toUIMessages(
  messages: MessageDTO[],
): UIMessage<{ createdAt: string }>[] {
  return [...messages]
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
    .map(toUIMessage);
}

/**
 * Convert a UIMessage (AI SDK format) to MessageDTO (Redux/API format).
 * Used when syncing AI SDK messages back to Redux.
 */
export function toMessageDTO(
  message: UIMessage<{ createdAt?: string }>,
  chatId: string,
  currentUserId: string,
): MessageDTO {
  // Extract text from message parts
  const body = message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("");

  const createdAt = message.metadata?.createdAt ?? new Date().toISOString();

  return {
    _id: message.id,
    chatId,
    senderId: message.role === "user" ? currentUserId : AI_SENDER_ID,
    body,
    createdAt,
    deleted: false,
  };
}

/**
 * Convert an array of UIMessage to MessageDTO array.
 */
export function toMessageDTOs(
  messages: UIMessage<{ createdAt?: string }>[],
  chatId: string,
  currentUserId: string,
): MessageDTO[] {
  return messages.map((m) => toMessageDTO(m, chatId, currentUserId));
}

/**
 * Check if a message is from the AI assistant.
 */
export function isAIMessage(message: MessageDTO): boolean {
  return message.senderId === AI_SENDER_ID;
}
