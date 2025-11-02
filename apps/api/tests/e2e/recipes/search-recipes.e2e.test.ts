import request from "supertest";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/families/:familyId/recipes/search", () => {
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
    it("should search recipes by name", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create test recipes
      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Chocolate Cake",
          description: "Delicious chocolate dessert",
          steps: ["Mix", "Bake"],
        });

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Vanilla Cake",
          description: "Sweet vanilla dessert",
          steps: ["Mix", "Bake"],
        });

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "Chocolate" });

      expect(response.status).toBe(200);
      expect(response.body.recipes).toBeDefined();
      expect(Array.isArray(response.body.recipes)).toBe(true);
      expect(response.body.total).toBeGreaterThan(0);

      // Should find "Chocolate Cake"
      const hasChocolateCake = response.body.recipes.some(
        (r: any) => r.name === "Chocolate Cake",
      );
      expect(hasChocolateCake).toBe(true);
    });

    it("should search recipes by description", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Pasta Carbonara",
          description: "Italian pasta with creamy sauce",
          steps: ["Boil pasta", "Make sauce"],
        });

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "Italian" });

      expect(response.status).toBe(200);
      expect(response.body.total).toBeGreaterThan(0);

      // Should find "Pasta Carbonara" which has "Italian" in description
      const hasPasta = response.body.recipes.some(
        (r: any) => r.name === "Pasta Carbonara",
      );
      expect(hasPasta).toBe(true);
    });

    it("should search case-insensitively", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Chocolate Cake",
          description: "Delicious",
          steps: ["Mix", "Bake"],
        });

      const response1 = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "chocolate" });

      const response2 = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "CHOCOLATE" });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body.total).toBe(response2.body.total);
    });

    it("should return empty results for non-matching query", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "nonexistent-ingredient-xyz" });

      expect(response.status).toBe(200);
      expect(response.body.recipes).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should support pagination in search results", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create multiple recipes with "cake" in name
      for (let i = 0; i < 5; i++) {
        await request(baseUrl)
          .post(`/v1/families/${family.familyId}/recipes`)
          .set("Authorization", `Bearer ${family.token}`)
          .send({
            name: `Cake Recipe ${i}`,
            description: "A cake",
            steps: ["Mix", "Bake"],
          });
      }

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "Cake", limit: 2, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(2);
      expect(response.body.offset).toBe(0);
      expect(response.body.recipes.length).toBeLessThanOrEqual(2);
    });

    it("should respect family scope isolation", async () => {
      const family1 = await setupTestFamily(baseUrl, testCounter);
      const family2 = await setupTestFamily(baseUrl, testCounter + 1);

      // Create recipe in family1
      await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/recipes`)
        .set("Authorization", `Bearer ${family1.token}`)
        .send({
          name: "Family Secret Recipe",
          description: "Only in this family",
          steps: ["Secret step"],
        });

      // Search in family2
      const response = await request(baseUrl)
        .post(`/v1/families/${family2.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family2.token}`)
        .send({ query: "Family Secret Recipe" });

      expect(response.status).toBe(200);
      expect(response.body.recipes).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should return search results with complete recipe data", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Complete Recipe",
          description: "With all fields",
          steps: ["Step"],
          tags: ["tag1"],
        });

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "Complete" });

      expect(response.status).toBe(200);

      if (response.body.recipes.length > 0) {
        const recipe = response.body.recipes[0];
        expect(recipe._id).toBeDefined();
        expect(recipe.familyId).toBeDefined();
        expect(recipe.name).toBeDefined();
        expect(recipe.description).toBeDefined();
        expect(recipe.steps).toBeDefined();
        expect(recipe.tags).toBeDefined();
        expect(recipe.createdBy).toBeDefined();
        expect(recipe.createdAt).toBeDefined();
        expect(recipe.updatedAt).toBeDefined();
      }
    });
  });

  describe("Validation", () => {
    it("should reject empty query", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({ query: "" });

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject unauthenticated search", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes/search`)
        .send({ query: "test" });

      expect(response.status).toBe(401);
    });

    it("should reject search by non-family member", async () => {
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
});
