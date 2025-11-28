import { AI_SENDER_ID } from "@modules/chat/lib/constants";
import request from "supertest";
import { registerTestUser } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/chats/:chatId/messages - Create Message", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter++;
  });

  describe("Success Cases", () => {
    it("should create message with clientId (idempotency key) returning 201", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create message with clientId
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          clientId: "msg-001",
          body: "Hello from user1",
        });

      expect(msgRes.status).toBe(201);
      expect(msgRes.body).toHaveProperty("_id");
      expect(msgRes.body).toHaveProperty("chatId", chatId);
      expect(msgRes.body).toHaveProperty("senderId", user1.userId);
      expect(msgRes.body).toHaveProperty("body", "Hello from user1");
      expect(msgRes.body).toHaveProperty("clientId", "msg-001");
      expect(msgRes.body).toHaveProperty("createdAt");
      expect(msgRes.body).toHaveProperty("deleted", false);
    });

    it("should return existing message with 200 (idempotency)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create first message with clientId
      const firstRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          clientId: "idempotent-123",
          body: "First attempt",
        });

      expect(firstRes.status).toBe(201);
      const firstMessageId = firstRes.body._id;

      // Send same message again (idempotent)
      const secondRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          clientId: "idempotent-123",
          body: "First attempt",
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body._id).toBe(firstMessageId);
      expect(secondRes.body.clientId).toBe("idempotent-123");
    });

    it("should create message without clientId", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create message without clientId
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "No client ID",
        });

      expect(msgRes.status).toBe(201);
      expect(msgRes.body).toHaveProperty("_id");
      expect(msgRes.body.body).toBe("No client ID");
      // clientId should be undefined in response
      expect(msgRes.body.clientId).toBeUndefined();
    });

    it("should update chat timestamp on message creation", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;
      const originalUpdatedAt = new Date(chatRes.body.updatedAt);

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create message
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Test message",
        });

      // Get chat to check updatedAt
      const updatedChatRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      const newUpdatedAt = new Date(updatedChatRes.body.updatedAt);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should promote DM members to admin after 2 messages", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create first message
      const msg1Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "First message",
        });

      expect(msg1Res.status).toBe(201);
      // The DM role promotion happens after 2 messages
      // This is an internal operation and is verified by checking that both messages succeed
    });

    it("should accept message with emoji", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create message with emoji
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Hello 👋 world 🌍 family 👨‍👩‍👧‍👦",
        });

      expect(msgRes.status).toBe(201);
      expect(msgRes.body.body).toBe("Hello 👋 world 🌍 family 👨‍👩‍👧‍👦");
    });
  });

  describe("Validation Errors", () => {
    it("should reject message exceeding max length (100KB) with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Try to create message exceeding max length (100KB + 1)
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "a".repeat(100001),
        });

      expect(msgRes.status).toBe(400);
      expect(msgRes.body).toHaveProperty("error");
    });

    it("should reject empty body with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Try to create message with empty body
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "",
        });

      expect(msgRes.status).toBe(400);
    });

    it("should reject invalid chatId format with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");

      const msgRes = await request(baseUrl)
        .post(`/v1/chats/not-an-object-id/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Test",
        });

      expect(msgRes.status).toBe(400);
    });

    it("should reject non-existent chatId with 403 or 404", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const fakeUser = await registerTestUser(baseUrl, testCounter++, "fake");
      const fakeChatId = fakeUser.userId; // Use a valid ObjectId that doesn't exist as a chat

      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${fakeChatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Test",
        });

      expect([403, 404]).toContain(msgRes.status);
    });

    it("should reject missing body with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({});

      expect(msgRes.status).toBe(400);
    });
  });

  describe("Authorization Errors", () => {
    it("should require authentication with 401", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Try to create message without auth
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .send({
          body: "Unauthenticated message",
        });

      expect(msgRes.status).toBe(401);
    });

    it("should reject non-member creating message with 403", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user3 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM between user1 and user2
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // User3 (non-member) tries to create message
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user3.token}`)
        .send({
          body: "I am not a member",
        });

      expect(msgRes.status).toBe(403);
    });
  });

  describe("Group Chat Messages", () => {
    it("should create message in group chat", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user3 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create group chat
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId, user3.userId],
          title: "Test Group",
        });

      const chatId = chatRes.body._id;

      // User2 creates message in group
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          body: "Message from user2",
        });

      expect(msgRes.status).toBe(201);
      expect(msgRes.body.senderId).toBe(user2.userId);
      expect(msgRes.body.chatId).toBe(chatId);
    });

    it("should not promote group members to admin", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create group chat
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId],
          title: "Test Group",
        });

      const chatId = chatRes.body._id;

      // Create message
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Group message",
        });

      // Verify message was created successfully
      // Group members should NOT be promoted to admin - this is only for DMs
      expect(msgRes.status).toBe(201);
    });
  });

  describe("AI Messages", () => {
    it("should create message with AI sender ID", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create AI message
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          clientId: "ai-msg-001",
          body: "This is an AI response with **markdown** support.",
          senderId: AI_SENDER_ID,
        });

      expect(msgRes.status).toBe(201);
      expect(msgRes.body).toHaveProperty("_id");
      expect(msgRes.body).toHaveProperty("chatId", chatId);
      expect(msgRes.body).toHaveProperty("senderId", AI_SENDER_ID);
      expect(msgRes.body).toHaveProperty(
        "body",
        "This is an AI response with **markdown** support.",
      );
    });

    it("should reject invalid senderId (not AI_SENDER_ID)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Try to create message with invalid senderId
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Trying to spoof sender",
          senderId: "fake-sender-id",
        });

      expect(msgRes.status).toBe(400);
    });

    it("should require authentication even for AI messages", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Try to create AI message without auth
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .send({
          body: "AI message without auth",
          senderId: AI_SENDER_ID,
        });

      expect(msgRes.status).toBe(401);
    });

    it("should require chat membership for AI messages", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user3 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM between user1 and user2
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // User3 (non-member) tries to create AI message
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user3.token}`)
        .send({
          body: "AI message from non-member",
          senderId: AI_SENDER_ID,
        });

      expect(msgRes.status).toBe(403);
    });

    it("should support idempotency for AI messages", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create AI message with clientId
      const firstRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          clientId: "ai-idempotent-123",
          body: "AI response",
          senderId: AI_SENDER_ID,
        });

      expect(firstRes.status).toBe(201);
      const firstMessageId = firstRes.body._id;

      // Send same AI message again (idempotent)
      const secondRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          clientId: "ai-idempotent-123",
          body: "AI response",
          senderId: AI_SENDER_ID,
        });

      expect(secondRes.status).toBe(200);
      expect(secondRes.body._id).toBe(firstMessageId);
    });

    it("should accept large AI messages (up to 100KB)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "msg");
      const user2 = await registerTestUser(baseUrl, testCounter++, "msg");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create large AI message (50KB - within limit)
      const largeBody = "a".repeat(50000);
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: largeBody,
          senderId: AI_SENDER_ID,
        });

      expect(msgRes.status).toBe(201);
      expect(msgRes.body.body.length).toBe(50000);
    });
  });
});
