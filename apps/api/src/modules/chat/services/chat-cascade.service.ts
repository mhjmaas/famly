import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  fromObjectId,
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import { toChatDTO } from "../lib/chat.mapper";
import { emitChatUpdate } from "../realtime/events/chat-events";
import type { ChatRepository } from "../repositories/chat.repository";
import type { MembershipRepository } from "../repositories/membership.repository";
import type { MessageRepository } from "../repositories/message.repository";

/**
 * ChatCascadeService
 *
 * Provides utilities to clean up chat data when a user is removed elsewhere
 * (e.g., family member removal). Keeps chat data consistent and avoids
 * orphaned memberships.
 */
export class ChatCascadeService {
  constructor(
    private chatRepository: ChatRepository,
    private membershipRepository: MembershipRepository,
    private messageRepository: MessageRepository,
  ) {}

  /**
   * Remove a user from all chats they are part of.
   *
   * - Group chats: remove membership and update chat.memberIds
   * - DMs: delete the chat, its memberships, and its messages
   *
   * @param userId - user to remove from chats
   */
  async removeUserFromAllChats(userId: ObjectIdString): Promise<void> {
    const normalizedUserId = validateObjectId(userId, "userId");
    const userObjectId = toObjectId(normalizedUserId, "userId");

    const memberships =
      await this.membershipRepository.findByUser(userObjectId);

    if (!memberships.length) {
      logger.info("Chat cascade: user has no chat memberships", {
        userId: normalizedUserId,
      });
      return;
    }

    for (const membership of memberships) {
      const chat = await this.chatRepository.findById(membership.chatId);
      if (!chat) {
        // Chat already gone; cleanup membership
        await this.membershipRepository.delete(membership._id);
        continue;
      }

      if (chat.type === "dm") {
        await this.deleteDmChat(chat._id);
        logger.info("Chat cascade: deleted DM due to member removal", {
          chatId: fromObjectId(chat._id),
          userId: normalizedUserId,
        });
        continue;
      }

      // Group chat: remove membership and update memberIds
      await this.membershipRepository.delete(membership._id);

      const updatedMemberIds = chat.memberIds.filter(
        (id) => !id.equals(userObjectId),
      );

      const updatedChat = await this.chatRepository.updateMembers(
        chat._id,
        updatedMemberIds,
      );

      if (!updatedChat) {
        throw HttpError.notFound("Chat not found during cascade");
      }

      // Notify existing members (including the removed one) of the update
      const oldMemberIds = chat.memberIds.map((id) => id.toString());
      emitChatUpdate(toChatDTO(updatedChat), oldMemberIds);

      logger.info("Chat cascade: removed member from group chat", {
        chatId: fromObjectId(chat._id),
        userId: normalizedUserId,
      });
    }
  }

  private async deleteDmChat(chatId: ReturnType<typeof toObjectId>) {
    await this.messageRepository.deleteByChatId(chatId);
    await this.membershipRepository.deleteManyByChat(chatId);
    await this.chatRepository.deleteById(chatId);
  }
}
