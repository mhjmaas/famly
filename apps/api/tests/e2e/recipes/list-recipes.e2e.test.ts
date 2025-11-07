import request from "supertest";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/recipes", () => {
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
    it("should list all recipes for a family", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create some test recipes
      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe 1",
          description: "First recipe",
          steps: ["Step 1"],
        });

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe 2",
          description: "Second recipe",
          steps: ["Step 2"],
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body.recipes).toBeDefined();
      expect(Array.isArray(response.body.recipes)).toBe(true);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });

    it("should return empty list for family with no recipes", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body.recipes).toEqual([]);
      expect(response.body.total).toBe(0);
    });

    it("should return recipes sorted by createdAt descending", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create recipes with small delays to ensure different timestamps
      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "First",
          description: "First",
          steps: ["Step"],
        });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Second",
          description: "Second",
          steps: ["Step"],
        });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Third",
          description: "Third",
          steps: ["Step"],
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes?limit=100`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      const recipes = response.body.recipes;
      expect(recipes.length).toBeGreaterThanOrEqual(3);

      // Verify newest first
      for (let i = 0; i < recipes.length - 1; i++) {
        const current = new Date(recipes[i].createdAt);
        const next = new Date(recipes[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    it("should include duration when present", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Timed Recipe",
          description: "Has duration",
          steps: ["Step"],
          durationMinutes: 60,
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      const recipeWithDuration = response.body.recipes.find(
        (r: any) => r.durationMinutes === 60,
      );
      expect(recipeWithDuration).toBeDefined();
    });
  });

  describe("Pagination", () => {
    it("should respect limit parameter", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create multiple recipes
      for (let i = 0; i < 15; i++) {
        await request(baseUrl)
          .post(`/v1/families/${family.familyId}/recipes`)
          .set("Authorization", `Bearer ${family.token}`)
          .send({
            name: `Recipe ${i}`,
            description: `Description ${i}`,
            steps: ["Step"],
          });
      }

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes?limit=5`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body.recipes.length).toBeLessThanOrEqual(5);
      expect(response.body.limit).toBe(5);
    });

    it("should respect offset parameter", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create multiple recipes
      for (let i = 0; i < 15; i++) {
        await request(baseUrl)
          .post(`/v1/families/${family.familyId}/recipes`)
          .set("Authorization", `Bearer ${family.token}`)
          .send({
            name: `Recipe ${i}`,
            description: `Description ${i}`,
            steps: ["Step"],
          });
      }

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes?limit=5&offset=5`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body.offset).toBe(5);
    });

    it("should use default pagination when no params provided", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      // Create multiple recipes
      for (let i = 0; i < 15; i++) {
        await request(baseUrl)
          .post(`/v1/families/${family.familyId}/recipes`)
          .set("Authorization", `Bearer ${family.token}`)
          .send({
            name: `Recipe ${i}`,
            description: `Description ${i}`,
            steps: ["Step"],
          });
      }

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(10);
      expect(response.body.offset).toBe(0);
    });

    it("should reject invalid limit (too large)", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes?limit=500`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(400);
    });

    it("should reject negative offset", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes?offset=-1`)
        .set("Authorization", `Bearer ${family.token}`);

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject non-family member", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);
      const otherUser = await registerTestUser(
        baseUrl,
        testCounter + 1000,
        "other",
      );

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${otherUser.token}`);

      expect(response.status).toBe(403);
    });

    it("should reject unauthenticated request", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl).get(
        `/v1/families/${family.familyId}/recipes`,
      );

      expect(response.status).toBe(401);
    });
  });
});
