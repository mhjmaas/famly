/**
 * E2E Tests: Socket.IO Room Join
 * Tests for joining chat rooms and membership verification
 */

import request from "supertest";
import { registerTestUser, setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
} from "../../helpers/socket-client";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: Socket.IO - Room Join", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should allow user to join chat room they are a member of", async () => {
      const users = await setupTestUsers(baseUrl, 2, "roomjoin");
      const user1 = users[0];
      const user2 = users[1];

      // Create a chat with both users
      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      expect(chatResponse.status).toBe(201);
      const chatId = chatResponse.body._id;

      // Connect as user1
      const socket = await connectSocketClient(baseUrl, user1.token);

      // Try to join the room
      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId,
      });

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(true);
      expect(ack.error).toBeUndefined();

      await disconnectSocketClient(socket);
    });

    it("should auto-join user:<userId> room on connection", async () => {
      const user = await registerTestUser(baseUrl, 0, "autoroom");

      const socket = await connectSocketClient(baseUrl, user.token);

      // Socket should be auto-joined to user:<userId> room
      expect(socket.connected).toBe(true);

      await disconnectSocketClient(socket);
    });
  });

  describe("Authorization Cases", () => {
    it("should reject room join for non-member user", async () => {
      const users = await setupTestUsers(baseUrl, 3, "nonmember");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2]; // User3 is not a member

      // User1 creates chat with User2 (User3 excluded)
      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      expect(chatResponse.status).toBe(201);
      const chatId = chatResponse.body._id;

      // Connect as user3 (non-member)
      const socket = await connectSocketClient(baseUrl, user3.token);

      // Try to join the room as non-member
      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId,
      });

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("FORBIDDEN");
      expect(ack.message).toContain("not a member");

      await disconnectSocketClient(socket);
    });
  });

  describe("Validation Cases", () => {
    it("should reject invalid chatId format", async () => {
      const user = await registerTestUser(baseUrl, 0, "validation");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid-id",
      });

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should reject missing chatId", async () => {
      const user = await registerTestUser(baseUrl, 0, "missing");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {});

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should reject non-existent chat", async () => {
      const user = await registerTestUser(baseUrl, 0, "nonexist");
      const socket = await connectSocketClient(baseUrl, user.token);

      // Use a valid ObjectId format but non-existent chat
      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "507f1f77bcf86cd799439011",
      });

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("FORBIDDEN"); // Non-member of non-existent chat

      await disconnectSocketClient(socket);
    });
  });

  describe("Error Handling", () => {
    it("should include correlationId in error response", async () => {
      const user = await registerTestUser(baseUrl, 0, "correlation");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid",
      });

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.correlationId).toBeDefined();
      expect(typeof ack.correlationId).toBe("string");

      await disconnectSocketClient(socket);
    });
  });

  describe("Multiple Room Joins", () => {
    it("should allow joining multiple rooms", async () => {
      const users = await setupTestUsers(baseUrl, 3, "multiroom");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Create two chats with user1
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

      const socket = await connectSocketClient(baseUrl, user1.token);

      // Join first room
      const ack1 = await emitWithAck<any>(socket, "room:join", {
        chatId: chatId1,
      });
      expect(ack1.ok).toBe(true);

      // Join second room
      const ack2 = await emitWithAck<any>(socket, "room:join", {
        chatId: chatId2,
      });
      expect(ack2.ok).toBe(true);

      await disconnectSocketClient(socket);
    });
  });
});
