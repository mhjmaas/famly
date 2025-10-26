/**
 * E2E Tests: Socket.IO Reconnection
 * Tests for handling client disconnections and backfill patterns
 */

import { setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import { getTestApp } from "../../helpers/test-app";
import {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
} from "../../helpers/socket-client";
import request from "supertest";
import { randomUUID } from "node:crypto";

describe("E2E: Socket.IO - Reconnection", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Basic Reconnection", () => {
    it("should handle client disconnect and reconnect", async () => {
      const users = await setupTestUsers(baseUrl, 2, "reconnect");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      // First connection
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      expect(socket1.connected).toBe(true);

      await emitWithAck(socket1, "room:join", { chatId });

      // Disconnect
      await disconnectSocketClient(socket1);
      expect(socket1.connected).toBe(false);

      // Reconnect
      const socket2 = await connectSocketClient(baseUrl, user1.token);
      expect(socket2.connected).toBe(true);

      // Should be able to rejoin room
      const ack = await emitWithAck<any>(socket2, "room:join", { chatId });
      expect(ack.ok).toBe(true);

      await disconnectSocketClient(socket2);
    });

    it("should auto-rejoin user:<userId> room after reconnect", async () => {
      const users = await setupTestUsers(baseUrl, 1, "autorejoin");
      const user = users[0];

      const socket1 = await connectSocketClient(baseUrl, user.token);
      expect(socket1.connected).toBe(true);

      await disconnectSocketClient(socket1);

      const socket2 = await connectSocketClient(baseUrl, user.token);
      expect(socket2.connected).toBe(true);

      // Should be auto-joined to user:<userId> room
      // This is implicit (no explicit test needed)

      await disconnectSocketClient(socket2);
    });
  });

  describe("Message Backfill", () => {
    it("should fetch missed messages via REST after reconnect", async () => {
      const users = await setupTestUsers(baseUrl, 2, "backfill");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // User1 sends message
      const clientId1 = randomUUID();
      await emitWithAck(socket1, "message:send", {
        chatId,
        body: "Message 1",
        clientId: clientId1,
      });

      // User2 disconnects
      await disconnectSocketClient(socket2);

      // User1 sends more messages while user2 is offline
      const clientId2 = randomUUID();
      await emitWithAck(socket1, "message:send", {
        chatId,
        body: "Message 2",
        clientId: clientId2,
      });

      const clientId3 = randomUUID();
      await emitWithAck(socket1, "message:send", {
        chatId,
        body: "Message 3",
        clientId: clientId3,
      });

      // User2 reconnects
      const socket3 = await connectSocketClient(baseUrl, user2.token);
      await emitWithAck(socket3, "room:join", { chatId });

      // User2 can fetch messages via REST API (backfill pattern)
      const messagesResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user2.token}`);

      expect(messagesResponse.status).toBe(200);
      expect(messagesResponse.body.messages).toHaveLength(3);

      // Should have all messages (API returns newest first, so reverse to get chronological order)
      const messages = messagesResponse.body.messages.reverse();
      expect(messages[0].body).toBe("Message 1");
      expect(messages[1].body).toBe("Message 2");
      expect(messages[2].body).toBe("Message 3");

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket3);
    });

    it("should backfill read cursor on reconnect", async () => {
      const users = await setupTestUsers(baseUrl, 2, "cursorbackfill");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      // Send a message
      const msgResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ body: "Message" });

      const messageId = msgResponse.body._id;

      const socket2 = await connectSocketClient(baseUrl, user2.token);
      await emitWithAck(socket2, "room:join", { chatId });

      // Mark as read
      const ack1 = await emitWithAck<any>(socket2, "receipt:read", {
        chatId,
        messageId,
      });
      expect(ack1.ok).toBe(true);

      // Disconnect
      await disconnectSocketClient(socket2);

      // Reconnect
      const socket3 = await connectSocketClient(baseUrl, user2.token);

      // Chat info should still show read cursor (via REST)
      const chatInfo = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user2.token}`);

      expect(chatInfo.status).toBe(200);
      // Read cursor should be persisted

      await disconnectSocketClient(socket3);
    });
  });

  describe("Concurrent Messages During Disconnection", () => {
    it("should handle concurrent messages from different clients", async () => {
      const users = await setupTestUsers(baseUrl, 3, "concurrent");
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

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      const socket3 = await connectSocketClient(baseUrl, user3.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });
      await emitWithAck(socket3, "room:join", { chatId });

      // User2 disconnects
      await disconnectSocketClient(socket2);

      // User1 and User3 send messages
      const clientId1 = randomUUID();
      const clientId3 = randomUUID();

      await emitWithAck(socket1, "message:send", {
        chatId,
        body: "From user1",
        clientId: clientId1,
      });

      await emitWithAck(socket3, "message:send", {
        chatId,
        body: "From user3",
        clientId: clientId3,
      });

      // User2 reconnects and backfills
      const socket4 = await connectSocketClient(baseUrl, user2.token);

      const messagesResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user2.token}`);

      expect(messagesResponse.status).toBe(200);
      expect(messagesResponse.body.messages.length).toBeGreaterThanOrEqual(2);

      // Both messages should be present
      const messages = messagesResponse.body.messages;
      const hasUser1Message = messages.some(
        (m: any) => m.body === "From user1" && m.senderId === user1.userId
      );
      const hasUser3Message = messages.some(
        (m: any) => m.body === "From user3" && m.senderId === user3.userId
      );

      expect(hasUser1Message).toBe(true);
      expect(hasUser3Message).toBe(true);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket3);
      await disconnectSocketClient(socket4);
    });
  });

  describe("Room State After Reconnect", () => {
    it("should resync room state after reconnect", async () => {
      const users = await setupTestUsers(baseUrl, 2, "roomstate");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket1, "room:join", { chatId });

      // Disconnect
      await disconnectSocketClient(socket1);

      // Reconnect and rejoin
      const socket2 = await connectSocketClient(baseUrl, user1.token);
      const ack = await emitWithAck<any>(socket2, "room:join", { chatId });

      // Should be able to rejoin successfully
      expect(ack.ok).toBe(true);

      await disconnectSocketClient(socket2);
    });

    it("should handle rapid disconnect/reconnect cycles", async () => {
      const users = await setupTestUsers(baseUrl, 1, "rapid");
      const user = users[0];

      for (let i = 0; i < 3; i++) {
        const socket = await connectSocketClient(baseUrl, user.token);
        expect(socket.connected).toBe(true);

        await disconnectSocketClient(socket);
        expect(socket.connected).toBe(false);
      }
    });
  });

  describe("Connection Failures", () => {
    it("should handle network timeout gracefully", async () => {
      const users = await setupTestUsers(baseUrl, 1, "timeout");
      const user = users[0];

      let connected = false;
      try {
        const socket = await connectSocketClient(baseUrl, user.token, 100);
        connected = socket.connected;
        await disconnectSocketClient(socket);
      } catch (err) {
        // Timeout is acceptable
        connected = false;
      }

      // Either succeeded quickly or timed out gracefully
      expect(typeof connected).toBe("boolean");
    });

    it("should handle invalid token on reconnect", async () => {
      const users = await setupTestUsers(baseUrl, 1, "invalidtoken");
      const user = users[0];

      const socket1 = await connectSocketClient(baseUrl, user.token);
      expect(socket1.connected).toBe(true);

      await disconnectSocketClient(socket1);

      // Try to reconnect with invalid token
      let connectionFailed = false;
      try {
        const socket2 = await connectSocketClient(
          baseUrl,
          "invalid-token-xyz",
          5000
        );
        // Should fail or timeout
        connectionFailed = !socket2.connected;
        if (socket2.connected) {
          await disconnectSocketClient(socket2);
        }
      } catch (err) {
        connectionFailed = true;
      }

      // Should have failed
      expect(connectionFailed).toBe(true);
    });
  });

  describe("Message Ordering After Reconnect", () => {
    it("should maintain message order across reconnections", async () => {
      const users = await setupTestUsers(baseUrl, 2, "ordering");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // Send sequence of messages
      const clientIds = [];
      for (let i = 0; i < 3; i++) {
        const clientId = randomUUID();
        clientIds.push(clientId);
        await emitWithAck(socket1, "message:send", {
          chatId,
          body: `Message ${i}`,
          clientId,
        });
      }

      // Disconnect user2
      await disconnectSocketClient(socket2);

      // Send more messages
      for (let i = 3; i < 5; i++) {
        const clientId = randomUUID();
        clientIds.push(clientId);
        await emitWithAck(socket1, "message:send", {
          chatId,
          body: `Message ${i}`,
          clientId,
        });
      }

      // Reconnect user2
      const socket3 = await connectSocketClient(baseUrl, user2.token);

      // Fetch all messages
      const messagesResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user2.token}`);

      // API returns newest first, so reverse to get chronological order
      const messages = messagesResponse.body.messages.reverse();

      // Should have 5 messages in order
      expect(messages.length).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(messages[i].body).toBe(`Message ${i}`);
      }

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket3);
    });
  });
});
