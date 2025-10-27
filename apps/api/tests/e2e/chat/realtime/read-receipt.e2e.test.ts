/**
 * E2E Tests: Socket.IO Read Receipts
 * Tests for read cursor updates and receipt broadcasts
 */

import request from "supertest";
import { setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
  waitForEvent,
} from "../../helpers/socket-client";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: Socket.IO - Read Receipts", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should update read cursor and broadcast receipt:update to members", async () => {
      const users = await setupTestUsers(baseUrl, 2, "receipt");
      const user1 = users[0];
      const user2 = users[1];

      // Create chat and send messages
      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      // Send message from user1
      const msgResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ body: "Test message" });

      const messageId = msgResponse.body._id;

      // Connect sockets
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // Set up listener on user1's socket
      const receiptPromise = waitForEvent<any>(socket1, "receipt:update", 5000);

      // User2 marks message as read
      const ack = await emitWithAck<any>(socket2, "receipt:read", {
        chatId,
        messageId,
      });

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(true);
      expect(ack.data?.readAt).toBeDefined();

      // User1 should receive the broadcast
      const receiptUpdate = await receiptPromise;
      expect(receiptUpdate).toBeDefined();
      expect(receiptUpdate.chatId).toBe(chatId);
      expect(receiptUpdate.messageId).toBe(messageId);
      expect(receiptUpdate.userId).toBe(user2.userId);
      expect(receiptUpdate.readAt).toBeDefined();

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Read Cursor Update Logic", () => {
    it("should only update if new messageId is newer than current", async () => {
      const users = await setupTestUsers(baseUrl, 2, "cursorupdate");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      // Send two messages
      const msg1Response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ body: "First message" });

      const messageId1 = msg1Response.body._id;

      // Wait a bit to ensure different timestamp
      await new Promise((r) => setTimeout(r, 100));

      const msg2Response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ body: "Second message" });

      const messageId2 = msg2Response.body._id;

      const socket = await connectSocketClient(baseUrl, user2.token);
      await emitWithAck(socket, "room:join", { chatId });

      // First, mark second message as read
      const ack2 = await emitWithAck<any>(socket, "receipt:read", {
        chatId,
        messageId: messageId2,
      });

      expect(ack2.ok).toBe(true);

      // Now try to mark older message as read
      const ack1 = await emitWithAck<any>(socket, "receipt:read", {
        chatId,
        messageId: messageId1,
      });

      // Should succeed but not update cursor (older message)
      expect(ack1.ok).toBe(true);

      await disconnectSocketClient(socket);
    });
  });

  describe("Validation", () => {
    it("should reject invalid chatId format", async () => {
      const users = await setupTestUsers(baseUrl, 2, "invalidchatid");
      const user1 = users[0];

      const socket = await connectSocketClient(baseUrl, user1.token);

      const ack = await emitWithAck<any>(socket, "receipt:read", {
        chatId: "invalid-id",
        messageId: "507f1f77bcf86cd799439011",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should reject invalid messageId format", async () => {
      const users = await setupTestUsers(baseUrl, 2, "invalidmsgid");
      const user1 = users[0];

      const socket = await connectSocketClient(baseUrl, user1.token);

      const ack = await emitWithAck<any>(socket, "receipt:read", {
        chatId: "507f1f77bcf86cd799439011",
        messageId: "invalid-id",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should reject missing chatId", async () => {
      const users = await setupTestUsers(baseUrl, 2, "missingchat");
      const user1 = users[0];

      const socket = await connectSocketClient(baseUrl, user1.token);

      const ack = await emitWithAck<any>(socket, "receipt:read", {
        messageId: "507f1f77bcf86cd799439011",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should reject missing messageId", async () => {
      const users = await setupTestUsers(baseUrl, 2, "missingmsg");
      const user1 = users[0];

      const socket = await connectSocketClient(baseUrl, user1.token);

      const ack = await emitWithAck<any>(socket, "receipt:read", {
        chatId: "507f1f77bcf86cd799439011",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });
  });

  describe("Message Verification", () => {
    it("should reject non-existent messageId", async () => {
      const users = await setupTestUsers(baseUrl, 2, "nonexistmsg");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user2.token);

      // Try to mark non-existent message as read
      const ack = await emitWithAck<any>(socket, "receipt:read", {
        chatId,
        messageId: "507f1f77bcf86cd799439011",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("NOT_FOUND");

      await disconnectSocketClient(socket);
    });

    it("should reject if messageId belongs to different chat", async () => {
      const users = await setupTestUsers(baseUrl, 3, "differentchat");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Create two chats
      const chat1Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chat2Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user3.userId] });

      const chatId1 = chat1Response.body._id;
      const chatId2 = chat2Response.body._id;

      // Send message in chat2
      const msgResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId2}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ body: "Message in chat2" });

      const messageId = msgResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);

      // Try to mark message from chat2 as read in chat1
      const ack = await emitWithAck<any>(socket, "receipt:read", {
        chatId: chatId1,
        messageId,
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });
  });

  describe("Authorization", () => {
    it("should reject read receipt from non-member", async () => {
      const users = await setupTestUsers(baseUrl, 3, "nonmemberreceipt");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const msgResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ body: "Message" });

      const messageId = msgResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user3.token);

      const ack = await emitWithAck<any>(socket, "receipt:read", {
        chatId,
        messageId,
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("FORBIDDEN");

      await disconnectSocketClient(socket);
    });
  });

  describe("Broadcast to Room", () => {
    it("should broadcast to all chat members", async () => {
      const users = await setupTestUsers(baseUrl, 3, "broadcastmembers");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId, user3.userId],
          title: "Group",
        });

      const chatId = chatResponse.body._id;

      const msgResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ body: "Group message" });

      const messageId = msgResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      const socket3 = await connectSocketClient(baseUrl, user3.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });
      await emitWithAck(socket3, "room:join", { chatId });

      // Track receipts on both other sockets
      const receipt1Promise = waitForEvent<any>(
        socket1,
        "receipt:update",
        5000,
      );
      const receipt3Promise = waitForEvent<any>(
        socket3,
        "receipt:update",
        5000,
      );

      // User2 marks as read
      const ack = await emitWithAck<any>(socket2, "receipt:read", {
        chatId,
        messageId,
      });

      expect(ack.ok).toBe(true);

      // Both user1 and user3 should receive broadcast
      const receipt1 = await receipt1Promise;
      const receipt3 = await receipt3Promise;

      expect(receipt1.userId).toBe(user2.userId);
      expect(receipt3.userId).toBe(user2.userId);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
      await disconnectSocketClient(socket3);
    });
  });
});
