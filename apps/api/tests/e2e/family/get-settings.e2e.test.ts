import request from "supertest";
import { FeatureKey } from "../../../src/modules/family/domain/family-settings";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/settings", () => {
  let baseUrl: string;
  let parentToken: string;
  let familyId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;

    // Create parent user and family
    const family = await setupTestFamily(baseUrl, testCounter, {
      userName: "Parent User",
      familyName: "Test Family",
    });

    parentToken = family.token;
    familyId = family.familyId;
  });

  describe("Success Cases", () => {
    it("should return default settings for new family", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("familyId", familyId);
      expect(response.body).toHaveProperty("enabledFeatures");
      expect(response.body.enabledFeatures).toHaveLength(9);
      expect(response.body.enabledFeatures).toContain(FeatureKey.Tasks);
      expect(response.body.enabledFeatures).toContain(FeatureKey.Rewards);
      expect(response.body.enabledFeatures).toContain(FeatureKey.AIIntegration);
      expect(response.body).toHaveProperty("aiSettings");
      expect(response.body.aiSettings).toHaveProperty("apiEndpoint", "");
      expect(response.body.aiSettings).toHaveProperty("modelName", "");
      expect(response.body.aiSettings).toHaveProperty("aiName", "Jarvis");
      expect(response.body.aiSettings).not.toHaveProperty("apiSecret");
    });

    it("should return existing settings after update", async () => {
      // First update the settings
      await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks, FeatureKey.Rewards],
        });

      // Then get settings
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.enabledFeatures).toEqual([
        FeatureKey.Tasks,
        FeatureKey.Rewards,
      ]);
    });

    it("should omit apiSecret from response for security", async () => {
      // Update with AI settings including secret
      await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "sk-secret-should-not-be-returned",
            modelName: "gpt-4",
            aiName: "Jarvis",
            provider: "LM Studio",
          },
        });

      // Get settings
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      // API secret should NEVER be returned to client for security
      expect(response.body.aiSettings).not.toHaveProperty("apiSecret");
      expect(response.body.aiSettings.apiEndpoint).toBe(
        "https://api.openai.com/v1",
      );
      expect(response.body.aiSettings.provider).toBe("LM Studio");
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/settings`,
      );

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", "Bearer invalid-token-12345");

      expect(response.status).toBe(401);
    });

    it("should allow child role to read settings", async () => {
      // Add child to family (creates new user)
      const addMemberResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `child-${testCounter}@example.com`,
          password: "ChildPassword123!",
          name: "Child User",
          birthdate: "2010-01-15",
          role: "Child",
        });

      expect(addMemberResponse.status).toBe(201);

      // Login as the newly created child to get their token
      const loginResponse = await request(baseUrl)
        .post("/v1/auth/login")
        .send({
          email: `child-${testCounter}@example.com`,
          password: "ChildPassword123!",
        });

      expect(loginResponse.status).toBe(200);
      const childAuthToken = loginResponse.body.accessToken;

      // Get settings as child - should succeed
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${childAuthToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("familyId", familyId);
      expect(response.body).toHaveProperty("enabledFeatures");
    });

    it("should allow parent role access", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid familyId format", async () => {
      const response = await request(baseUrl)
        .get("/v1/families/invalid-id/settings")
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(400);
    });

    it("should handle non-existent family", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const response = await request(baseUrl)
        .get(`/v1/families/${nonExistentId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      // User is not a member of this family
      expect(response.status).toBe(403);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty enabled features", async () => {
      // Update to disable all features
      await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [],
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.enabledFeatures).toEqual([]);
    });
  });
});
