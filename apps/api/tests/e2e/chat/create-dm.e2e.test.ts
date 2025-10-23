import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { registerTestUser } from "../helpers/auth-setup";

describe("E2E: POST /v1/chats - Create DM", () => {
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
    it("should create new DM between two users with 201", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("type", "dm");
      expect(response.body).toHaveProperty("title", null);
      expect(response.body).toHaveProperty("createdBy", user1.userId);
      expect(response.body).toHaveProperty("memberIds");
      expect(response.body.memberIds).toContain(user1.userId);
      expect(response.body.memberIds).toContain(user2.userId);
      expect(response.body.memberIds).toHaveLength(2);
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should return existing DM with 200 (deduplication)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      // Create first DM
      const firstResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      expect(firstResponse.status).toBe(201);
      const firstChatId = firstResponse.body._id;

      // Try to create same DM again
      const secondResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body._id).toBe(firstChatId);
    });

    it("should allow reverse DM creation (user2 to user1)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      // User1 creates DM with User2
      const firstResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const firstChatId = firstResponse.body._id;

      // User2 tries to create DM with User1
      const secondResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user2.token}`)
        .send({
          type: "dm",
          memberIds: [user1.userId],
        });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body._id).toBe(firstChatId);
    });
  });

  describe("Validation Errors", () => {
    it("should reject DM with no members (400)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject DM with multiple members (400)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user3 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId, user3.userId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject DM with title (400)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
          title: "Private Chat",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject DM with invalid member ID format (400)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: ["not-a-valid-id"],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject DM with duplicate member IDs (400)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId, user2.userId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject missing type field (400)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          memberIds: [user2.userId],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject missing memberIds field (400)", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authentication", () => {
    it("should require authentication (401)", async () => {
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject invalid auth token (401)", async () => {
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", "Bearer invalid-token-123")
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject malformed Authorization header (401)", async () => {
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", "NotBearer sometoken")
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("DTO Structure", () => {
    it("should return complete chat DTO with string IDs", async () => {
      const user1 = await registerTestUser(baseUrl, testCounter++, "dmuser");
      const user2 = await registerTestUser(baseUrl, testCounter++, "dmuser");

      const response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
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
