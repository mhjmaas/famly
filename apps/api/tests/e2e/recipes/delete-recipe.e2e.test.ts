import { ObjectId } from "mongodb";
import request from "supertest";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: DELETE /v1/families/:familyId/recipes/:recipeId", () => {
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
    it("should delete a recipe successfully", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create a recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe to Delete",
          description: "Will be deleted",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Delete the recipe
      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(204);

      // Verify it's deleted by trying to get it
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(getResponse.status).toBe(404);
    });

    it("should return 204 No Content on successful deletion", async () => {
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
        .delete(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it("should remove recipe from database", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create a recipe
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe for DB Check",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // List recipes before deletion
      const beforeDelete = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`);

      const countBefore = beforeDelete.body.total;

      // Delete the recipe
      await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      // List recipes after deletion
      const afterDelete = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`);

      const countAfter = afterDelete.body.total;
      expect(countAfter).toBe(countBefore - 1);
    });
  });

  describe("Error Cases", () => {
    it("should reject deletion of non-existent recipe", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const fakeRecipeId = new ObjectId().toString();

      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/recipes/${fakeRecipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject deletion by non-family member", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      // Create a recipe in current family
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Protected Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      const recipeId = createResponse.body._id;

      // Try to delete with different user
      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(response.status).toBe(403);

      // Verify recipe still exists
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(getResponse.status).toBe(200);
    });

    it("should reject unauthenticated deletion", async () => {
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

      const response = await request(baseUrl).delete(
        `/v1/families/${family.familyId}/recipes/${recipeId}`,
      );

      expect(response.status).toBe(401);

      // Verify recipe still exists
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes/${recipeId}`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(getResponse.status).toBe(200);
    });
  });
});
