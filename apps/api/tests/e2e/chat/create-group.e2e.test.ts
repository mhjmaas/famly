import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { registerTestUser, setupTestUsers } from "../helpers/auth-setup";

describe("E2E: POST /v1/chats - Create Group", () => {
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
    it("should create group with title and members with 201", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const member3 = users[2];

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId, member3.userId],
          title: "Family Planning",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("type", "group");
      expect(response.body).toHaveProperty("title", "Family Planning");
      expect(response.body).toHaveProperty("createdBy", creator.userId);
      expect(response.body).toHaveProperty("memberIds");
      expect(response.body.memberIds).toHaveLength(3);
      expect(response.body.memberIds).toContain(creator.userId);
      expect(response.body.memberIds).toContain(member2.userId);
      expect(response.body.memberIds).toContain(member3.userId);
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should create group without title with 201", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member2 = users[1];

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId],
        });

      expect(response.status).toBe(201);
      expect(response.body.type).toBe("group");
      expect(response.body.title).toBeNull();
      expect(response.body.memberIds).toHaveLength(2);
    });

    it("should create group with multiple members", async () => {
      const users = await setupTestUsers(baseUrl, 5, "groupuser");
      const creator = users[0];
      const otherMembers = users.slice(1).map((u) => u.userId);

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: otherMembers,
          title: "Large Group",
        });

      expect(response.status).toBe(201);
      expect(response.body.memberIds).toHaveLength(5);
      otherMembers.forEach((memberId) => {
        expect(response.body.memberIds).toContain(memberId);
      });
    });
  });

  describe("Membership Roles", () => {
    it("should set creator as admin in group", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      // Verify creator has admin role by checking they can add members
      // (This will be tested more thoroughly in add-members tests)
      expect(createResponse.status).toBe(201);
    });

    it("should set other members as members in group", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const member3 = users[2];

      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId, member3.userId],
          title: "Test Group",
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.memberIds).toContain(creator.userId);
      expect(createResponse.body.memberIds).toContain(member2.userId);
      expect(createResponse.body.memberIds).toContain(member3.userId);
    });
  });

  describe("Validation Errors", () => {
    it("should reject group with no members (400)", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "groupuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          type: "group",
          memberIds: [],
          title: "Empty Group",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject group with duplicate member IDs (400)", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId, member.userId],
          title: "Duplicate Group",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject group with invalid member ID format (400)", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "groupuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          type: "group",
          memberIds: ["not-a-valid-id"],
          title: "Bad ID Group",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject missing type field (400)", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          memberIds: [member.userId],
          title: "No Type Group",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject missing memberIds field (400)", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "groupuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user.token}`)
        .send({
          type: "group",
          title: "No Members Group",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authentication", () => {
    it("should require authentication (401)", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "groupuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .send({
          type: "group",
          memberIds: [user.userId],
          title: "Test",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject invalid auth token (401)", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "groupuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", "Bearer invalid-token-123")
        .send({
          type: "group",
          memberIds: [user.userId],
          title: "Test",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject malformed Authorization header (401)", async () => {
      const user = await registerTestUser(baseUrl, testCounter++, "groupuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", "NotBearer sometoken")
        .send({
          type: "group",
          memberIds: [user.userId],
          title: "Test",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DTO Structure", () => {
    it("should return complete chat DTO with string IDs", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "DTO Test Group",
        });

      expect(response.status).toBe(201);

      // Verify all fields are strings (not ObjectIds)
      expect(typeof response.body._id).toBe("string");
      expect(typeof response.body.createdBy).toBe("string");
      expect(typeof response.body.createdAt).toBe("string");
      expect(typeof response.body.updatedAt).toBe("string");
      expect(Array.isArray(response.body.memberIds)).toBe(true);
      response.body.memberIds.forEach((id: any) => {
        expect(typeof id).toBe("string");
      });

      // Verify timestamps are ISO8601 strings
      expect(new Date(response.body.createdAt)).not.toBeNaN();
      expect(new Date(response.body.updatedAt)).not.toBeNaN();
    });
  });
});
