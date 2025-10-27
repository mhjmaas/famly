/**
 * E2E Tests: Socket.IO Room Leave
 * Tests for leaving chat rooms
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

describe("E2E: Socket.IO - Room Leave", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should allow user to leave chat room", async () => {
      const users = await setupTestUsers(baseUrl, 2, "roomleave");
      const user1 = users[0];
      const user2 = users[1];

      // Create a chat
      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);

      // Join the room first
      const joinAck = await emitWithAck<any>(socket, "room:join", {
        chatId,
      });
      expect(joinAck.ok).toBe(true);

      // Leave the room
      const leaveAck = await emitWithAck<any>(socket, "room:leave", {
        chatId,
      });

      expect(leaveAck).toBeDefined();
      expect(leaveAck.ok).toBe(true);
      expect(leaveAck.error).toBeUndefined();

      await disconnectSocketClient(socket);
    });

    it("should be idempotent - can leave multiple times without error", async () => {
      const users = await setupTestUsers(baseUrl, 2, "idempotent");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;
      const socket = await connectSocketClient(baseUrl, user1.token);

      // Join the room
      const joinAck = await emitWithAck<any>(socket, "room:join", {
        chatId,
      });
      expect(joinAck.ok).toBe(true);

      // Leave once
      const leaveAck1 = await emitWithAck<any>(socket, "room:leave", {
        chatId,
      });
      expect(leaveAck1.ok).toBe(true);

      // Leave again (should still succeed)
      const leaveAck2 = await emitWithAck<any>(socket, "room:leave", {
        chatId,
      });
      expect(leaveAck2.ok).toBe(true);

      await disconnectSocketClient(socket);
    });
  });

  describe("Validation Cases", () => {
    it("should reject invalid chatId format", async () => {
      const user = await registerTestUser(baseUrl, 0, "validation");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:leave", {
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

      const ack = await emitWithAck<any>(socket, "room:leave", {});

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });
  });

  describe("Error Handling", () => {
    it("should include correlationId in error response", async () => {
      const user = await registerTestUser(baseUrl, 0, "correlation");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:leave", {
        chatId: "invalid",
      });

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.correlationId).toBeDefined();

      await disconnectSocketClient(socket);
    });
  });

  describe("Sequential Operations", () => {
    it("should support join -> leave -> join sequence", async () => {
      const users = await setupTestUsers(baseUrl, 2, "sequential");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;
      const socket = await connectSocketClient(baseUrl, user1.token);

      // Join
      const joinAck1 = await emitWithAck<any>(socket, "room:join", {
        chatId,
      });
      expect(joinAck1.ok).toBe(true);

      // Leave
      const leaveAck = await emitWithAck<any>(socket, "room:leave", {
        chatId,
      });
      expect(leaveAck.ok).toBe(true);

      // Join again
      const joinAck2 = await emitWithAck<any>(socket, "room:join", {
        chatId,
      });
      expect(joinAck2.ok).toBe(true);

      await disconnectSocketClient(socket);
    });
  });
});
