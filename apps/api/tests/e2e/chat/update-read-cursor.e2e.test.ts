import request from "supertest";
import { registerTestUser } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PUT /v1/chats/:chatId/read-cursor - Update Read Cursor", () => {
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
    it("should update read cursor to mark messages as read", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create 3 messages
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 1",
        });

      const msg2Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 2",
        });

      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 3",
        });

      // Mark message 2 as read
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msg2Res.body._id,
        });

      expect(cursorRes.status).toBe(200);
      expect(cursorRes.body).toHaveProperty("_id");
      expect(cursorRes.body).toHaveProperty("chatId", chatId);
      expect(cursorRes.body).toHaveProperty("userId", user2.userId);
      expect(cursorRes.body).toHaveProperty(
        "lastReadMessageId",
        msg2Res.body._id,
      );
      expect(cursorRes.body).toHaveProperty("role");
      expect(cursorRes.body).toHaveProperty("createdAt");
      expect(cursorRes.body).toHaveProperty("updatedAt");
    });

    it("should not update read cursor if new message is older", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create 3 messages
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const msg1Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 1",
        });

      const msg2Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 2",
        });

      // Update to msg2
      const cursorRes1 = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msg2Res.body._id,
        });

      expect(cursorRes1.body.lastReadMessageId).toBe(msg2Res.body._id);

      // Try to update to msg1 (older)
      const cursorRes2 = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msg1Res.body._id,
        });

      // Should return the membership but with msg2 still as lastReadMessageId
      expect(cursorRes2.status).toBe(200);
      expect(cursorRes2.body.lastReadMessageId).toBe(msg2Res.body._id);
    });

    it("should update read cursor from no messages read to first message", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

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
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "First message",
        });

      // Mark as read (user2 starts with no lastReadMessageId)
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msgRes.body._id,
        });

      expect(cursorRes.status).toBe(200);
      expect(cursorRes.body.lastReadMessageId).toBe(msgRes.body._id);
    });

    it("should work for group chats", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

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

      // Update read cursor
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msgRes.body._id,
        });

      expect(cursorRes.status).toBe(200);
      expect(cursorRes.body.lastReadMessageId).toBe(msgRes.body._id);
    });

    it("should allow multiple updates by same user", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create 3 messages
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const msg1Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 1",
        });

      const msg2Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 2",
        });

      const msg3Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 3",
        });

      // Update to msg1
      await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msg1Res.body._id,
        });

      // Update to msg2
      await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msg2Res.body._id,
        });

      // Update to msg3
      const finalRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msg3Res.body._id,
        });

      expect(finalRes.status).toBe(200);
      expect(finalRes.body.lastReadMessageId).toBe(msg3Res.body._id);
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid messageId format with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: "not-an-object-id",
        });

      expect(cursorRes.status).toBe(400);
    });

    it("should reject missing messageId with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({});

      expect(cursorRes.status).toBe(400);
    });

    it("should reject non-existent messageId with 404", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Try to set non-existent message as read
      const fakeMessageId = (
        await registerTestUser(baseUrl, testCounter++, "fake")
      ).userId; // Use a valid ObjectId format

      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: fakeMessageId,
        });

      expect(cursorRes.status).toBe(404);
    });

    it("should reject message from different chat with 400", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user3 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM1 between user1 and user2
      const chat1Res = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      // Create DM2 between user1 and user3
      const chat2Res = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user3.userId],
        });

      // Create message in chat1
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chat1Res.body._id}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message in chat1",
        });

      // Try to set chat1's message as read in chat2
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chat2Res.body._id}/read-cursor`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          messageId: msgRes.body._id,
        });

      expect(cursorRes.status).toBe(400);
    });
  });

  describe("Authorization Errors", () => {
    it("should require authentication with 401", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

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
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Test message",
        });

      // Try without auth
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .send({
          messageId: msgRes.body._id,
        });

      expect(cursorRes.status).toBe(401);
    });

    it("should reject non-member updating read cursor with 403", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user3 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM between user1 and user2
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create message
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Test message",
        });

      // User3 (non-member) tries to update read cursor
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user3.token}`)
        .send({
          messageId: msgRes.body._id,
        });

      expect(cursorRes.status).toBe(403);
    });
  });

  describe("Unread Count Integration", () => {
    it("should update unread count after marking messages as read", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "cursor");
      const user2 = await registerTestUser(baseUrl, testCounter++, "cursor");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Create 3 messages
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const msg1Res = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 1",
        });

      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 2",
        });

      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Message 3",
        });

      // Initially user2 has 3 unread messages
      let listChatsRes = await request(baseUrl)
        .get(`/v1/chats`)
        .set("Authorization", `Bearer ${user2.token}`);

      let chat = listChatsRes.body.chats.find((c: any) => c._id === chatId);
      expect(chat.unreadCount).toBe(3);

      // Mark message 1 as read
      await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msg1Res.body._id,
        });

      // Now user2 should have 2 unread messages
      listChatsRes = await request(baseUrl)
        .get(`/v1/chats`)
        .set("Authorization", `Bearer ${user2.token}`);

      chat = listChatsRes.body.chats.find((c: any) => c._id === chatId);
      expect(chat.unreadCount).toBe(2);
    });
  });
});
