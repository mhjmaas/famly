import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/diary/:entryId - Get Family Diary Entry", () => {
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
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Parent User",
      familyName: "Test Family",
      prefix: "parentuser",
    });

    parentToken = setup.token;
    familyId = setup.familyId;
  });

  describe("Success Cases", () => {
    it("should retrieve family diary entry by ID", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Test entry",
        });

      const entryId = createResponse.body._id;

      // Get entry
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(entryId);
      expect(getResponse.body.date).toBe("2025-10-23");
      expect(getResponse.body.entry).toBe("Test entry");
      expect(getResponse.body.isPersonal).toBe(false);
    });

    it("should include all required fields in response", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Complete entry",
        });

      const entryId = createResponse.body._id;

      // Get entry
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty("_id");
      expect(getResponse.body).toHaveProperty("date");
      expect(getResponse.body).toHaveProperty("entry");
      expect(getResponse.body).toHaveProperty("isPersonal", false);
      expect(getResponse.body).toHaveProperty("createdBy");
      expect(getResponse.body).toHaveProperty("createdAt");
      expect(getResponse.body).toHaveProperty("updatedAt");
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent entry ID", async () => {
      const nonExistentId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${nonExistentId}`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it("should return 404 for invalid entry ID format", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/invalid-id`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(400); // Invalid ObjectId format
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/diary/${entryId}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token-123");

      expect(response.status).toBe(401);
    });
  });
});
