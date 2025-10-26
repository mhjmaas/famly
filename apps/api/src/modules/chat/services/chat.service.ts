import { logger } from "@lib/logger";
import { type ObjectId } from "mongodb";
import type { Chat, ChatWithPreviewDTO, ListChatsResponse } from "../domain/chat";
import type { ChatRepository } from "../repositories/chat.repository";
import type { MembershipRepository } from "../repositories/membership.repository";
import type { MessageRepository } from "../repositories/message.repository";
import { toChatWithPreviewDTO } from "../lib/chat.mapper";

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private membershipRepository: MembershipRepository,
    private messageRepository?: MessageRepository,
  ) {}

  /**
   * Create a DM chat between two users with deduplication
   * If a DM already exists between the two users, returns the existing chat
   *
   * Deduplication works by:
   * 1. Sorting member IDs consistently
   * 2. Generating a hash of the sorted IDs
   * 3. Using a unique sparse index on (type, memberIdsHash) to prevent duplicates
   *
   * @param creatorId - The user creating the DM
   * @param otherUserId - The other user in the DM
   * @returns Object with chat and isNew flag
   */
  async createDM(
    creatorId: ObjectId,
    otherUserId: ObjectId,
  ): Promise<{ chat: Chat; isNew: boolean }> {
    try {
      logger.info("Creating DM", {
        creatorId: creatorId.toString(),
        otherUserId: otherUserId.toString(),
      });

      // Sort IDs to ensure consistent ordering for queries and hashing
      const sortedIds = [creatorId, otherUserId].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );

      // Check if DM already exists between these two users
      const existingChat = await this.chatRepository.findByMemberIds(sortedIds);

      if (existingChat) {
        logger.info("DM already exists, returning existing chat", {
          chatId: existingChat._id.toString(),
          creatorId: creatorId.toString(),
          otherUserId: otherUserId.toString(),
        });
        return { chat: existingChat, isNew: false };
      }

      // Create new DM chat with sorted memberIds
      const chat = await this.chatRepository.create(
        "dm",
        creatorId,
        sortedIds,
        null // title is null for DMs
      );

      // Create memberships for both users
      await this.membershipRepository.createBulk(chat._id, [
        { userId: creatorId, role: "member" },
        { userId: otherUserId, role: "member" },
      ]);

      logger.info("DM created successfully", {
        chatId: chat._id.toString(),
        creatorId: creatorId.toString(),
        otherUserId: otherUserId.toString(),
      });

      return { chat, isNew: true };
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000)
      // This can happen in a race condition where two requests create the same DM simultaneously
      if (error instanceof Error && error.message.includes("E11000")) {
        logger.info("DM creation race condition detected, fetching existing chat", {
          creatorId: creatorId.toString(),
          otherUserId: otherUserId.toString(),
        });

        // Retry fetching the existing chat
        const sortedIds = [creatorId, otherUserId].sort((a, b) =>
          a.toString().localeCompare(b.toString())
        );
        const existingChat = await this.chatRepository.findByMemberIds(sortedIds);

        if (existingChat) {
          logger.info("Found existing DM after race condition", {
            chatId: existingChat._id.toString(),
            creatorId: creatorId.toString(),
            otherUserId: otherUserId.toString(),
          });
          return { chat: existingChat, isNew: false };
        }

        logger.error("Failed to find existing DM after E11000 error", {
          creatorId: creatorId.toString(),
          otherUserId: otherUserId.toString(),
        });
      }

      logger.error("Failed to create DM", {
        creatorId: creatorId.toString(),
        otherUserId: otherUserId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Create a group chat with multiple members
   *
   * @param creatorId - The user creating the group
   * @param memberIds - Array of other user IDs to add to the group
   * @param title - Optional title for the group
   * @returns The created chat
   */
  async createGroup(
    creatorId: ObjectId,
    memberIds: ObjectId[],
    title?: string | null,
  ): Promise<Chat> {
    try {
      logger.info("Creating group chat", {
        creatorId: creatorId.toString(),
        memberCount: memberIds.length + 1,
        title,
      });

      // Create group chat with creator + other members
      const allMemberIds = [creatorId, ...memberIds];
      const chat = await this.chatRepository.create(
        "group",
        creatorId,
        allMemberIds,
        title ?? null
      );

      // Create memberships: creator as admin, others as members
      await this.membershipRepository.createBulk(chat._id, [
        { userId: creatorId, role: "admin" },
        ...memberIds.map((userId) => ({ userId, role: "member" as const })),
      ]);

      logger.info("Group chat created successfully", {
        chatId: chat._id.toString(),
        creatorId: creatorId.toString(),
        memberCount: allMemberIds.length,
        title,
      });

      return chat;
    } catch (error) {
      logger.error("Failed to create group chat", {
        creatorId: creatorId.toString(),
        memberCount: memberIds.length + 1,
        title,
        error,
      });
      throw error;
    }
  }

  /**
   * List all chats for a user with pagination and last message preview
   *
   * Algorithm:
   * 1. Get all memberships for the user
   * 2. Extract chatIds from memberships
   * 3. Query chats with pagination (sorted by updatedAt descending)
   * 4. For each chat:
   *    - Fetch last message (1 message, sorted by createdAt desc)
   *    - Get membership to check lastReadMessageId
   *    - Calculate unread count (messages after lastReadMessageId)
   * 5. Build response with nextCursor if more results exist
   *
   * @param userId - The authenticated user ID
   * @param cursor - Optional pagination cursor (chat _id)
   * @param limit - Maximum number of chats to return (default 20, max 100)
   * @returns ListChatsResponse with chats and optional nextCursor
   */
  async listUserChats(
    userId: ObjectId,
    cursor?: ObjectId,
    limit: number = 20,
  ): Promise<ListChatsResponse> {
    try {
      if (!this.messageRepository) {
        throw new Error("MessageRepository not initialized in ChatService");
      }

      logger.info("Listing user chats", {
        userId: userId.toString(),
        cursor: cursor?.toString(),
        limit,
      });

      // Step 1: Get all memberships for the user
      const memberships = await this.membershipRepository.findByUser(userId);

      if (memberships.length === 0) {
        logger.info("User has no chats", { userId: userId.toString() });
        return { chats: [], nextCursor: undefined };
      }

      // Step 2: Extract chatIds from memberships
      const chatIds = memberships.map((m) => m.chatId);

      // Step 3: Query chats with pagination
      const chats = await this.chatRepository.findByIdsWithPagination(chatIds, cursor, limit + 1);

      // Determine if there's a next page
      let nextCursor: string | undefined;
      let chatsToReturn = chats;

      if (chats.length > limit) {
        chatsToReturn = chats.slice(0, limit);
        nextCursor = chatsToReturn[chatsToReturn.length - 1]._id.toString();
      }

      // Step 4: Build ChatWithPreviewDTO for each chat
      const chatDTOs: ChatWithPreviewDTO[] = [];

      for (const chat of chatsToReturn) {
        try {
          // Fetch last message (newest first)
          const messages = await this.messageRepository.findByChatId(chat._id, undefined, 1);
          const lastMessage = messages.length > 0 ? messages[0] : null;

          // Get user's membership for this chat
          const membership = memberships.find((m) => m.chatId.equals(chat._id));

          // Calculate unread count
          let unreadCount = 0;
          if (membership) {
            if (!membership.lastReadMessageId) {
              // No messages read yet, count all messages in chat
              unreadCount = await this.messageRepository.countByChatId(chat._id);
            } else {
              // Count messages after lastReadMessageId
              unreadCount = await this.messageRepository.countUnreadMessages(
                chat._id,
                membership.lastReadMessageId,
              );
            }
          }

          // Build DTO
          const chatDTO = toChatWithPreviewDTO(chat, lastMessage, unreadCount);
          chatDTOs.push(chatDTO);
        } catch (error) {
          logger.error("Failed to build chat preview", {
            chatId: chat._id.toString(),
            userId: userId.toString(),
            error,
          });
          throw error;
        }
      }

      // Step 5: Return response
      const response: ListChatsResponse = {
        chats: chatDTOs,
        nextCursor,
      };

      logger.info("User chats listed successfully", {
        userId: userId.toString(),
        chatCount: chatDTOs.length,
        hasMore: !!nextCursor,
      });

      return response;
    } catch (error) {
      logger.error("Failed to list user chats", {
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Get a single chat by ID with membership verification
   *
   * @param chatId - The chat ID
   * @param userId - The authenticated user ID (for membership check)
   * @returns The chat DTO
   * @throws HttpError(403) if user is not a member
   * @throws HttpError(404) if chat not found
   */
  async getChatById(chatId: ObjectId, userId: ObjectId): Promise<Chat | null> {
    try {
      logger.info("Getting chat by ID", {
        chatId: chatId.toString(),
        userId: userId.toString(),
      });

      // Verify membership
      const membership = await this.membershipRepository.findByUserAndChat(userId, chatId);
      if (!membership) {
        logger.warn("User attempted to access chat without membership", {
          chatId: chatId.toString(),
          userId: userId.toString(),
        });
        return null; // Let route handler convert to 403
      }

      // Fetch chat
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        logger.warn("Chat not found", {
          chatId: chatId.toString(),
        });
        return null; // Let route handler convert to 404
      }

      logger.info("Chat retrieved successfully", {
        chatId: chatId.toString(),
        userId: userId.toString(),
      });

      return chat;
    } catch (error) {
      logger.error("Failed to get chat", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }
}
