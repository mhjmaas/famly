import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PATCH /v1/families/:familyId/recipes/:recipeId", () => {
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
    it("should update recipe name", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create a recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Original Name",
          description: "Test",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Update the name
      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ name: "Updated Name" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Name");
      expect(response.body.description).toBe("Test");
    });

    it("should update recipe description", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Original description",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ description: "New description" });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe("New description");
    });

    it("should update recipe steps", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step 1", "Step 2"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ steps: ["New step 1", "New step 2", "New step 3"] });

      expect(response.status).toBe(200);
      expect(response.body.steps).toEqual([
        "New step 1",
        "New step 2",
        "New step 3",
      ]);
    });

    it("should update recipe tags", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: ["old-tag"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ tags: ["new-tag", "another-tag"] });

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual(["new-tag", "another-tag"]);
    });

    it("should clear recipe tags", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: ["tag1", "tag2"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ tags: [] });

      expect(response.status).toBe(200);
      expect(response.body.tags).toEqual([]);
    });

    it("should preserve other fields during partial update", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Original Name",
          description: "Original description",
          steps: ["Original step"],
          tags: ["original-tag"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ name: "New Name" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("New Name");
      expect(response.body.description).toBe("Original description");
      expect(response.body.steps).toEqual(["Original step"]);
      expect(response.body.tags).toEqual(["original-tag"]);
    });

    it("should update updatedAt timestamp", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;
      const originalUpdatedAt = createResponse.body.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ name: "Updated" });

      expect(response.status).toBe(200);
      expect(response.body.updatedAt).not.toBe(originalUpdatedAt);
    });

    it("should update recipe duration", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ durationMinutes: 75 });

      expect(response.status).toBe(200);
      expect(response.body.durationMinutes).toBe(75);
    });

    it("should clear recipe duration when null sent", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          durationMinutes: 30,
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ durationMinutes: null });

      expect(response.status).toBe(200);
      expect(response.body).not.toHaveProperty("durationMinutes");
    });
  });

  describe("Validation", () => {
    it("should reject update with invalid name", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ name: "a".repeat(201) });

      expect(response.status).toBe(400);
    });

    it("should reject update with invalid description", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ description: "a".repeat(2001) });

      expect(response.status).toBe(400);
    });

    it("should accept update with empty steps array", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ steps: [] });

      expect(response.status).toBe(200);
      expect(response.body.steps).toEqual([]);
    });

    it("should reject update with too many tags", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ tags: Array(21).fill("tag") });

      expect(response.status).toBe(400);
    });

    it("should reject duration below minimum", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const recipe = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipe.body._id}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ durationMinutes: 0 });

      expect(response.status).toBe(400);
    });

    it("should reject duration above maximum", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const recipe = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipe.body._id}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ durationMinutes: 2000 });

      expect(response.status).toBe(400);
    });

    it("should reject non-integer duration", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const recipe = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipe.body._id}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ durationMinutes: 10.5 });

      expect(response.status).toBe(400);
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const fakeRecipeId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${fakeRecipeId}`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ name: "Updated" });

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject unauthenticated request", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .send({ name: "Updated" });

      expect(response.status).toBe(401);
    });
  });
});
