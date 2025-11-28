import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import { getUserName } from "@lib/user-utils";
import {
  createChatMessageNotification,
  sendChatNotifications,
} from "@modules/notifications";
import type { Message, MessageDTO } from "../domain/message";
import { isAISenderId } from "../lib/constants";
import { toMessageDTO } from "../lib/message.mapper";
import type { ChatRepository } from "../repositories/chat.repository";
import type { MembershipRepository } from "../repositories/membership.repository";
import type { MessageRepository } from "../repositories/message.repository";

export class MessageService {
  constructor(
    private messageRepository: MessageRepository,
    private membershipRepository: MembershipRepository,
    private chatRepository: ChatRepository,
  ) {}

  /**
   * Create a new message with idempotency support
   *
   * If clientId is provided:
   * - Checks if a message with (chatId, clientId) already exists
   * - If exists, returns the existing message (idempotent!)
   * - If not, creates a new message
   *
   * After creating a message:
   * - Updates chat's updatedAt timestamp
   * - Checks if DM promotion is needed (2+ messages in DM)
   * - If promotion needed, updates both memberships to role='admin'
   *
   * @param chatId - The chat ID
   * @param senderId - The user sending the message, or AI_SENDER_ID for AI messages
   * @param body - Message body (max 100KB)
   * @param clientId - Optional client-supplied ID for idempotency
   * @returns { message: MessageDTO, isNew: boolean }
   */
  async createMessage(
    chatId: string,
    senderId: string,
    body: string,
    clientId?: string,
  ): Promise<{ message: MessageDTO; isNew: boolean }> {
    let normalizedChatId: ObjectIdString | undefined;
    const isAIMessage = isAISenderId(senderId);
    try {
      normalizedChatId = validateObjectId(chatId, "chatId");
      const chatObjectId = toObjectId(normalizedChatId, "chatId");
      // For AI messages, use the string directly; for user messages, convert to ObjectId
      const senderIdForDb = isAIMessage
        ? senderId
        : toObjectId(validateObjectId(senderId, "senderId"), "senderId");

      logger.info("Creating message", {
        chatId: normalizedChatId,
        senderId,
        isAIMessage,
        hasClientId: !!clientId,
      });

      let message: Message;
      let isNew = true;

      // If clientId provided, check for idempotency
      if (clientId) {
        const existing = await this.messageRepository.findByClientId(
          chatObjectId,
          clientId,
        );
        if (existing) {
          logger.info(
            "Message already exists, returning existing (idempotent)",
            {
              chatId: normalizedChatId,
              clientId,
              messageId: existing._id.toString(),
            },
          );
          isNew = false;
          message = existing;
        } else {
          // Create new message
          message = await this.messageRepository.create(
            chatObjectId,
            senderIdForDb,
            body,
            clientId,
          );
        }
      } else {
        // Create new message without clientId
        message = await this.messageRepository.create(
          chatObjectId,
          senderIdForDb,
          body,
          undefined,
        );
      }

      // Only do post-creation logic if this is a new message
      if (isNew) {
        // Update chat's updatedAt timestamp
        await this.chatRepository.updateTimestamp(chatObjectId);

        // Check if DM role promotion is needed
        // In DMs, both users become admin after 2 messages
        const messageCount =
          await this.messageRepository.countByChatId(chatObjectId);
        if (messageCount === 2) {
          // Get the chat to verify type
          const chat = await this.chatRepository.findById(chatObjectId);
          if (chat && chat.type === "dm") {
            // Get all memberships for the chat
            const memberships =
              await this.membershipRepository.findByChat(chatObjectId);

            // Update both members to admin role
            for (const membership of memberships) {
              await this.membershipRepository.updateRole(
                membership._id,
                "admin",
              );
            }

            logger.info("DM role promotion: both users now admin", {
              chatId: normalizedChatId,
              memberCount: memberships.length,
            });
          }
        }

        // Send notifications to other chat members (skip for AI messages)
        if (!isAIMessage) {
          await this.notifyChatMembers(
            chatObjectId,
            normalizedChatId,
            senderId,
            senderIdForDb as ReturnType<typeof toObjectId>,
            body,
          );
        }
      }

      const dto = toMessageDTO(message);

      logger.info("Message created successfully", {
        chatId: normalizedChatId,
        messageId: message._id.toString(),
        isNew,
      });

      return { message: dto, isNew };
    } catch (error) {
      logger.error("Failed to create message", {
        chatId: normalizedChatId ?? chatId,
        senderId,
        error,
      });
      throw error;
    }
  }

  /**
   * List messages for a chat with cursor pagination
   *
   * @param chatId - The chat ID
   * @param userId - The authenticated user ID (for membership verification)
   * @param before - Optional cursor (message ID) for pagination
   * @param limit - Maximum messages to return (default 50, max 200)
   * @returns { messages: MessageDTO[], nextCursor?: string }
   */
  async listMessages(
    chatId: string,
    userId: string,
    before?: string,
    limit: number = 50,
  ): Promise<{ messages: MessageDTO[]; nextCursor?: string }> {
    let normalizedChatId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedChatId = validateObjectId(chatId, "chatId");
      normalizedUserId = validateObjectId(userId, "userId");
      const chatObjectId = toObjectId(normalizedChatId, "chatId");
      const userObjectId = toObjectId(normalizedUserId, "userId");
      const beforeObjectId = before
        ? toObjectId(validateObjectId(before, "before"), "before")
        : undefined;

      logger.info("Listing messages", {
        chatId: normalizedChatId,
        userId: normalizedUserId,
        before: beforeObjectId?.toString(),
        limit,
      });

      // Verify user is a member of the chat
      const membership = await this.membershipRepository.findByUserAndChat(
        userObjectId,
        chatObjectId,
      );
      if (!membership) {
        throw HttpError.forbidden("You are not a member of this chat");
      }

      // Query messages with pagination (limit + 1 to check if more exist)
      const messages = await this.messageRepository.findByChatId(
        chatObjectId,
        beforeObjectId,
        limit + 1,
      );

      let nextCursor: string | undefined;
      let messagesToReturn = messages;

      if (messages.length > limit) {
        messagesToReturn = messages.slice(0, limit);
        nextCursor =
          messagesToReturn[messagesToReturn.length - 1]._id.toString();
      }

      const dtos = messagesToReturn.map(toMessageDTO);

      logger.info("Messages listed successfully", {
        chatId: normalizedChatId,
        count: dtos.length,
        hasMore: !!nextCursor,
      });

      return {
        messages: dtos,
        nextCursor,
      };
    } catch (error) {
      logger.error("Failed to list messages", {
        chatId: normalizedChatId ?? chatId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Search messages across user's chats
   *
   * @param userId - The authenticated user ID
   * @param query - Search query string
   * @param chatId - Optional chat ID to limit search to one chat
   * @param cursor - Optional pagination cursor (message ID)
   * @param limit - Maximum results (default 20, max 100)
   * @returns { messages: MessageDTO[], nextCursor?: string }
   */
  async searchMessages(
    userId: string,
    query: string,
    chatId?: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<{ messages: MessageDTO[]; nextCursor?: string }> {
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedUserId = validateObjectId(userId, "userId");
      const userObjectId = toObjectId(normalizedUserId, "userId");
      const chatObjectId = chatId
        ? toObjectId(validateObjectId(chatId, "chatId"), "chatId")
        : undefined;
      const cursorObjectId = cursor
        ? toObjectId(validateObjectId(cursor, "cursor"), "cursor")
        : undefined;

      logger.info("Searching messages", {
        userId: normalizedUserId,
        query,
        chatId: chatObjectId?.toString(),
        limit,
      });

      let chatIds: ReturnType<typeof toObjectId>[];

      if (chatId) {
        if (!chatObjectId) {
          throw HttpError.badRequest("Invalid chatId format");
        }
        // If specific chat provided, verify user is a member
        const membership = await this.membershipRepository.findByUserAndChat(
          userObjectId,
          chatObjectId,
        );
        if (!membership) {
          throw HttpError.forbidden("You are not a member of this chat");
        }
        chatIds = [chatObjectId];
      } else {
        // Get all chats user is a member of
        const memberships =
          await this.membershipRepository.findByUser(userObjectId);
        chatIds = memberships.map((m) => m.chatId);

        if (chatIds.length === 0) {
          logger.info("User has no chats to search", {
            userId: normalizedUserId,
          });
          return { messages: [], nextCursor: undefined };
        }
      }

      // Search messages (limit + 1 to check if more exist)
      const results = await this.messageRepository.search(
        chatIds,
        query,
        cursorObjectId,
        limit + 1,
      );

      let nextCursor: string | undefined;
      let messagesToReturn = results;

      if (results.length > limit) {
        messagesToReturn = results.slice(0, limit);
        nextCursor =
          messagesToReturn[messagesToReturn.length - 1]._id.toString();
      }

      const dtos = messagesToReturn.map(toMessageDTO);

      logger.info("Message search completed", {
        userId: normalizedUserId,
        resultCount: dtos.length,
        hasMore: !!nextCursor,
      });

      return {
        messages: dtos,
        nextCursor,
      };
    } catch (error) {
      logger.error("Failed to search messages", {
        userId: normalizedUserId ?? userId,
        query,
        error,
      });
      throw error;
    }
  }

  /**
   * Clear all messages in a chat
   * Only allowed for AI chats and only by chat members
   *
   * @param chatId - The chat ID
   * @param userId - The authenticated user ID (for membership verification)
   * @returns { deletedCount: number }
   */
  async clearMessages(
    chatId: string,
    userId: string,
  ): Promise<{ deletedCount: number }> {
    let normalizedChatId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedChatId = validateObjectId(chatId, "chatId");
      normalizedUserId = validateObjectId(userId, "userId");
      const chatObjectId = toObjectId(normalizedChatId, "chatId");
      const userObjectId = toObjectId(normalizedUserId, "userId");

      logger.info("Clearing messages", {
        chatId: normalizedChatId,
        userId: normalizedUserId,
      });

      // Verify user is a member of the chat
      const membership = await this.membershipRepository.findByUserAndChat(
        userObjectId,
        chatObjectId,
      );
      if (!membership) {
        throw HttpError.forbidden("You are not a member of this chat");
      }

      // Verify this is an AI chat
      const chat = await this.chatRepository.findById(chatObjectId);
      if (!chat) {
        throw HttpError.notFound("Chat not found");
      }
      if (chat.type !== "ai") {
        throw HttpError.forbidden("Can only clear messages in AI chats");
      }

      // Delete all messages in the chat
      const deletedCount =
        await this.messageRepository.deleteByChatId(chatObjectId);

      logger.info("Messages cleared successfully", {
        chatId: normalizedChatId,
        deletedCount,
      });

      return { deletedCount };
    } catch (error) {
      logger.error("Failed to clear messages", {
        chatId: normalizedChatId ?? chatId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Send chat message notifications to all members except the sender
   * @private
   */
  private async notifyChatMembers(
    chatObjectId: ReturnType<typeof toObjectId>,
    normalizedChatId: ObjectIdString,
    senderId: string,
    senderObjectId: ReturnType<typeof toObjectId>,
    body: string,
  ): Promise<void> {
    try {
      const memberships =
        await this.membershipRepository.findByChat(chatObjectId);

      if (memberships.length === 0) {
        return;
      }

      const senderName = await getUserName(senderObjectId);

      // Create notification with message preview (limit to 100 chars)
      const messagePreview =
        body.length > 100 ? `${body.substring(0, 100)}...` : body;

      // Send to all members except the sender
      const memberIds = memberships.map((m) => m.userId.toString());
      await sendChatNotifications(
        memberIds,
        senderId,
        (locale) =>
          createChatMessageNotification(
            locale,
            senderName,
            messagePreview,
            normalizedChatId,
          ),
        {
          chatId: normalizedChatId,
        },
      );
    } catch (error) {
      logger.error("Failed to send chat message notifications", {
        chatId: normalizedChatId,
        senderId,
        error,
      });
      // Don't throw - notification failure shouldn't prevent message creation
    }
  }
}
