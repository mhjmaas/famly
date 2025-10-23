import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { registerTestUser, setupTestUsers } from "../helpers/auth-setup";

describe("E2E: GET /v1/chats/:chatId - Get Chat", () => {
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
    it("should get chat by ID for member", async () => {
      const users = await setupTestUsers(baseUrl, 2, "getchatuser");
      const user1 = users[0];
      const user2 = users[1];

      // User1 creates DM with User2
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = createResponse.body._id;

      // Get chat as User1 (creator/member)
      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty("_id", chatId);
      expect(getResponse.body).toHaveProperty("type", "dm");
      expect(getResponse.body).toHaveProperty("title", null);
      expect(getResponse.body).toHaveProperty("createdBy", user1.userId);
      expect(getResponse.body).toHaveProperty("memberIds");
      expect(getResponse.body.memberIds).toContain(user1.userId);
      expect(getResponse.body.memberIds).toContain(user2.userId);
      expect(getResponse.body).toHaveProperty("createdAt");
      expect(getResponse.body).toHaveProperty("updatedAt");
    });

    it("should get group chat with all members", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupgetuser");
      const creator = users[0];
      const member1 = users[1];
      const member2 = users[2];

      // Create group chat
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member1.userId, member2.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Get chat as creator
      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${creator.token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(chatId);
      expect(getResponse.body.type).toBe("group");
      expect(getResponse.body.title).toBe("Test Group");
      expect(getResponse.body.memberIds).toHaveLength(3);
      expect(getResponse.body.memberIds).toContain(creator.userId);
      expect(getResponse.body.memberIds).toContain(member1.userId);
      expect(getResponse.body.memberIds).toContain(member2.userId);
    });

    it("should allow any member to get group chat", async () => {
      const users = await setupTestUsers(baseUrl, 3, "membergetuser");
      const creator = users[0];
      const member1 = users[1];
      const member2 = users[2];

      // Create group chat
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member1.userId, member2.userId],
          title: "Shared Group",
        });

      const chatId = createResponse.body._id;

      // Get chat as member1
      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${member1.token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(chatId);
      expect(getResponse.body.title).toBe("Shared Group");
    });

    it("should return complete DTO with string IDs", async () => {
      const users = await setupTestUsers(baseUrl, 2, "dtotypeuser");
      const user1 = users[0];
      const user2 = users[1];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = createResponse.body._id;

      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(getResponse.status).toBe(200);

      // Verify all IDs are strings
      expect(typeof getResponse.body._id).toBe("string");
      expect(typeof getResponse.body.createdBy).toBe("string");
      expect(Array.isArray(getResponse.body.memberIds)).toBe(true);
      getResponse.body.memberIds.forEach((id: any) => {
        expect(typeof id).toBe("string");
      });

      // Verify timestamps are ISO strings
      expect(new Date(getResponse.body.createdAt)).not.toBeNaN();
      expect(new Date(getResponse.body.updatedAt)).not.toBeNaN();
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent chat", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "notfounduser");

      // Try to get non-existent chat
      const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format but doesn't exist

      const response = await request(baseUrl)
        .get(`/v1/chats/${fakeId}`)
        .set("Authorization", `Bearer ${user.token}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("not found");
    });

    it("should return 403 for non-member", async () => {
      const users = await setupTestUsers(baseUrl, 3, "forbiddenuser");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // User1 creates chat with User2
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = createResponse.body._id;

      // User3 (not in chat) tries to get it
      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user3.token}`);

      expect(getResponse.status).toBe(403);
      expect(getResponse.body).toHaveProperty("error");
      expect(getResponse.body.error).toContain("not a member");
    });

    it("should return 401 without authentication", async () => {
      // Try to get without auth using a fake but valid ObjectId
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(baseUrl).get(`/v1/chats/${fakeId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid chat ID format", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "invalididuser");

      const response = await request(baseUrl)
        .get("/v1/chats/not-a-valid-id")
        .set("Authorization", `Bearer ${user.token}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("format");
    });

    it("should reject invalid ObjectId formats", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "invalidobjectiduser");

      // Test IDs that are not 24 hex characters
      const invalidIds = [
        "123",                           // Too short
        "xyz123",                        // Non-hex characters
        "12345678901234567890123x",     // Invalid hex character at end
        "12345678901234567890123g",     // Invalid hex character
      ];

      for (const invalidId of invalidIds) {
        const response = await request(baseUrl)
          .get(`/v1/chats/${invalidId}`)
          .set("Authorization", `Bearer ${user.token}`);

        expect(response.status).toBe(400);
      }
    });
  });

  describe("DM vs Group Chat", () => {
    it("should return DM chat with null title", async () => {
      const users = await setupTestUsers(baseUrl, 2, "dmgetuser");
      const user1 = users[0];
      const user2 = users[1];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = createResponse.body._id;

      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.type).toBe("dm");
      expect(getResponse.body.title).toBeNull();
    });

    it("should return group chat with title", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupgetuser2");
      const creator = users[0];
      const member = users[1];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Family Chat",
        });

      const chatId = createResponse.body._id;

      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${creator.token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.type).toBe("group");
      expect(getResponse.body.title).toBe("Family Chat");
    });
  });

  describe("Member Access Rights", () => {
    it("should allow both DM participants to access chat", async () => {
      const users = await setupTestUsers(baseUrl, 2, "dmaccessuser");
      const user1 = users[0];
      const user2 = users[1];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = createResponse.body._id;

      // User1 can access
      const response1 = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(response1.status).toBe(200);

      // User2 can also access
      const response2 = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user2.token}`);

      expect(response2.status).toBe(200);
      expect(response2.body._id).toBe(chatId);
    });

    it("should allow any group member to access", async () => {
      const users = await setupTestUsers(baseUrl, 4, "groupaccessuser");
      const creator = users[0];
      const member1 = users[1];
      const member2 = users[2];
      const nonMember = users[3];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member1.userId, member2.userId],
          title: "Access Test Group",
        });

      const chatId = createResponse.body._id;

      // Creator can access
      const creatorResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${creator.token}`);
      expect(creatorResponse.status).toBe(200);

      // Members can access
      const member1Response = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${member1.token}`);
      expect(member1Response.status).toBe(200);

      const member2Response = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${member2.token}`);
      expect(member2Response.status).toBe(200);

      // Non-member cannot access
      const nonMemberResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${nonMember.token}`);
      expect(nonMemberResponse.status).toBe(403);
    });
  });

  describe("Consistency", () => {
    it("should return same data as created chat", async () => {
      const users = await setupTestUsers(baseUrl, 2, "consistencyuser");
      const user1 = users[0];
      const user2 = users[1];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const createdChat = createResponse.body;
      const chatId = createdChat._id;

      const getResponse = await request(baseUrl)
        .get(`/v1/chats/${chatId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      const retrievedChat = getResponse.body;

      // Compare key fields
      expect(retrievedChat._id).toBe(createdChat._id);
      expect(retrievedChat.type).toBe(createdChat.type);
      expect(retrievedChat.title).toBe(createdChat.title);
      expect(retrievedChat.createdBy).toBe(createdChat.createdBy);
      expect(retrievedChat.memberIds).toEqual(createdChat.memberIds);
    });
  });
});
