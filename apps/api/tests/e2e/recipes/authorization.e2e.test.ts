import { ObjectId } from "mongodb";
import request from "supertest";
import {
  addChildMember,
  registerTestUser,
  setupTestFamily,
} from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: /v1/families/:familyId/recipes - Authorization", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter++;
  });

  describe("Family Membership Authorization", () => {
    it("should allow family member to create recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Member Recipe",
          description: "Created by family member",
          steps: ["Step 1"],
        });

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.name).toBe("Member Recipe");
    });

    it("should deny non-member from creating recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({
          name: "Unauthorized Recipe",
          description: "Non-member attempt",
          steps: ["Step"],
        });

      expect(response.status).toBe(403);
    });

    it("should allow family member to read recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Test Recipe",
          description: "For reading",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Read recipe
      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(recipeId);
    });

    it("should deny non-member from reading recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      // Create recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Private Recipe",
          description: "Family only",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Try to read as non-member
      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(response.status).toBe(403);
    });

    it("should allow family member to update recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Original Name",
          description: "Original description",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Update recipe
      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Name");
    });

    it("should deny non-member from updating recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      // Create recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Protected Recipe",
          description: "Cannot be hacked",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Try to update as non-member
      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({ name: "Hacked" });

      expect(response.status).toBe(403);
    });

    it("should allow family member to delete recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "To Delete",
          description: "Will be removed",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Delete recipe
      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(204);
    });

    it("should deny non-member from deleting recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      // Create recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Protected Recipe",
          description: "Cannot be deleted by others",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Try to delete as non-member
      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(response.status).toBe(403);
    });

    it("should allow family member to search recipes", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create recipe
      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Searchable Recipe",
          description: "Can be found",
          steps: ["Step"],
        });

      // Search
      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "Searchable" });

      expect(response.status).toBe(200);
      expect(response.body.recipes).toBeDefined();
    });

    it("should deny non-member from searching recipes", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({ query: "test" });

      expect(response.status).toBe(403);
    });
  });

  describe("Both Parents and Children Can Manage Recipes", () => {
    it("should allow child member to create recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const child = await addChildMember(
        baseUrl,
        family.familyId,
        family.token,
        testCounter,
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${child.childToken}`)
        .send({
          name: "Child Recipe",
          description: "Created by child",
          steps: ["Step"],
        });

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
    });

    it("should allow child member to update recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const child = await addChildMember(
        baseUrl,
        family.familyId,
        family.token,
        testCounter,
      );

      // Create recipe as parent
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Family Recipe",
          description: "For everyone",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Update as child
      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${child.childToken}`)
        .send({ name: "Updated by Child" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated by Child");
    });

    it("should allow child member to delete recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const child = await addChildMember(
        baseUrl,
        family.familyId,
        family.token,
        testCounter,
      );

      // Create recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "To Delete by Child",
          description: "Will be removed",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Delete as child
      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${child.childToken}`);

      expect(response.status).toBe(204);
    });
  });

  describe("Authentication Requirements", () => {
    it("should reject create without token with 401", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .send({
          name: "No Auth",
          description: "No token",
          steps: ["Step"],
        });

      expect(response.status).toBe(401);
    });

    it("should reject list without token with 401", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl).get(
        `/v1/families/${family.familyId}/recipes`,
      );

      expect(response.status).toBe(401);
    });

    it("should reject get without token with 401", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const recipeId = new ObjectId().toString();

      const response = await request(baseUrl).get(
        `/v1/families/${family.familyId}/recipes/${recipeId}`,
      );

      expect(response.status).toBe(401);
    });

    it("should reject update without token with 401", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const recipeId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .send({ name: "Updated" });

      expect(response.status).toBe(401);
    });

    it("should reject delete without token with 401", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const recipeId = new ObjectId().toString();

      const response = await request(baseUrl).delete(
        `/v1/families/${family.familyId}/recipes/${recipeId}`,
      );

      expect(response.status).toBe(401);
    });

    it("should reject search without token with 401", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .send({ query: "test" });

      expect(response.status).toBe(401);
    });

    it("should reject with invalid token", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });
});
