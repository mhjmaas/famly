import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { setupTestFamily, registerTestUser } from "../helpers/auth-setup";

describe("E2E: POST /v1/families/:familyId/shopping-lists", () => {
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
      userName: "Shopping User",
      familyName: "Test Family",
      prefix: "shoppinguser"
    });

    authToken = setup.token;
    familyId = setup.familyId;
  });

  describe("Success Cases", () => {
    it("should create shopping list with name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Weekly Groceries",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("name", "Weekly Groceries");
      expect(response.body).toHaveProperty("familyId", familyId);
      expect(response.body).toHaveProperty("tags");
      expect(response.body.tags).toEqual([]);
      expect(response.body).toHaveProperty("items");
      expect(response.body.items).toEqual([]);
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should create shopping list with tags", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Groceries",
          tags: ["fresh", "organic"],
        });

      expect(response.status).toBe(201);
      expect(response.body.tags).toEqual(["fresh", "organic"]);
    });

    it("should create shopping list with initial items", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Groceries",
          items: [{ name: "Milk" }, { name: "Bread" }],
        });

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].name).toBe("Milk");
      expect(response.body.items[0].checked).toBe(false);
      expect(response.body.items[1].name).toBe("Bread");
    });

    it("should create shopping list with name, tags, and items", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Weekend Shopping",
          tags: ["urgent"],
          items: [{ name: "Milk" }],
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Weekend Shopping");
      expect(response.body.tags).toEqual(["urgent"]);
      expect(response.body.items).toHaveLength(1);
    });
  });

  describe("Validation Errors", () => {
    it("should reject missing name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject empty name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject name longer than 200 characters", async () => {
      const longName = "a".repeat(201);
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
    });

    it("should reject too many tags", async () => {
      const manyTags = Array(21).fill("tag");
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Groceries",
          tags: manyTags,
        });

      expect(response.status).toBe(400);
    });

    it("should reject tag longer than 50 characters", async () => {
      const longTag = "a".repeat(51);
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Groceries",
          tags: [longTag],
        });

      expect(response.status).toBe(400);
    });

    it("should reject item name longer than 200 characters", async () => {
      const longItemName = "a".repeat(201);
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Groceries",
          items: [{ name: longItemName }],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .send({
          name: "Groceries",
        });

      expect(response.status).toBe(401);
    });

    it("should reject request from non-family member", async () => {
      // Create another user not in the family
      testCounter++;
      const { token: otherToken } = await registerTestUser(baseUrl, testCounter, "other", {
        name: "Other User"
      });

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Groceries",
        });

      expect(response.status).toBe(403);
    });
  });
});
