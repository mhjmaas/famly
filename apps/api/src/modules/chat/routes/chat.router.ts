import { Router } from "express";
import { addMembersRoute } from "./add-members.route";
import { clearMessagesRoute } from "./clear-messages.route";
import { createChatRoute } from "./create-chat.route";
import { createMessageRoute } from "./create-message.route";
import { getChatRoute } from "./get-chat.route";
import { listChatsRoute } from "./list-chats.route";
import { listMessagesRoute } from "./list-messages.route";
import { removeMemberRoute } from "./remove-member.route";
import { searchMessagesRoute } from "./search-messages.route";
import { updateReadCursorRoute } from "./update-read-cursor.route";

/**
 * Create and configure the chat router
 * Mounts all chat-related routes
 *
 * Route Structure:
 * - Chat Management: Create, list, get chats
 * - Membership: Add/remove members
 * - Messages: List, create, search messages
 * - Read Status: Update read cursor
 */
export function createChatRouter(): Router {
  const router = Router();

  // === Chat Management ===
  // POST /v1/chats - Create a new chat (DM or group)
  router.use(createChatRoute());

  // GET /v1/chats - List all user's chats with pagination
  router.use(listChatsRoute());

  // GET /v1/chats/:chatId - Get a specific chat
  router.use(getChatRoute());

  // === Membership Management ===
  // POST /v1/chats/:chatId/members - Add members to a group
  router.use(addMembersRoute());

  // DELETE /v1/chats/:chatId/members/:userId - Remove a member from a group
  router.use(removeMemberRoute());

  // === Messages ===
  // GET /v1/chats/:chatId/messages - List messages in a chat
  router.use(listMessagesRoute());

  // POST /v1/chats/:chatId/messages - Send a message to a chat
  router.use(createMessageRoute());

  // DELETE /v1/chats/:chatId/messages - Clear all messages in an AI chat
  router.use(clearMessagesRoute());

  // GET /v1/chats/search/messages - Search messages across all user's chats
  router.use(searchMessagesRoute());

  // === Read Status ===
  // PUT /v1/chats/:chatId/read-cursor - Update read cursor for a chat
  router.use(updateReadCursorRoute());

  return router;
}
