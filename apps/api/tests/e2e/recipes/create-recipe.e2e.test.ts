import request from "supertest";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/families/:familyId/recipes", () => {
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
    it("should create recipe with required fields only", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Simple Pasta",
          description: "Very simple pasta recipe",
          steps: ["Boil water", "Add pasta", "Drain"],
        });

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.familyId).toBe(family.familyId);
      expect(response.body.name).toBe("Simple Pasta");
      expect(response.body.description).toBe("Very simple pasta recipe");
      expect(response.body.steps).toEqual(["Boil water", "Add pasta", "Drain"]);
      expect(response.body.tags).toEqual([]);
      expect(response.body.createdBy).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();
    });

    it("should create recipe with tags", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Sourdough Bread",
          description: "Homemade sourdough",
          steps: ["Mix dough", "Ferment", "Bake"],
          tags: ["bread", "breakfast"],
        });

      expect(response.status).toBe(201);
      expect(response.body.tags).toEqual(["bread", "breakfast"]);
    });

    it("should create recipe with many steps", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const steps = Array.from({ length: 15 }, (_, i) => `Step ${i + 1}`);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Complex Recipe",
          description: "Many steps",
          steps,
        });

      expect(response.status).toBe(201);
      expect(response.body.steps).toEqual(steps);
    });

    it("should create recipe with duration", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Quick Salad",
          description: "Takes 15 minutes",
          steps: ["Chop", "Mix"],
          durationMinutes: 15,
        });

      expect(response.status).toBe(201);
      expect(response.body.durationMinutes).toBe(15);
    });
  });

  describe("Validation - Name", () => {
    it("should reject recipe with missing name", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          description: "Missing name",
          steps: ["Step"],
        });

      expect(response.status).toBe(400);
    });

    it("should reject recipe with empty name", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "",
          description: "Empty name",
          steps: ["Step"],
        });

      expect(response.status).toBe(400);
    });

    it("should reject name exceeding max length", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "a".repeat(201),
          description: "Too long name",
          steps: ["Step"],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Validation - Duration", () => {
    it("should reject duration below 1 minute", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Bad Duration",
          description: "Invalid",
          steps: ["Step"],
          durationMinutes: 0,
        });

      expect(response.status).toBe(400);
    });

    it("should reject duration above 1440 minutes", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Too Long",
          description: "Invalid",
          steps: ["Step"],
          durationMinutes: 2000,
        });

      expect(response.status).toBe(400);
    });

    it("should reject non-integer duration", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Float Duration",
          description: "Invalid",
          steps: ["Step"],
          durationMinutes: 12.5,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Validation - Description", () => {
    it("should reject recipe with missing description", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "No description",
          steps: ["Step"],
        });

      expect(response.status).toBe(400);
    });

    it("should reject recipe with empty description", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "",
          steps: ["Step"],
        });

      expect(response.status).toBe(400);
    });

    it("should reject description exceeding max length", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "a".repeat(2001),
          steps: ["Step"],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Validation - Steps", () => {
    it("should accept recipe with missing steps (defaults to empty array)", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "No steps",
        });

      expect(response.status).toBe(201);
      expect(response.body.steps).toEqual([]);
    });

    it("should accept recipe with empty steps array", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: [],
        });

      expect(response.status).toBe(201);
      expect(response.body.steps).toEqual([]);
    });

    it("should reject recipe with empty step", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Cook", "", "Serve"],
        });

      expect(response.status).toBe(400);
    });

    it("should reject step exceeding max length", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["a".repeat(501)],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Validation - Tags", () => {
    it("should reject recipe with too many tags", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: Array(21).fill("tag"),
        });

      expect(response.status).toBe(400);
    });

    it("should reject tag exceeding max length", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${family.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: ["a".repeat(51)],
        });

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
        .post(`/v1/families/${family.familyId}/recipes`)
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      expect(response.status).toBe(403);
    });

    it("should reject unauthenticated request", async () => {
      const family = await setupTestFamily(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/recipes`)
        .send({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });

      expect(response.status).toBe(401);
    });
  });
});
