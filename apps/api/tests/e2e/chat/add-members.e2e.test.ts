import request from "supertest";
import { setupTestUsers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/chats/:chatId/members - Add Members", () => {
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
    it("should add single member to group with 200", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const newMember = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Add member
      const addResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          userIds: [newMember.userId],
        });

      expect(addResponse.status).toBe(200);
      expect(addResponse.body.memberIds).toHaveLength(3);
      expect(addResponse.body.memberIds).toContain(creator.userId);
      expect(addResponse.body.memberIds).toContain(member2.userId);
      expect(addResponse.body.memberIds).toContain(newMember.userId);
    });

    it("should add multiple members at once with 200", async () => {
      const users = await setupTestUsers(baseUrl, 5, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const newMembers = users.slice(2);

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Add multiple members
      const addResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          userIds: newMembers.map((u) => u.userId),
        });

      expect(addResponse.status).toBe(200);
      expect(addResponse.body.memberIds).toHaveLength(5);
      newMembers.forEach((member) => {
        expect(addResponse.body.memberIds).toContain(member.userId);
      });
    });
  });

  describe("Validation Errors", () => {
    it("should reject adding members to DM with 400", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Create DM
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = createResponse.body._id;

      // Try to add member
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          userIds: [user3.userId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject adding already-existing member with 400", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try to add existing member
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          userIds: [member2.userId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject empty userIds array with 400", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try to add with empty array
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          userIds: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject duplicate member IDs with 400", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const newMember = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try to add with duplicates
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          userIds: [newMember.userId, newMember.userId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject invalid user ID format with 400", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try to add with invalid ID
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          userIds: ["not-a-valid-id"],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authorization", () => {
    it("should reject non-admin adding members with 403", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const newMember = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try to add member as non-admin
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${member2.token}`)
        .send({
          userIds: [newMember.userId],
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it("should reject non-member adding members with 403", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member = users[1];
      const nonMember = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try to add member as non-member
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${nonMember.token}`)
        .send({
          userIds: [member.userId],
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it("should require authentication with 401", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try without auth
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .send({
          userIds: [member.userId],
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DTO Structure", () => {
    it("should return complete updated chat DTO", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const newMember = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Add member
      const response = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          userIds: [newMember.userId],
        });

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(chatId);
      expect(response.body.type).toBe("group");
      expect(response.body.title).toBe("Test Group");
      expect(response.body.createdBy).toBe(creator.userId);
      expect(Array.isArray(response.body.memberIds)).toBe(true);
      expect(response.body.memberIds).toHaveLength(3);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });
  });
});
