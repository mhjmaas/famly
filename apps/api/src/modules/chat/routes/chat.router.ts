import { Router } from "express";
import { addMembersRoute } from "./add-members.route";
import { createChatRoute } from "./create-chat.route";
import { getChatRoute } from "./get-chat.route";
import { listChatsRoute } from "./list-chats.route";
import { removeMemberRoute } from "./remove-member.route";
import { listMessagesRoute } from "./list-messages.route";
import { updateReadCursorRoute } from "./update-read-cursor.route";

/**
 * Create and configure the chat router
 * Mounts all chat-related routes
 */
export function createChatRouter(): Router {
  const router = Router();

  // POST /v1/chats - Create a new chat (DM or group)
  router.use(createChatRoute());

  // GET /v1/chats - List all user's chats with pagination
  router.use(listChatsRoute());

  // GET /v1/chats/:chatId - Get a specific chat
  router.use(getChatRoute());

  // POST /v1/chats/:chatId/members - Add members to a group
  router.use(addMembersRoute());

  // DELETE /v1/chats/:chatId/members/:userId - Remove a member from a group
  router.use(removeMemberRoute());

  // GET /v1/chats/:chatId/messages - List messages for a chat
  router.use(listMessagesRoute());

  // POST /v1/chats/:chatId/read-cursor - Update read cursor for a chat
  router.use(updateReadCursorRoute());

  return router;
}
