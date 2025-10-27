import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PATCH /v1/families/:familyId/shopping-lists/:listId/items/:itemId", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let listId: string;
  let itemId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Update Item User",
      familyName: "Test Family",
      prefix: "updateitemuser",
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Create a test shopping list
    const listResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Shopping List",
      });

    listId = listResponse.body._id;

    // Add an item
    const itemResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Original Item",
      });

    itemId = itemResponse.body.items[0]._id;
  });

  describe("Success Cases", () => {
    it("should check off item", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.items[0].checked).toBe(true);
      expect(response.body.items[0].name).toBe("Original Item");
    });

    it("should uncheck item", async () => {
      // First check it
      await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: true,
        });

      // Then uncheck it
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.items[0].checked).toBe(false);
    });

    it("should rename item", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Renamed Item",
        });

      expect(response.status).toBe(200);
      expect(response.body.items[0].name).toBe("Renamed Item");
      expect(response.body.items[0].checked).toBe(false);
    });

    it("should update name and check status together", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "New Name",
          checked: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.items[0].name).toBe("New Name");
      expect(response.body.items[0].checked).toBe(true);
    });

    it("should preserve other items when updating one", async () => {
      // Add a second item
      const item2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Second Item",
        });

      const itemId2 = item2Response.body.items[1]._id;

      // Update first item
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0]._id).toBe(itemId);
      expect(response.body.items[0].checked).toBe(true);
      expect(response.body.items[1]._id).toBe(itemId2);
      expect(response.body.items[1].checked).toBe(false);
    });

    it("should handle empty update (no changes)", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.items[0].name).toBe("Original Item");
      expect(response.body.items[0].checked).toBe(false);
    });
  });

  describe("Validation Errors", () => {
    it("should reject empty name", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject name longer than 200 characters", async () => {
      const longName = "a".repeat(201);
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid checked value", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: "not a boolean",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent item", async () => {
      const fakeItemId = "507f1f77bcf86cd799439999";
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${fakeItemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(404);
    });

    it("should return 404 for invalid item id format", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/invalid-id`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .send({
          checked: true,
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
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(403);
    });
  });
});
