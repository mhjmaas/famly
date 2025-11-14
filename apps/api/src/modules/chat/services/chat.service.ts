import { logger } from "@lib/logger";
import {
  type ObjectIdString,
  toObjectId,
  toObjectIdArray,
  validateObjectId,
  validateObjectIdArray,
} from "@lib/objectid-utils";
import type {
  Chat,
  ChatWithPreviewDTO,
  ListChatsResponse,
} from "../domain/chat";
import { toChatWithPreviewDTO } from "../lib/chat.mapper";
import type { ChatRepository } from "../repositories/chat.repository";
import type { MembershipRepository } from "../repositories/membership.repository";
import type { MessageRepository } from "../repositories/message.repository";

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
    creatorId: string,
    otherUserId: string,
  ): Promise<{ chat: Chat; isNew: boolean }> {
    let normalizedCreatorId: ObjectIdString | undefined;
    let normalizedOtherUserId: ObjectIdString | undefined;
    try {
      normalizedCreatorId = validateObjectId(creatorId, "creatorId");
      normalizedOtherUserId = validateObjectId(otherUserId, "otherUserId");

      logger.info("Creating DM", {
        creatorId: normalizedCreatorId,
        otherUserId: normalizedOtherUserId,
      });

      // Sort IDs to ensure consistent ordering for queries and hashing
      const sortedMemberIds = [normalizedCreatorId, normalizedOtherUserId].sort(
        (a, b) => a.localeCompare(b),
      );
      const sortedIds = toObjectIdArray(sortedMemberIds, "memberIds");
      const creatorObjectId = toObjectId(normalizedCreatorId, "creatorId");
      const otherUserObjectId = toObjectId(
        normalizedOtherUserId,
        "otherUserId",
      );

      // Check if DM already exists between these two users
      const existingChat = await this.chatRepository.findByMemberIds(sortedIds);

      if (existingChat) {
        logger.info("DM already exists, returning existing chat", {
          chatId: existingChat._id.toString(),
          creatorId: normalizedCreatorId,
          otherUserId: normalizedOtherUserId,
        });
        return { chat: existingChat, isNew: false };
      }

      // Create new DM chat with sorted memberIds
      const chat = await this.chatRepository.create(
        "dm",
        creatorObjectId,
        sortedIds,
        null, // title is null for DMs
      );

      // Create memberships for both users
      await this.membershipRepository.createBulk(chat._id, [
        { userId: creatorObjectId, role: "member" },
        { userId: otherUserObjectId, role: "member" },
      ]);

      logger.info("DM created successfully", {
        chatId: chat._id.toString(),
        creatorId: normalizedCreatorId,
        otherUserId: normalizedOtherUserId,
      });

      return { chat, isNew: true };
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000)
      // This can happen in a race condition where two requests create the same DM simultaneously
      if (error instanceof Error && error.message.includes("E11000")) {
        logger.info(
          "DM creation race condition detected, fetching existing chat",
          {
            creatorId: normalizedCreatorId,
            otherUserId: normalizedOtherUserId,
          },
        );

        // Retry fetching the existing chat
        const retrySortedIds = [
          normalizedCreatorId ?? creatorId,
          normalizedOtherUserId ?? otherUserId,
        ].sort((a, b) => a.localeCompare(b));
        const existingChat = await this.chatRepository.findByMemberIds(
          toObjectIdArray(retrySortedIds, "memberIds"),
        );

        if (existingChat) {
          logger.info("Found existing DM after race condition", {
            chatId: existingChat._id.toString(),
            creatorId: normalizedCreatorId,
            otherUserId: normalizedOtherUserId,
          });
          return { chat: existingChat, isNew: false };
        }

        logger.error("Failed to find existing DM after E11000 error", {
          creatorId: normalizedCreatorId ?? creatorId,
          otherUserId: normalizedOtherUserId ?? otherUserId,
        });
      }

      logger.error("Failed to create DM", {
        creatorId: normalizedCreatorId ?? creatorId,
        otherUserId: normalizedOtherUserId ?? otherUserId,
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
    creatorId: string,
    memberIds: string[],
    title?: string | null,
  ): Promise<Chat> {
    let normalizedCreatorId: ObjectIdString | undefined;
    let normalizedMemberIds: ObjectIdString[] = [];
    try {
      normalizedCreatorId = validateObjectId(creatorId, "creatorId");
      normalizedMemberIds = validateObjectIdArray(memberIds, "memberIds");
      const creatorObjectId = toObjectId(normalizedCreatorId, "creatorId");
      const memberObjectIds = toObjectIdArray(normalizedMemberIds, "memberIds");

      logger.info("Creating group chat", {
        creatorId: normalizedCreatorId,
        memberCount: normalizedMemberIds.length + 1,
        title,
      });

      // Create group chat with creator + other members
      const allMemberIds = [creatorObjectId, ...memberObjectIds];
      const chat = await this.chatRepository.create(
        "group",
        creatorObjectId,
        allMemberIds,
        title ?? null,
      );

      // Create memberships: creator as admin, others as members
      await this.membershipRepository.createBulk(chat._id, [
        { userId: creatorObjectId, role: "admin" },
        ...memberObjectIds.map((userId) => ({
          userId,
          role: "member" as const,
        })),
      ]);

      logger.info("Group chat created successfully", {
        chatId: chat._id.toString(),
        creatorId: normalizedCreatorId,
        memberCount: allMemberIds.length,
        title,
      });

      return chat;
    } catch (error) {
      logger.error("Failed to create group chat", {
        creatorId: normalizedCreatorId ?? creatorId,
        memberCount: normalizedMemberIds.length + 1,
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
    userId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<ListChatsResponse> {
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedUserId = validateObjectId(userId, "userId");
      const userObjectId = toObjectId(normalizedUserId, "userId");
      const cursorObjectId = cursor
        ? toObjectId(validateObjectId(cursor, "cursor"), "cursor")
        : undefined;

      if (!this.messageRepository) {
        throw new Error("MessageRepository not initialized in ChatService");
      }

      logger.info("Listing user chats", {
        userId: normalizedUserId,
        cursor: cursorObjectId?.toString(),
        limit,
      });

      // Step 1: Get all memberships for the user
      const memberships =
        await this.membershipRepository.findByUser(userObjectId);

      if (memberships.length === 0) {
        logger.info("User has no chats", { userId: normalizedUserId });
        return { chats: [], nextCursor: undefined };
      }

      // Step 2: Extract chatIds from memberships
      const chatIds = memberships.map((m) => m.chatId);

      // Step 3: Query chats with pagination
      const chats = await this.chatRepository.findByIdsWithPagination(
        chatIds,
        cursorObjectId,
        limit + 1,
      );

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
          const messages = await this.messageRepository.findByChatId(
            chat._id,
            undefined,
            1,
          );
          const lastMessage = messages.length > 0 ? messages[0] : null;

          // Get user's membership for this chat
          const membership = memberships.find((m) => m.chatId.equals(chat._id));

          // Calculate unread count
          let unreadCount = 0;
          if (membership) {
            if (!membership.lastReadMessageId) {
              // No messages read yet, count all messages in chat
              unreadCount = await this.messageRepository.countByChatId(
                chat._id,
              );
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
            userId: normalizedUserId,
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
        userId: normalizedUserId,
        chatCount: chatDTOs.length,
        hasMore: !!nextCursor,
      });

      return response;
    } catch (error) {
      logger.error("Failed to list user chats", {
        userId: normalizedUserId ?? userId,
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
  async getChatById(chatId: string, userId: string): Promise<Chat | null> {
    let normalizedChatId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedChatId = validateObjectId(chatId, "chatId");
      normalizedUserId = validateObjectId(userId, "userId");
      const chatObjectId = toObjectId(normalizedChatId, "chatId");
      const userObjectId = toObjectId(normalizedUserId, "userId");

      logger.info("Getting chat by ID", {
        chatId: normalizedChatId,
        userId: normalizedUserId,
      });

      // Verify membership
      const membership = await this.membershipRepository.findByUserAndChat(
        userObjectId,
        chatObjectId,
      );
      if (!membership) {
        logger.warn("User attempted to access chat without membership", {
          chatId: normalizedChatId,
          userId: normalizedUserId,
        });
        return null; // Let route handler convert to 403
      }

      // Fetch chat
      const chat = await this.chatRepository.findById(chatObjectId);
      if (!chat) {
        logger.warn("Chat not found", {
          chatId: normalizedChatId,
        });
        return null; // Let route handler convert to 404
      }

      logger.info("Chat retrieved successfully", {
        chatId: normalizedChatId,
        userId: normalizedUserId,
      });

      return chat;
    } catch (error) {
      logger.error("Failed to get chat", {
        chatId: normalizedChatId ?? chatId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }
}
