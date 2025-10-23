import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { setupTestFamily } from "../helpers/auth-setup";

describe("E2E: GET /v1/families/:familyId/shopping-lists", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "List User",
      familyName: "Test Family",
      prefix: "listuser"
    });

    authToken = setup.token;
    familyId = setup.familyId;
  });

  describe("Success Cases", () => {
    it("should return empty array when no lists exist", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("should return all shopping lists for family", async () => {
      // Create two shopping lists
      await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Groceries" });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Hardware" });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("_id");
      expect(response.body[0]).toHaveProperty("name");
    });

    it("should return lists sorted by creation date (newest first)", async () => {
      // Create lists with slight delays
      const response1 = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "First List" });

      const firstListId = response1.body._id;

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response2 = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Second List" });

      const secondListId = response2.body._id;

      const listResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body[0]._id).toBe(secondListId); // Newest first
      expect(listResponse.body[1]._id).toBe(firstListId);
    });

    it("should include all list properties", async () => {
      await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Complete List",
          tags: ["tag1"],
          items: [{ name: "Item 1" }],
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const list = response.body[0];
      expect(list).toHaveProperty("_id");
      expect(list).toHaveProperty("name", "Complete List");
      expect(list).toHaveProperty("familyId");
      expect(list).toHaveProperty("tags");
      expect(list).toHaveProperty("items");
      expect(list).toHaveProperty("createdBy");
      expect(list).toHaveProperty("createdAt");
      expect(list).toHaveProperty("updatedAt");
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/shopping-lists`,
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
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
