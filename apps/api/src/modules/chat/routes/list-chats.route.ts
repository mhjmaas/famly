import { FeatureKey } from "@famly/shared";
import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilySettingsRepository } from "@modules/family/repositories/family-settings.repository";
import { FamilySettingsService } from "@modules/family/services/family-settings.service";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import type { ChatWithPreviewDTO, ListChatsResponse } from "../domain/chat";
import { toChatWithPreviewDTO } from "../lib/chat.mapper";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MessageRepository } from "../repositories/message.repository";
import { ChatService } from "../services/chat.service";
import { validateListChats } from "../validators/list-chats.validator";

/**
 * GET / - List all chats for the authenticated user
 *
 * Requires authentication
 *
 * Query parameters (optional):
 * - cursor: string (pagination cursor, must be valid ObjectId)
 * - limit: number (default 20, max 100)
 *
 * Response (200): ListChatsResponse with array of ChatWithPreviewDTO and optional nextCursor
 * Response (400): Validation error (invalid cursor or limit)
 * Response (401): Authentication required
 *
 * Note: If aiIntegration feature is enabled for the user's family, an AI chat
 * will be auto-created (if not exists) and included at the top of the list.
 */
export function listChatsRoute(): Router {
  const router = Router();
  const chatRepository = new ChatRepository();
  const membershipRepository = new MembershipRepository();
  const messageRepository = new MessageRepository();
  const chatService = new ChatService(
    chatRepository,
    membershipRepository,
    messageRepository,
  );
  const familySettingsService = new FamilySettingsService(
    new FamilySettingsRepository(),
  );

  router.get(
    "/",
    authenticate,
    validateListChats,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const paginationParams = (req as any).paginationParams || {
          cursor: undefined,
          limit: 20,
        };

        // Get regular chats
        const response: ListChatsResponse = await chatService.listUserChats(
          req.user.id,
          paginationParams.cursor,
          paginationParams.limit,
        );

        // Check if aiIntegration is enabled for the user's family
        const familyId = req.user.families?.[0]?.familyId;
        if (familyId && !paginationParams.cursor) {
          // Only include AI chat on first page (no cursor)
          try {
            const settings = await familySettingsService.getSettings(familyId);
            const aiEnabled = settings.enabledFeatures.includes(
              FeatureKey.AIIntegration,
            );

            if (aiEnabled) {
              const aiName = settings.aiSettings.aiName || "AI Assistant";
              const { chat: aiChat, isNew } =
                await chatService.getOrCreateAIChat(req.user.id, aiName);

              // For existing AI chats, fetch last message
              let lastMessage = null;
              if (!isNew) {
                const messages = await messageRepository.findByChatId(
                  aiChat._id,
                  undefined,
                  1,
                );
                lastMessage = messages.length > 0 ? messages[0] : null;
              }

              // Build AI chat DTO and prepend to list
              // AI chat always appears at the top
              // Note: unreadCount is 0 for AI chats (no AI responses yet)
              const aiChatDTO: ChatWithPreviewDTO = toChatWithPreviewDTO(
                aiChat,
                lastMessage,
                0,
              );

              // Filter out any existing AI chat from the regular list (shouldn't happen, but safety check)
              const filteredChats = response.chats.filter(
                (c) => c.type !== "ai",
              );

              response.chats = [aiChatDTO, ...filteredChats];

              logger.debug("AI chat included in response", {
                userId: req.user.id,
                aiChatId: aiChat._id.toString(),
                aiName,
                isNew,
              });
            }
          } catch (error) {
            // Don't fail the entire request if AI chat creation fails
            logger.error("Failed to include AI chat in response", {
              userId: req.user.id,
              familyId,
              error,
            });
          }
        }

        res.status(200).json(response);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
