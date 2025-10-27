import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PATCH /v1/families/:familyId/shopping-lists/:listId", () => {
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
      userName: "Update List User",
      familyName: "Test Family",
      prefix: "updatelistuser",
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Create a test shopping list
    const listResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Original List",
        tags: ["tag1"],
      });

    listId = listResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should update list name", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated List Name",
        });

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(listId);
      expect(response.body.name).toBe("Updated List Name");
    });

    it("should update tags", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tags: ["newtag1", "newtag2", "newtag3"],
        });

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(["newtag1", "newtag2", "newtag3"]);
    });

    it("should update both name and tags", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated List",
          tags: ["urgent", "fresh"],
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated List");
      expect(response.body.tags).toEqual(["urgent", "fresh"]);
    });

    it("should clear tags when empty array provided", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tags: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it("should preserve items when updating list", async () => {
      // Add items first
      await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Item 1" });

      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated List",
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].name).toBe("Item 1");
    });
  });

  describe("Validation Errors", () => {
    it("should reject empty name", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject name longer than 200 characters", async () => {
      const longName = "a".repeat(201);
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: longName,
        });

      expect(response.status).toBe(400);
    });

    it("should reject too many tags", async () => {
      const manyTags = Array(21).fill("tag");
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tags: manyTags,
        });

      expect(response.status).toBe(400);
    });

    it("should reject tag longer than 50 characters", async () => {
      const longTag = "a".repeat(51);
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          tags: [longTag],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent list", async () => {
      const fakeListId = "507f1f77bcf86cd799439999";
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${fakeListId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .send({
          name: "Updated Name",
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
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(403);
    });
  });
});
