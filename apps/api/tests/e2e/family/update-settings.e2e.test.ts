import request from "supertest";
import { FeatureKey } from "../../../src/modules/family/domain/family-settings";
import { registerTestUser, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PUT /v1/families/:familyId/settings", () => {
  let baseUrl: string;
  let parentToken: string;
  let childToken: string;
  let childUserId: string;
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

    // Create child user
    const childUser = await registerTestUser(
      baseUrl,
      testCounter + 1000,
      "child",
      {
        name: "Child User",
        birthdate: "2010-01-15",
      },
    );

    childToken = childUser.token;
    childUserId = childUser.userId;
  });

  describe("Success Cases", () => {
    it("should update settings with valid data", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks, FeatureKey.Rewards],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("familyId", familyId);
      expect(response.body.enabledFeatures).toEqual([
        FeatureKey.Tasks,
        FeatureKey.Rewards,
      ]);
    });

    it("should create settings if none exist (upsert)", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Chat],
        });

      expect(response.status).toBe(200);
      expect(response.body.enabledFeatures).toEqual([FeatureKey.Chat]);
    });

    it("should accept empty enabled features array", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [],
        });

      expect(response.status).toBe(200);
      expect(response.body.enabledFeatures).toEqual([]);
    });

    it("should accept all 9 features enabled", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [
            FeatureKey.Tasks,
            FeatureKey.Rewards,
            FeatureKey.ShoppingLists,
            FeatureKey.Recipes,
            FeatureKey.Locations,
            FeatureKey.Memories,
            FeatureKey.Diary,
            FeatureKey.Chat,
            FeatureKey.AIIntegration,
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.enabledFeatures).toHaveLength(9);
    });

    it("should update settings with AI configuration", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "sk-test-secret-key",
            modelName: "gpt-4",
            aiName: "Jarvis",
            provider: "LM Studio",
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.aiSettings.apiEndpoint).toBe(
        "https://api.openai.com/v1",
      );
      expect(response.body.aiSettings.modelName).toBe("gpt-4");
      expect(response.body.aiSettings.aiName).toBe("Jarvis");
      expect(response.body.aiSettings.provider).toBe("LM Studio");
      expect(response.body.aiSettings).not.toHaveProperty("apiSecret");
    });

    it("should persist settings across multiple updates", async () => {
      // First update
      await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks],
        });

      // Second update
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks, FeatureKey.Rewards],
        });

      expect(response.status).toBe(200);
      expect(response.body.enabledFeatures).toEqual([
        FeatureKey.Tasks,
        FeatureKey.Rewards,
      ]);

      // Verify persistence
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(getResponse.body.enabledFeatures).toEqual([
        FeatureKey.Tasks,
        FeatureKey.Rewards,
      ]);
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid feature keys", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: ["invalid-feature", "another-invalid"],
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject duplicate feature keys", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks, FeatureKey.Tasks],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/duplicates/i);
    });

    it("should reject more than 9 features", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [
            FeatureKey.Tasks,
            FeatureKey.Rewards,
            FeatureKey.ShoppingLists,
            FeatureKey.Recipes,
            FeatureKey.Locations,
            FeatureKey.Memories,
            FeatureKey.Diary,
            FeatureKey.Chat,
            FeatureKey.AIIntegration,
            "extra" as any,
          ],
        });

      expect(response.status).toBe(400);
    });

    it("should reject missing enabledFeatures field", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("should reject invalid AI settings URL format", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "not-a-valid-url",
            apiSecret: "sk-test",
            modelName: "gpt-4",
            aiName: "Jarvis",
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/valid URL/i);
    });

    it("should reject incomplete AI settings", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            // Missing modelName, aiName, and provider (required fields)
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject empty AI settings fields when provided", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "",
            apiSecret: "",
            modelName: "",
            aiName: "",
            provider: "",
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .send({
          enabledFeatures: [FeatureKey.Tasks],
        });

      expect(response.status).toBe(401);
    });

    it("should reject request with invalid token", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", "Bearer invalid-token-12345")
        .send({
          enabledFeatures: [FeatureKey.Tasks],
        });

      expect(response.status).toBe(401);
    });

    it("should reject child role access", async () => {
      // Add child to family
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          role: "Child",
        });

      // Attempt to update settings as child
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks],
        });

      expect(response.status).toBe(403);
    });

    it("should allow parent role access", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks],
        });

      expect(response.status).toBe(200);
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid familyId format", async () => {
      const response = await request(baseUrl)
        .put("/v1/families/invalid-id/settings")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks],
        });

      expect(response.status).toBe(400);
    });

    it("should handle non-existent family", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const response = await request(baseUrl)
        .put(`/v1/families/${nonExistentId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.Tasks],
        });

      // User is not a member of this family
      expect(response.status).toBe(403);
    });

    it("should accept various valid URL formats for AI endpoint", async () => {
      const urlsToTest = [
        "https://api.openai.com/v1",
        "http://localhost:8080",
        "https://api.example.com:3000/v1/chat",
      ];

      for (const url of urlsToTest) {
        const response = await request(baseUrl)
          .put(`/v1/families/${familyId}/settings`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({
            enabledFeatures: [FeatureKey.AIIntegration],
            aiSettings: {
              apiEndpoint: url,
              apiSecret: "sk-test",
              modelName: "gpt-4",
              aiName: "Jarvis",
              provider: "LM Studio",
            },
          });

        expect(response.status).toBe(200);
        expect(response.body.aiSettings.apiEndpoint).toBe(url);
      }
    });

    it("should handle updating settings multiple times in sequence", async () => {
      // Update 1
      const r1 = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ enabledFeatures: [FeatureKey.Tasks] });
      expect(r1.status).toBe(200);

      // Update 2
      const r2 = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ enabledFeatures: [FeatureKey.Rewards] });
      expect(r2.status).toBe(200);

      // Update 3
      const r3 = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ enabledFeatures: [] });
      expect(r3.status).toBe(200);
      expect(r3.body.enabledFeatures).toEqual([]);
    });
  });

  describe("AI Secret Security", () => {
    it("should never return apiSecret in response", async () => {
      const response = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "sk-super-secret-key-should-never-be-returned",
            modelName: "gpt-4",
            aiName: "Jarvis",
            provider: "LM Studio",
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.aiSettings).not.toHaveProperty("apiSecret");
      expect(JSON.stringify(response.body)).not.toContain("sk-super-secret");
    });

    it("should store AI secret but omit from GET response", async () => {
      // Update with secret
      const updateResponse = await request(baseUrl)
        .put(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "sk-stored-but-hidden",
            modelName: "gpt-4",
            aiName: "Jarvis",
            provider: "LM Studio",
          },
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.aiSettings).not.toHaveProperty("apiSecret");

      // Get settings
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/settings`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.aiSettings).not.toHaveProperty("apiSecret");
      expect(JSON.stringify(getResponse.body)).not.toContain("sk-stored");
    });
  });
});
