import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { type ObjectId } from "mongodb";
import type { Chat } from "../domain/chat";
import type { MembershipDTO } from "../domain/membership";
import { toChatDTO } from "../lib/chat.mapper";
import { toMembershipDTO } from "../lib/membership.mapper";
import type { ChatRepository } from "../repositories/chat.repository";
import type { MembershipRepository } from "../repositories/membership.repository";
import type { MessageRepository } from "../repositories/message.repository";
import { emitChatUpdate } from "../realtime/events/chat-events";

export class MembershipService {
  constructor(
    private chatRepository: ChatRepository,
    private membershipRepository: MembershipRepository,
    private messageRepository?: MessageRepository,
  ) {}

  /**
   * Add new members to a group chat
   *
   * @param chatId - The chat ID
   * @param userIds - Array of user IDs to add
   * @param addedBy - ID of the user adding members (used for logging)
   * @returns The updated chat
   */
  async addMembers(
    chatId: ObjectId,
    userIds: ObjectId[],
    addedBy: ObjectId,
  ): Promise<Chat> {
    try {
      logger.info("Adding members to chat", {
        chatId: chatId.toString(),
        userCount: userIds.length,
        addedBy: addedBy.toString(),
      });

      // Verify chat exists and get its current state
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        throw HttpError.notFound("Chat not found");
      }

      // Only allow adding members to groups
      if (chat.type !== "group") {
        throw HttpError.badRequest("Cannot add members to DM");
      }

      // Check which users are already members
      const existingMemberships = await this.membershipRepository.findByChat(
        chatId
      );
      const existingMemberIds = new Set(
        existingMemberships.map((m) => m.userId.toString())
      );

      // Find users that aren't already members
      const newUserIds: ObjectId[] = [];
      for (const userId of userIds) {
        if (!existingMemberIds.has(userId.toString())) {
          newUserIds.push(userId);
        } else {
          throw HttpError.badRequest(
            `User ${userId.toString()} is already a member of this chat`
          );
        }
      }

      // Create memberships for new users
      if (newUserIds.length > 0) {
        await this.membershipRepository.createBulk(
          chatId,
          newUserIds.map((userId) => ({ userId, role: "member" }))
        );

        // Update chat's memberIds array
        const updatedMemberIds = [
          ...chat.memberIds,
          ...newUserIds,
        ];
        const updatedChat = await this.chatRepository.updateMembers(
          chatId,
          updatedMemberIds
        );

        if (!updatedChat) {
          throw HttpError.notFound("Chat not found");
        }

        logger.info("Members added to chat successfully", {
          chatId: chatId.toString(),
          addedCount: newUserIds.length,
          addedBy: addedBy.toString(),
        });

        // Emit Socket.IO event to OLD members only (before addition)
        // Send the updated chat (with new members) but only to old members
        const oldMemberIds = chat.memberIds.map((id) => id.toString());
        emitChatUpdate(toChatDTO(updatedChat), oldMemberIds);

        return updatedChat;
      }

      return chat;
    } catch (error) {
      logger.error("Failed to add members to chat", {
        chatId: chatId.toString(),
        userCount: userIds.length,
        addedBy: addedBy.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Remove a member from a group chat
   *
   * @param chatId - The chat ID
   * @param userId - The user ID to remove
   * @param removedBy - ID of the user removing the member (used for authorization and logging)
   * @returns The updated chat
   */
  async removeMember(
    chatId: ObjectId,
    userId: ObjectId,
    removedBy: ObjectId,
  ): Promise<Chat> {
    try {
      logger.info("Removing member from chat", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        removedBy: removedBy.toString(),
      });

      // Verify chat exists
      const chat = await this.chatRepository.findById(chatId);
      if (!chat) {
        throw HttpError.notFound("Chat not found");
      }

      // Only allow removing members from groups
      if (chat.type !== "group") {
        throw HttpError.badRequest("Cannot remove members from DM");
      }

      // Find the membership to delete
      const membership = await this.membershipRepository.findByUserAndChat(
        userId,
        chatId
      );
      if (!membership) {
        throw HttpError.notFound("Member not found");
      }

      // Delete the membership
      const deleted = await this.membershipRepository.delete(membership._id);
      if (!deleted) {
        throw HttpError.notFound("Member not found");
      }

      // Update chat's memberIds array
      const updatedMemberIds = chat.memberIds.filter(
        (id) => id.toString() !== userId.toString()
      );
      const updatedChat = await this.chatRepository.updateMembers(
        chatId,
        updatedMemberIds
      );

      if (!updatedChat) {
        throw HttpError.notFound("Chat not found");
      }

      logger.info("Member removed from chat successfully", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        removedBy: removedBy.toString(),
      });

      // Emit Socket.IO event to OLD members (including the removed one)
      // Send the updated chat (without removed member) to all old members
      const oldMemberIds = chat.memberIds.map((id) => id.toString());
      emitChatUpdate(toChatDTO(updatedChat), oldMemberIds);

      return updatedChat;
    } catch (error) {
      logger.error("Failed to remove member from chat", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        removedBy: removedBy.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update the read cursor for a membership
   *
   * Only updates if the new message ID is newer than the current lastReadMessageId
   * (Uses MongoDB ObjectId ordering where newer IDs have higher timestamp values)
   *
   * @param chatId - The chat ID
   * @param userId - The user ID
   * @param messageId - The message ID to mark as read
   * @returns The updated membership DTO
   * @throws HttpError(404) if message not found
   * @throws HttpError(400) if message doesn't belong to chat
   */
  async updateReadCursor(
    chatId: ObjectId,
    userId: ObjectId,
    messageId: ObjectId,
  ): Promise<MembershipDTO> {
    try {
      if (!this.messageRepository) {
        throw new Error("MessageRepository not initialized in MembershipService");
      }

      logger.info("Updating read cursor", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        messageId: messageId.toString(),
      });

      // Check membership FIRST (authorization before resource validation)
      const membership = await this.membershipRepository.findByUserAndChat(
        userId,
        chatId,
      );
      if (!membership) {
        throw HttpError.forbidden("You are not a member of this chat");
      }

      // Then verify message exists and belongs to this chat
      const message = await this.messageRepository.findById(messageId);
      if (!message) {
        throw HttpError.notFound("Message not found");
      }

      if (!message.chatId.equals(chatId)) {
        throw HttpError.badRequest("Message does not belong to this chat");
      }

      // Only update if new message is newer than current lastReadMessageId
      // ObjectIds can be compared as hex strings for chronological ordering
      const shouldUpdate = !membership.lastReadMessageId || 
        messageId.toString() > membership.lastReadMessageId.toString();
      
      if (shouldUpdate) {
        const updated = await this.membershipRepository.updateReadCursor(
          membership._id,
          messageId,
        );

        if (!updated) {
          throw HttpError.notFound("Membership not found");
        }

        logger.info("Read cursor updated successfully", {
          chatId: chatId.toString(),
          userId: userId.toString(),
          messageId: messageId.toString(),
        });

        return toMembershipDTO(updated);
      }

      logger.info("Read cursor not updated (message is older)", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        messageId: messageId.toString(),
      });

      return toMembershipDTO(membership);
    } catch (error) {
      logger.error("Failed to update read cursor", {
        chatId: chatId.toString(),
        userId: userId.toString(),
        messageId: messageId.toString(),
        error,
      });
      throw error;
    }
  }
}
