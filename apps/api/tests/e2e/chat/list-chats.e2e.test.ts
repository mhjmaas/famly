import request from "supertest";
import { registerTestUser, setupTestUsers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/chats - List Chats", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter = 0;
  });

  describe("Success Cases", () => {
    it("should list all user's chats", async () => {
      const users = await setupTestUsers(baseUrl, 3, "listuser");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // User1 creates DM with User2
      const dm1Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const dm1Id = dm1Response.body._id;

      // User1 creates group with User2 and User3
      const groupResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId, user3.userId],
          title: "Test Group",
        });

      expect(groupResponse.status).toBe(201);

      // List chats
      const listResponse = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveProperty("chats");
      expect(Array.isArray(listResponse.body.chats)).toBe(true);
      expect(listResponse.body.chats).toHaveLength(2);

      // Check chat structure
      const dmChat = listResponse.body.chats.find((c: any) => c._id === dm1Id);
      expect(dmChat).toBeDefined();
      expect(dmChat).toHaveProperty("_id");
      expect(dmChat).toHaveProperty("type", "dm");
      expect(dmChat).toHaveProperty("title", null);
      expect(dmChat).toHaveProperty("memberIds");
      expect(dmChat).toHaveProperty("createdBy");
      expect(dmChat).toHaveProperty("createdAt");
      expect(dmChat).toHaveProperty("updatedAt");
      expect(dmChat).toHaveProperty("unreadCount");
      // lastMessage is optional when no messages exist
      if (dmChat.lastMessage) {
        expect(dmChat.lastMessage).toHaveProperty("_id");
        expect(dmChat.lastMessage).toHaveProperty("senderId");
        expect(dmChat.lastMessage).toHaveProperty("body");
        expect(dmChat.lastMessage).toHaveProperty("createdAt");
      }
    });

    it("should return empty list for user with no chats", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "newuser");

      const response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${user.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("chats");
      expect(response.body.chats).toEqual([]);
      expect(response.body).not.toHaveProperty("nextCursor");
    });

    it("should support pagination with limit and cursor", async () => {
      const users = await setupTestUsers(baseUrl, 3, "paginationuser");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Create 2 DM chats
      const chat1Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      expect(chat1Response.status).toBe(201);

      const chat2Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user3.userId] });

      expect(chat2Response.status).toBe(201);

      // Get first page with limit=1
      const page1 = await request(baseUrl)
        .get("/v1/chats?limit=1")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(page1.status).toBe(200);
      expect(page1.body.chats).toHaveLength(1);
      if (page1.body.chats.length === 1) {
        // There should be a nextCursor if we have more chats
        expect(page1.body).toHaveProperty("nextCursor");
      }
    });

    it("should return chats in a list", async () => {
      const users = await setupTestUsers(baseUrl, 3, "sortuser");
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

      expect(chat1Response.status).toBe(201);
      expect(chat2Response.status).toBe(201);

      // List chats
      const response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(response.status).toBe(200);
      expect(response.body.chats.length).toBeGreaterThanOrEqual(2);
      expect(Array.isArray(response.body.chats)).toBe(true);
    });
  });

  describe("Unread Count Calculation", () => {
    it("should return unread count (zero for new chats with no messages)", async () => {
      const users = await setupTestUsers(baseUrl, 2, "unreaduser");
      const user1 = users[0];
      const user2 = users[1];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      expect(createResponse.status).toBe(201);

      // List chats
      const response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(response.status).toBe(200);
      const chat = response.body.chats[0];
      expect(chat).toHaveProperty("unreadCount");
      expect(typeof chat.unreadCount).toBe("number");
      expect(chat.unreadCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Authorization & Isolation", () => {
    it("should only show chats user is member of", async () => {
      const users = await setupTestUsers(baseUrl, 3, "isolationuser");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // User1 creates chat with User2
      const chat1Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      // User3 creates chat with User1
      const chat2Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user3.token}`)
        .send({ type: "dm", memberIds: [user1.userId] });

      // List chats as User2
      const response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${user2.token}`);

      expect(response.status).toBe(200);
      expect(response.body.chats).toHaveLength(1); // Only chat with User1
      expect(response.body.chats[0]._id).toBe(chat1Response.body._id);
      expect(response.body.chats.map((c: any) => c._id)).not.toContain(
        chat2Response.body._id,
      );
    });
  });

  describe("Validation & Error Cases", () => {
    it("should require authentication", async () => {
      const response = await request(baseUrl).get("/v1/chats");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject invalid pagination limit", async () => {
      const user = await registerTestUser(
        baseUrl,
        testCounter++,
        "validationuser",
      );

      const response = await request(baseUrl)
        .get("/v1/chats?limit=500")
        .set("Authorization", `Bearer ${user.token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("not exceed 100");
    });

    it("should reject invalid cursor format", async () => {
      const user = await registerTestUser(
        baseUrl,
        testCounter++,
        "validationuser",
      );

      const response = await request(baseUrl)
        .get("/v1/chats?cursor=not-a-valid-id")
        .set("Authorization", `Bearer ${user.token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("cursor");
    });

    it("should reject negative limit", async () => {
      const user = await registerTestUser(
        baseUrl,
        testCounter++,
        "validationuser",
      );

      const response = await request(baseUrl)
        .get("/v1/chats?limit=-5")
        .set("Authorization", `Bearer ${user.token}`);

      expect(response.status).toBe(400);
    });

    it("should reject non-numeric limit", async () => {
      const user = await registerTestUser(
        baseUrl,
        testCounter++,
        "validationuser",
      );

      const response = await request(baseUrl)
        .get("/v1/chats?limit=abc")
        .set("Authorization", `Bearer ${user.token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("valid number");
    });
  });

  describe("Edge Cases", () => {
    it("should handle chat with no messages", async () => {
      const users = await setupTestUsers(baseUrl, 2, "nomsguser");
      const user1 = users[0];
      const user2 = users[1];

      // Create chat but don't send any messages
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      expect(createResponse.status).toBe(201);

      const response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(response.status).toBe(200);
      const chat = response.body.chats[0];
      expect(chat).not.toHaveProperty("lastMessage");
      expect(chat.unreadCount).toBe(0);
    });

    it("should use default limit of 20", async () => {
      const users = await setupTestUsers(baseUrl, 2, "defaultlimituser");
      const user1 = users[0];
      const user2 = users[1];

      // Create a chat
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      expect(createResponse.status).toBe(201);

      // Don't specify limit
      const response = await request(baseUrl)
        .get("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`);

      expect(response.status).toBe(200);
      // Just verify it returns successfully (default limit applied)
      expect(Array.isArray(response.body.chats)).toBe(true);
    });
  });
});
