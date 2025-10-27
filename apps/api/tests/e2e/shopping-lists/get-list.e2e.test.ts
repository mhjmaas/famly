import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/shopping-lists/:listId", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let listId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Get List User",
      familyName: "Test Family",
      prefix: "getlistuser",
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Create a test shopping list
    const listResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test List",
        tags: ["tag1", "tag2"],
        items: [{ name: "Item 1" }, { name: "Item 2" }],
      });

    listId = listResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should retrieve shopping list by id", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(listId);
      expect(response.body.name).toBe("Test List");
      expect(response.body.familyId).toBe(familyId);
    });

    it("should return all list properties", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const list = response.body;
      expect(list).toHaveProperty("_id");
      expect(list).toHaveProperty("name");
      expect(list).toHaveProperty("familyId");
      expect(list).toHaveProperty("tags");
      expect(list).toHaveProperty("items");
      expect(list).toHaveProperty("createdBy");
      expect(list).toHaveProperty("createdAt");
      expect(list).toHaveProperty("updatedAt");
    });

    it("should return items with correct structure", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0]).toHaveProperty("_id");
      expect(response.body.items[0]).toHaveProperty("name", "Item 1");
      expect(response.body.items[0]).toHaveProperty("checked", false);
      expect(response.body.items[0]).toHaveProperty("createdAt");
    });

    it("should return tags", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(["tag1", "tag2"]);
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent list", async () => {
      const fakeListId = "507f1f77bcf86cd799439999";
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${fakeListId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 for invalid list id format", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/shopping-lists/${listId}`,
      );

      expect(response.status).toBe(401);
    });

    it("should reject request from non-family member", async () => {
      testCounter++;
      const otherEmail = `other${testCounter}@example.com`;
      const otherRegisterResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: otherEmail,
          password: "SecurePassword123!",
          name: "Other User",
          birthdate: "1985-05-20",
        });

      const otherToken =
        otherRegisterResponse.body.accessToken ||
        otherRegisterResponse.body.sessionToken;

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
