/**
 * Socket.IO Event Type Definitions
 * Defines all client→server and server→client event payloads
 */

import type { MessageDTO } from "@modules/chat";

/**
 * Standard acknowledgment shape for all Socket.IO events
 */
export type Ack<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; message?: string; correlationId?: string };

/**
 * Error codes for Socket.IO events
 */
export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
  NOT_FOUND = "NOT_FOUND",
  INTERNAL = "INTERNAL",
}

/**
 * Client → Server Events
 */

export interface RoomJoinPayload {
  chatId: string;
}

export interface RoomLeavePayload {
  chatId: string;
}

export interface MessageSendPayload {
  chatId: string;
  clientId: string;
  body: string;
}

export interface ReceiptReadPayload {
  chatId: string;
  messageId: string;
}

export interface TypingStartPayload {
  chatId: string;
}

export interface TypingStopPayload {
  chatId: string;
}

export type PresencePingPayload = Record<string, never>;

/**
 * Acknowledgment response types for client → server events
 */

export interface RoomJoinAck extends Ack {
  ok: true;
}

export interface RoomLeaveAck extends Ack {
  ok: true;
}

export interface MessageSendAck
  extends Ack<{ clientId: string; serverId: string }> {
  ok: true;
  data: {
    clientId: string;
    serverId: string;
  };
}

export interface ReceiptReadAck extends Ack {
  ok: true;
}

export interface PresencePingAck extends Ack<{ serverTime: string }> {
  ok: true;
  data: {
    serverTime: string;
  };
}

/**
 * Server → Client Events
 */

export interface MessageNewPayload {
  message: MessageDTO;
}

export interface MessageAckPayload {
  clientId: string;
  serverId: string;
}

export interface ReceiptUpdatePayload {
  chatId: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface TypingUpdatePayload {
  chatId: string;
  userId: string;
  state: "start" | "stop";
}

export interface PresenceUpdatePayload {
  userId: string;
  status: "online" | "offline";
}

export interface ChatUpdatePayload {
  // biome-ignore lint/suspicious/noExplicitAny: ChatDTO imported at runtime to avoid circular deps
  chat: any;
}

/**
 * Socket.IO Data attached to socket instance
 */
export interface SocketData {
  userId: string;
}
