import { ObjectId } from "mongodb";
import request from "supertest";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/recipes/:recipeId", () => {
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
    it("should get a recipe by ID", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create a test recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Test Recipe",
          description: "For retrieval testing",
          steps: ["Step 1", "Step 2"],
          tags: ["test"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(recipeId);
      expect(response.body.familyId).toBe(family.familyId);
      expect(response.body.name).toBe("Test Recipe");
      expect(response.body.description).toBe("For retrieval testing");
      expect(response.body.steps).toEqual(["Step 1", "Step 2"]);
      expect(response.body.tags).toEqual(["test"]);
    });

    it("should return all recipe fields", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Complete Recipe",
          description: "All fields",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBeDefined();
      expect(response.body.familyId).toBeDefined();
      expect(response.body.name).toBeDefined();
      expect(response.body.description).toBeDefined();
      expect(response.body.steps).toBeDefined();
      expect(response.body.tags).toBeDefined();
      expect(response.body.createdBy).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const fakeRecipeId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${fakeRecipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 for recipe from different family", async () => {
      const family1 = await setupTestFamily(baseUrl, testCounter);
      const family2 = await setupTestFamily(baseUrl, testCounter + 1);

      // Create recipe in family1
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/recipes`)
        .set("Authorization", `Bearer ${family1.token}`)
        .send({
          name: "Private Recipe",
          description: "Only for family1",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Try to access from family2
      const response = await request(baseUrl)
        .get(`/v1/families/${family2.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family2.token}`);

      expect(response.status).toBe(404);
    });

    it("should handle invalid recipe ID format", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/invalid-id`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject access for non-family member", async () => {
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

      // Try to access as non-member
      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(response.status).toBe(403);
    });

    it("should reject unauthenticated request", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const recipeId = new ObjectId().toString();

      const response = await request(baseUrl).get(
        `/v1/families/${family.familyId}/recipes/${recipeId}`,
      );

      expect(response.status).toBe(401);
    });
  });
});
