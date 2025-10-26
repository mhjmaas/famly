/**
 * E2E Tests: Socket.IO Message Sending
 * Tests for sending messages via Socket.IO with idempotency and rate limiting
 */

import { setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import { getTestApp } from "../../helpers/test-app";
import {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
  waitForEvent,
} from "../../helpers/socket-client";
import request from "supertest";
import { randomUUID } from "node:crypto";

describe("E2E: Socket.IO - Message Sending", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should send message and receive ack with clientId and serverId", async () => {
      const users = await setupTestUsers(baseUrl, 2, "msgsend");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;
      const clientId = randomUUID();

      const socket = await connectSocketClient(baseUrl, user1.token);

      // Join the room first
      const joinAck = await emitWithAck<any>(socket, "room:join", { chatId });
      expect(joinAck.ok).toBe(true);

      // Send message
      const sendAck = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Hello, World!",
        clientId,
      });

      expect(sendAck).toBeDefined();
      expect(sendAck.ok).toBe(true);
      expect(sendAck.data).toBeDefined();
      expect(sendAck.data.clientId).toBe(clientId);
      expect(sendAck.data.serverId).toBeDefined();

      await disconnectSocketClient(socket);
    });

    it("should broadcast message:new to all room members", async () => {
      const users = await setupTestUsers(baseUrl, 2, "broadcast");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      // Connect both users
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      // Both join room
      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // Set up listener on user2's socket
      const messagePromise = waitForEvent<any>(socket2, "message:new", 5000);

      // User1 sends message
      const clientId = randomUUID();
      const sendAck = await emitWithAck<any>(socket1, "message:send", {
        chatId,
        body: "Test message",
        clientId,
      });

      expect(sendAck.ok).toBe(true);

      // User2 should receive the broadcast
      const broadcast = await messagePromise;
      expect(broadcast).toBeDefined();
      expect(broadcast.message).toBeDefined();
      expect(broadcast.message.chatId).toBe(chatId);
      expect(broadcast.message.body).toBe("Test message");
      expect(broadcast.message.senderId).toBe(user1.userId);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });

    it("should include server timestamp in broadcast", async () => {
      const users = await setupTestUsers(baseUrl, 2, "timestamp");
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

      const messagePromise = waitForEvent<any>(socket2, "message:new", 5000);

      const sendAck = await emitWithAck<any>(socket1, "message:send", {
        chatId,
        body: "Timestamp test",
        clientId: randomUUID(),
      });

      expect(sendAck.ok).toBe(true);

      const broadcast = await messagePromise;
      expect(broadcast.message).toBeDefined();
      expect(broadcast.message.createdAt).toBeDefined();
      expect(typeof broadcast.message.createdAt).toBe("string");
      // Should be ISO format
      expect(new Date(broadcast.message.createdAt).toString()).not.toBe(
        "Invalid Date"
      );

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Idempotency", () => {
    it("should return same serverId for duplicate clientId", async () => {
      const users = await setupTestUsers(baseUrl, 2, "idempotent");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;
      const clientId = randomUUID();

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      // First send
      const ack1 = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Idempotent test",
        clientId,
      });

      expect(ack1.ok).toBe(true);
      const serverId1 = ack1.data.serverId;

      // Second send with same clientId
      const ack2 = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Idempotent test",
        clientId,
      });

      expect(ack2.ok).toBe(true);
      expect(ack2.data.serverId).toBe(serverId1);

      await disconnectSocketClient(socket);
    });

    it("should only broadcast once for duplicate sends", async () => {
      const users = await setupTestUsers(baseUrl, 2, "singlebroadcast");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;
      const clientId = randomUUID();

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // Track broadcasts
      let broadcastCount = 0;
      socket2.on("message:new", () => {
        broadcastCount++;
      });

      // Send twice with same clientId
      await emitWithAck(socket1, "message:send", {
        chatId,
        body: "Test",
        clientId,
      });

      await new Promise((r) => setTimeout(r, 100)); // Wait for broadcast

      await emitWithAck(socket1, "message:send", {
        chatId,
        body: "Test",
        clientId,
      });

      await new Promise((r) => setTimeout(r, 100)); // Wait for potential second broadcast

      // Should only have 1 broadcast despite 2 sends
      expect(broadcastCount).toBe(1);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Validation", () => {
    it("should reject message without clientId", async () => {
      const users = await setupTestUsers(baseUrl, 2, "noclient");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "No clientId",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should reject message exceeding max length", async () => {
      const users = await setupTestUsers(baseUrl, 2, "toolong");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      // Create message body exceeding 8000 chars
      const longBody = "x".repeat(8001);

      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: longBody,
        clientId: randomUUID(),
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should reject empty message body", async () => {
      const users = await setupTestUsers(baseUrl, 2, "empty");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "",
        clientId: randomUUID(),
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });
  });

  describe("Authorization", () => {
    it("should reject message from non-member", async () => {
      const users = await setupTestUsers(baseUrl, 3, "nonmember");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user3.token); // Non-member
      await emitWithAck(socket, "room:join", { chatId }); // This should fail

      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Unauthorized message",
        clientId: randomUUID(),
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("FORBIDDEN");

      await disconnectSocketClient(socket);
    });
  });

  describe("Rate Limiting", () => {
    it("should reject after 10 messages in 10 seconds", async () => {
      const users = await setupTestUsers(baseUrl, 2, "ratelimit");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      // Send 10 messages successfully
      for (let i = 0; i < 10; i++) {
        const ack = await emitWithAck<any>(socket, "message:send", {
          chatId,
          body: `Message ${i}`,
          clientId: randomUUID(),
        });
        expect(ack.ok).toBe(true);
      }

      // 11th message should be rate limited
      const rateLimitedAck = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Rate limited",
        clientId: randomUUID(),
      });

      expect(rateLimitedAck.ok).toBe(false);
      expect(rateLimitedAck.error).toBe("RATE_LIMITED");

      await disconnectSocketClient(socket);
    });
  });
});
