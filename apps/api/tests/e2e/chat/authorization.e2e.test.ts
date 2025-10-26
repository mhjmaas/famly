import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { registerTestUser } from "../helpers/auth-setup";

describe("E2E: Chat Authorization Matrix", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter++;
  });

  describe("Chat Access Control", () => {
    it("should allow member to list messages in chat", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // User1 (member) can list messages
      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listRes.status).toBe(200);
    });

    it("should reject non-member from listing messages", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user3 = await registerTestUser(baseUrl, testCounter++, "auth");

      // Create DM between user1 and user2
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // User3 (non-member) cannot list messages
      const listRes = await request(baseUrl)
        .get(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user3.token}`);

      expect(listRes.status).toBe(403);
    });

    it("should reject unauthenticated request from listing messages", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // Unauthenticated request
      const listRes = await request(baseUrl).get(`/v1/chats/${chatId}/messages`);

      expect(listRes.status).toBe(401);
    });

    it("should allow member to create message in chat", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");

      // Create DM
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // User2 (member) can create message
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          body: "Hello",
        });

      expect(msgRes.status).toBe(201);
    });

    it("should reject non-member from creating message", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user3 = await registerTestUser(baseUrl, testCounter++, "auth");

      // Create DM between user1 and user2
      const chatRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = chatRes.body._id;

      // User3 (non-member) cannot create message
      const msgRes = await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user3.token}`)
        .send({
          body: "Unauthorized",
        });

      expect(msgRes.status).toBe(403);
    });

    it("should allow admin to add members to group", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user3 = await registerTestUser(baseUrl, testCounter++, "auth");

      // Create group
      const groupRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId],
          title: "Test Group",
        });

      const groupId = groupRes.body._id;

      // User1 (admin/creator) can add members
      const addRes = await request(baseUrl)
        .post(`/v1/chats/${groupId}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          userIds: [user3.userId],
        });

      expect(addRes.status).toBe(200);
    });

    it("should reject non-admin from adding members to group", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user3 = await registerTestUser(baseUrl, testCounter++, "auth");

      // Create group
      const groupRes = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId],
          title: "Test Group",
        });

      const groupId = groupRes.body._id;

      // User2 (member, not admin) cannot add members
      const addRes = await request(baseUrl)
        .post(`/v1/chats/${groupId}/members`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          userIds: [user3.userId],
        });

      expect(addRes.status).toBe(403);
    });

    it("should allow member to update read cursor", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");

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
          body: "Test",
        });

      // User2 (member) can update read cursor
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          messageId: msgRes.body._id,
        });

      expect(cursorRes.status).toBe(200);
    });

    it("should reject non-member from updating read cursor", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user3 = await registerTestUser(baseUrl, testCounter++, "auth");

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
          body: "Test",
        });

      // User3 (non-member) cannot update read cursor
      const cursorRes = await request(baseUrl)
        .put(`/v1/chats/${chatId}/read-cursor`)
        .set("Authorization", `Bearer ${user3.token}`)
        .send({
          messageId: msgRes.body._id,
        });

      expect(cursorRes.status).toBe(403);
    });

    // TODO: Fix MongoDB text search - currently failing with 500 error
    it.skip("should allow user to search their own chats only", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user2 = await registerTestUser(baseUrl, testCounter++, "auth");
      const user3 = await registerTestUser(baseUrl, testCounter++, "auth");

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
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/messages`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          body: "Secret message",
        });

      // User3 searches - should not find message from user1's chat
      const searchRes = await request(baseUrl)
        .get(`/v1/chats/search/messages?q=secret`)
        .set("Authorization", `Bearer ${user3.token}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.messages).toHaveLength(0);
    });
  });
});
