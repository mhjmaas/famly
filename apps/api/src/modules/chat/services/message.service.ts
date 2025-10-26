import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { ObjectId } from "mongodb";
import type { Message, MessageDTO } from "../domain/message";
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
   * @param senderId - The user sending the message
   * @param body - Message body (1-8000 chars)
   * @param clientId - Optional client-supplied ID for idempotency
   * @returns { message: MessageDTO, isNew: boolean }
   */
  async createMessage(
    chatId: ObjectId,
    senderId: ObjectId,
    body: string,
    clientId?: string,
  ): Promise<{ message: MessageDTO; isNew: boolean }> {
    try {
      logger.info("Creating message", {
        chatId: chatId.toString(),
        senderId: senderId.toString(),
        hasClientId: !!clientId,
      });

      let message: Message;
      let isNew = true;

      // If clientId provided, check for idempotency
      if (clientId) {
        const existing = await this.messageRepository.findByClientId(
          chatId,
          clientId,
        );
        if (existing) {
          logger.info("Message already exists, returning existing (idempotent)", {
            chatId: chatId.toString(),
            clientId,
            messageId: existing._id.toString(),
          });
          isNew = false;
          message = existing;
        } else {
          // Create new message
          message = await this.messageRepository.create(
            chatId,
            senderId,
            body,
            clientId,
          );
        }
      } else {
        // Create new message without clientId
        message = await this.messageRepository.create(
          chatId,
          senderId,
          body,
          undefined,
        );
      }

      // Only do post-creation logic if this is a new message
      if (isNew) {
        // Update chat's updatedAt timestamp
        await this.chatRepository.updateTimestamp(chatId);

        // Check if DM role promotion is needed
        // In DMs, both users become admin after 2 messages
        const messageCount = await this.messageRepository.countByChatId(chatId);
        if (messageCount === 2) {
          // Get the chat to verify type
          const chat = await this.chatRepository.findById(chatId);
          if (chat && chat.type === "dm") {
            // Get all memberships for the chat
            const memberships = await this.membershipRepository.findByChat(
              chatId,
            );

            // Update both members to admin role
            for (const membership of memberships) {
              await this.membershipRepository.updateRole(membership._id, "admin");
            }

            logger.info("DM role promotion: both users now admin", {
              chatId: chatId.toString(),
              memberCount: memberships.length,
            });
          }
        }
      }

      const dto = toMessageDTO(message);

      logger.info("Message created successfully", {
        chatId: chatId.toString(),
        messageId: message._id.toString(),
        isNew,
      });

      return { message: dto, isNew };
    } catch (error) {
      logger.error("Failed to create message", {
        chatId: chatId.toString(),
        senderId: senderId.toString(),
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
    chatId: ObjectId,
    userId: ObjectId,
    before?: ObjectId,
    limit: number = 50,
  ): Promise<{ messages: MessageDTO[]; nextCursor?: string }> {
    try {
      logger.info("Listing messages", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        before: before?.toString(),
        limit,
      });

      // Verify user is a member of the chat
      const membership = await this.membershipRepository.findByUserAndChat(
        userId,
        chatId,
      );
      if (!membership) {
        throw HttpError.forbidden("You are not a member of this chat");
      }

      // Query messages with pagination (limit + 1 to check if more exist)
      const messages = await this.messageRepository.findByChatId(
        chatId,
        before,
        limit + 1,
      );

      let nextCursor: string | undefined;
      let messagesToReturn = messages;

      if (messages.length > limit) {
        messagesToReturn = messages.slice(0, limit);
        nextCursor = messagesToReturn[messagesToReturn.length - 1]._id.toString();
      }

      const dtos = messagesToReturn.map(toMessageDTO);

      logger.info("Messages listed successfully", {
        chatId: chatId.toString(),
        count: dtos.length,
        hasMore: !!nextCursor,
      });

      return {
        messages: dtos,
        nextCursor,
      };
    } catch (error) {
      logger.error("Failed to list messages", {
        chatId: chatId.toString(),
        userId: userId.toString(),
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
    userId: ObjectId,
    query: string,
    chatId?: ObjectId,
    cursor?: ObjectId,
    limit: number = 20,
  ): Promise<{ messages: MessageDTO[]; nextCursor?: string }> {
    try {
      logger.info("Searching messages", {
        userId: userId.toString(),
        query,
        chatId: chatId?.toString(),
        limit,
      });

      let chatIds: ObjectId[];

      if (chatId) {
        // If specific chat provided, verify user is a member
        const membership = await this.membershipRepository.findByUserAndChat(
          userId,
          chatId,
        );
        if (!membership) {
          throw HttpError.forbidden("You are not a member of this chat");
        }
        chatIds = [chatId];
      } else {
        // Get all chats user is a member of
        const memberships = await this.membershipRepository.findByUser(userId);
        chatIds = memberships.map((m) => m.chatId);

        if (chatIds.length === 0) {
          logger.info("User has no chats to search", {
            userId: userId.toString(),
          });
          return { messages: [], nextCursor: undefined };
        }
      }

      // Search messages (limit + 1 to check if more exist)
      const results = await this.messageRepository.search(
        chatIds,
        query,
        cursor,
        limit + 1,
      );

      let nextCursor: string | undefined;
      let messagesToReturn = results;

      if (results.length > limit) {
        messagesToReturn = results.slice(0, limit);
        nextCursor = messagesToReturn[messagesToReturn.length - 1]._id.toString();
      }

      const dtos = messagesToReturn.map(toMessageDTO);

      logger.info("Message search completed", {
        userId: userId.toString(),
        resultCount: dtos.length,
        hasMore: !!nextCursor,
      });

      return {
        messages: dtos,
        nextCursor,
      };
    } catch (error) {
      logger.error("Failed to search messages", {
        userId: userId.toString(),
        query,
        error,
      });
      throw error;
    }
  }
}
