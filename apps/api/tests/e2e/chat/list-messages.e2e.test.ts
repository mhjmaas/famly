import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { registerTestUser } from "../helpers/auth-setup";

describe("E2E: GET /v1/chats/:chatId/messages - List Messages", () => {
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
    it("should list messages for a chat", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create multiple messages
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 1",
        });

      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          body: "Message 2",
        });

      // List messages
      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveProperty("messages");
      expect(Array.isArray(listRes.body.messages)).toBe(true);
      expect(listRes.body.messages.length).toBe(2);
      // No nextCursor when all messages fit in one page
      expect(listRes.body).not.toHaveProperty("nextCursor");

      // Messages should be sorted by createdAt descending (newest first)
      const msg1 = listRes.body.messages[0];
      const msg2 = listRes.body.messages[1];

      expect(msg1).toHaveProperty("_id");
      expect(msg1).toHaveProperty("chatId", chatId);
      expect(msg1).toHaveProperty("senderId");
      expect(msg1).toHaveProperty("body");
      expect(msg1).toHaveProperty("createdAt");
      expect(msg1).toHaveProperty("deleted");

      // Verify order (newest first)
      expect(msg1.body).toBe("Message 2");
      expect(msg2.body).toBe("Message 1");
    });

    it("should return empty list for chat with no messages", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM (no messages)
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // List messages
      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.messages).toEqual([]);
      expect(listRes.body).not.toHaveProperty("nextCursor");
    });

    it("should paginate messages with before cursor", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create 5 messages
      for (let i = 0; i < 5; i++) {
        await request(baseUrl)
          .post(`/v1/chats/${chatId}/messages`)
          .set("Authorization", `Bearer ${user1.token}`)
          .send({
            chatId,
            body: `Message ${i + 1}`,
          });
      }

      // Get first page (limit=2)
      const page1Res = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages?limit=2`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.messages.length).toBe(2);
      expect(page1Res.body.nextCursor).toBeDefined();

      // Get second page using cursor
      const page2Res = await request(baseUrl)
        .get(
          `/v1/chats/${chatId}/messages?limit=2&before=${page1Res.body.nextCursor}`
        )
        .set("Authorization", `Bearer ${user1.token}`);

      expect(page2Res.status).toBe(200);
      expect(page2Res.body.messages.length).toBe(2);

      // Verify different messages on each page
      const page1MessageIds = page1Res.body.messages.map((m: any) => m._id);
      const page2MessageIds = page2Res.body.messages.map((m: any) => m._id);

      // No overlap between pages
      expect(
        page1MessageIds.some((id: string) => page2MessageIds.includes(id))
      ).toBe(false);
    });

    it("should use default limit of 50", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create 30 messages (less than default 50)
      for (let i = 0; i < 30; i++) {
        await request(baseUrl)
          .post(`/v1/chats/${chatId}/messages`)
          .set("Authorization", `Bearer ${user1.token}`)
          .send({
            chatId,
            body: `Message ${i + 1}`,
          });
      }

      // List without limit parameter
      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.messages.length).toBe(30);
      expect(listRes.body).not.toHaveProperty("nextCursor");
    });
  });

  describe("Pagination Validation", () => {
    it("should reject invalid limit (> 200) with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages?limit=500`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(400);
    });

    it("should reject invalid before cursor format with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages?before=not-an-object-id`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(400);
    });

    it("should accept limit=1", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create message
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Only message",
        });

      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages?limit=1`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.messages.length).toBe(1);
    });

    it("should accept limit=200", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages?limit=200`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(200);
    });
  });

  describe("Authorization Errors", () => {
    it("should require authentication with 401", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Try to list without auth
      const listRes = await request(baseUrl).get(
        `/v1/chats/${chatId}/messages`
      );

      expect(listRes.status).toBe(401);
    });

    it("should reject non-member listing messages with 403", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");
      const user3 = await registerTestUser(baseUrl, testCounter++, "list");

      // Create DM between user1 and user2
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // User3 (non-member) tries to list messages
      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user3.token}`);

      expect(listRes.status).toBe(403);
    });
  });

  describe("Message Details", () => {
    it("should include all message fields in response", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "list");
      const user2 = await registerTestUser(baseUrl, testCounter++, "list");

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
      const createRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          clientId: "test-123",
          body: "Test message",
        });

      const messageId = createRes.body._id;

      // List messages
      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`);

      const message = listRes.body.messages[0];

      expect(message._id).toBe(messageId);
      expect(message.chatId).toBe(chatId);
      expect(message.senderId).toBe(user1.userId);
      expect(message.body).toBe("Test message");
      expect(message.clientId).toBe("test-123");
      expect(message.deleted).toBe(false);
      expect(message.createdAt).toBeDefined();
      // editedAt should be undefined for new messages
      expect(message.editedAt).toBeUndefined();
    });
  });
});
