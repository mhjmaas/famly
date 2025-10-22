import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/families/:familyId/shopping-lists/:listId/items", () => {
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
    const uniqueEmail = `additemuser${testCounter}@example.com`;

    const registerResponse = await request(baseUrl)
      .post("/v1/auth/register")
      .send({
        email: uniqueEmail,
        password: "SecurePassword123!",
        name: "Add Item User",
        birthdate: "1980-01-15",
      });

    authToken =
      registerResponse.body.accessToken || registerResponse.body.sessionToken;

    const familyResponse = await request(baseUrl)
      .post("/v1/families")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Family",
      });

    familyId = familyResponse.body.familyId;

    // Create a test shopping list
    const listResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Shopping List",
      });

    listId = listResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should add single item to list", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Milk",
        });

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe("Milk");
      expect(response.body.items[0].checked).toBe(false);
    });

    it("should add multiple items sequentially", async () => {
      await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Milk" });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Bread" });

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Eggs" });

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(3);
      expect(response.body.items[0].name).toBe("Milk");
      expect(response.body.items[1].name).toBe("Bread");
      expect(response.body.items[2].name).toBe("Eggs");
    });

    it("should return updated list in response", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Cheese" });

      expect(response.status).toBe(201);
      expect(response.body._id).toBe(listId);
      expect(response.body.familyId).toBe(familyId);
      expect(response.body.name).toBe("Shopping List");
    });

    it("should assign unique ID to each item", async () => {
      const response1 = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Item 1" });

      const firstItemId = response1.body.items[0]._id;

      const response2 = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Item 2" });

      const secondItemId = response2.body.items[1]._id;

      expect(firstItemId).not.toBe(secondItemId);
    });

    it("should handle items with special characters", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Extra Virgin Olive Oil (500mL)" });

      expect(response.status).toBe(201);
      expect(response.body.items[0].name).toBe(
        "Extra Virgin Olive Oil (500mL)",
      );
    });
  });

  describe("Validation Errors", () => {
    it("should reject missing name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should reject empty name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject item name longer than 200 characters", async () => {
      const longName = "a".repeat(201);
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
    });

    it("should accept item name up to 200 characters", async () => {
      const longName = "a".repeat(200);
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(201);
      expect(response.body.items[0].name).toBe(longName);
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent list", async () => {
      const fakeListId = "507f1f77bcf86cd799439999";
      const response = await request(baseUrl)
        .post(
          `/v1/families/${familyId}/shopping-lists/${fakeListId}/items`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Item",
        });

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .send({
          name: "Item",
        });

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
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Item",
        });

      expect(response.status).toBe(403);
    });
  });
});
