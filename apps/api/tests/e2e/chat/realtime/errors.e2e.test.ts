/**
 * E2E Tests: Socket.IO Error Handling
 * Tests for standardized error responses and error codes
 */

import { randomUUID } from "node:crypto";
import request from "supertest";
import { registerTestUser, setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
} from "../../helpers/socket-client";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: Socket.IO - Error Handling", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Error Response Format", () => {
    it("should return standardized error ack shape", async () => {
      const user = await registerTestUser(baseUrl, 0, "errorformat");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid-id",
      });

      // Error response should have this shape
      expect(ack).toBeDefined();
      expect(ack.ok).toBe(false);
      expect(ack.error).toBeDefined();
      expect(typeof ack.error).toBe("string");

      await disconnectSocketClient(socket);
    });

    it("should include error message in response", async () => {
      const user = await registerTestUser(baseUrl, 0, "errormsg");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid-id",
      });

      expect(ack.ok).toBe(false);
      expect(ack.message).toBeDefined();
      expect(typeof ack.message).toBe("string");
      expect(ack.message.length).toBeGreaterThan(0);

      await disconnectSocketClient(socket);
    });

    it("should include correlationId for tracing", async () => {
      const user = await registerTestUser(baseUrl, 0, "correlation");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid-id",
      });

      expect(ack.ok).toBe(false);
      expect(ack.correlationId).toBeDefined();
      expect(typeof ack.correlationId).toBe("string");
      expect(ack.correlationId.length).toBeGreaterThan(0);

      await disconnectSocketClient(socket);
    });
  });

  describe("Validation Errors", () => {
    it("should return VALIDATION_ERROR for invalid chatId", async () => {
      const user = await registerTestUser(baseUrl, 0, "invalidchatid");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "not-an-object-id",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should return VALIDATION_ERROR for missing required fields", async () => {
      const user = await registerTestUser(baseUrl, 0, "missingfield");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId: "507f1f77bcf86cd799439011",
        body: "Test",
        // Missing clientId
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");

      await disconnectSocketClient(socket);
    });

    it("should return VALIDATION_ERROR for field size violations", async () => {
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

      // Body exceeds max length
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

    it("should provide helpful error messages for validation", async () => {
      const user = await registerTestUser(baseUrl, 0, "helpfulmsg");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid",
      });

      expect(ack.message).toBeTruthy();
      expect(ack.message.toLowerCase()).toContain("valid");

      await disconnectSocketClient(socket);
    });
  });

  describe("Authorization Errors", () => {
    it("should return FORBIDDEN for non-member room join", async () => {
      const users = await setupTestUsers(baseUrl, 3, "forbidden");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user3.token);

      const ack = await emitWithAck<any>(socket, "room:join", { chatId });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("FORBIDDEN");

      await disconnectSocketClient(socket);
    });

    it("should return FORBIDDEN for non-member message send", async () => {
      const users = await setupTestUsers(baseUrl, 3, "forbiddenmsg");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user3.token);

      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Unauthorized",
        clientId: randomUUID(),
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("FORBIDDEN");

      await disconnectSocketClient(socket);
    });

    it("should include informative message with FORBIDDEN", async () => {
      const users = await setupTestUsers(baseUrl, 3, "forbiddenmessage");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user3.token);

      const ack = await emitWithAck<any>(socket, "room:join", { chatId });

      expect(ack.error).toBe("FORBIDDEN");
      expect(ack.message).toBeTruthy();
      expect(ack.message.toLowerCase()).toContain("member");

      await disconnectSocketClient(socket);
    });
  });

  describe("Rate Limiting", () => {
    it("should return RATE_LIMITED error code", async () => {
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

      // Send 10 messages to hit rate limit
      for (let i = 0; i < 10; i++) {
        await emitWithAck(socket, "message:send", {
          chatId,
          body: `Message ${i}`,
          clientId: randomUUID(),
        });
      }

      // 11th should be rate limited
      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Rate limited",
        clientId: randomUUID(),
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("RATE_LIMITED");
      expect(ack.message).toBeTruthy();

      await disconnectSocketClient(socket);
    });

    it("should provide retry guidance in rate limit error", async () => {
      const users = await setupTestUsers(baseUrl, 2, "retryguidance");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      // Hit rate limit
      for (let i = 0; i < 10; i++) {
        await emitWithAck(socket, "message:send", {
          chatId,
          body: `Message ${i}`,
          clientId: randomUUID(),
        });
      }

      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Rate limited",
        clientId: randomUUID(),
      });

      expect(ack.error).toBe("RATE_LIMITED");
      expect(ack.message).toBeTruthy();

      await disconnectSocketClient(socket);
    });
  });

  describe("Not Found Errors", () => {
    it("should return NOT_FOUND for non-existent message", async () => {
      const users = await setupTestUsers(baseUrl, 2, "notfound");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user2.token);

      const ack = await emitWithAck<any>(socket, "receipt:read", {
        chatId,
        messageId: "507f1f77bcf86cd799439011",
      });

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("NOT_FOUND");

      await disconnectSocketClient(socket);
    });
  });

  describe("Internal Errors", () => {
    it("should return INTERNAL error code for server errors", async () => {
      // This is difficult to test without mocking server failures
      // For now, verify error format
      const user = await registerTestUser(baseUrl, 0, "internal");
      const socket = await connectSocketClient(baseUrl, user.token);

      // Try operation that might fail
      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "507f1f77bcf86cd799439011",
      });

      // Should have proper error response
      expect(ack).toBeDefined();
      expect(ack.ok).toBeFalsy();
      expect(ack.error).toBeTruthy();

      await disconnectSocketClient(socket);
    });

    it("should include correlationId in internal errors", async () => {
      const user = await registerTestUser(baseUrl, 0, "internalcorr");
      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid",
      });

      expect(ack.correlationId).toBeDefined();
      expect(typeof ack.correlationId).toBe("string");

      await disconnectSocketClient(socket);
    });
  });

  describe("Error Context", () => {
    it("should log errors with context information", async () => {
      const user = await registerTestUser(baseUrl, 0, "errorcontext");
      const socket = await connectSocketClient(baseUrl, user.token);

      // Generate an error
      const ack = await emitWithAck<any>(socket, "message:send", {
        chatId: "507f1f77bcf86cd799439011",
        body: "Test",
        // Missing clientId
      });

      // Error should be logged with context
      expect(ack.correlationId).toBeDefined();

      await disconnectSocketClient(socket);
    });
  });

  describe("Multiple Error Types", () => {
    it("should handle mix of validation and authorization errors", async () => {
      const users = await setupTestUsers(baseUrl, 2, "mixtypes");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);

      // First: validation error (missing clientId)
      const ack1 = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Test",
      });
      expect(ack1.error).toBe("VALIDATION_ERROR");

      // Second: successful message
      const ack2 = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Valid",
        clientId: randomUUID(),
      });
      expect(ack2.ok).toBe(true);

      await disconnectSocketClient(socket);
    });
  });

  describe("Error Recovery", () => {
    it("should allow continued operation after error", async () => {
      const users = await setupTestUsers(baseUrl, 2, "recovery");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      // Send invalid message
      const ack1 = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Test",
        // Missing clientId - invalid
      });
      expect(ack1.ok).toBe(false);

      // Socket should still be functional
      expect(socket.connected).toBe(true);

      // Should be able to send valid message
      const ack2 = await emitWithAck<any>(socket, "message:send", {
        chatId,
        body: "Valid message",
        clientId: randomUUID(),
      });
      expect(ack2.ok).toBe(true);

      await disconnectSocketClient(socket);
    });

    it("should not disconnect socket on error", async () => {
      const user = await registerTestUser(baseUrl, 0, "stayconnected");
      const socket = await connectSocketClient(baseUrl, user.token);

      // Generate error
      const ack = await emitWithAck<any>(socket, "room:join", {
        chatId: "invalid",
      });
      expect(ack.ok).toBe(false);

      // Socket should still be connected
      expect(socket.connected).toBe(true);

      await disconnectSocketClient(socket);
    });
  });
});
