import request from "supertest";
import { cleanDatabase } from "../../helpers/database";
import { getTestApp } from "../../helpers/test-app";
import { setupTestFamily } from "../../helpers/auth-setup";

describe("E2E: GET /v1/families/:familyId/diary - List Family Diary Entries", () => {
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
      prefix: "parentuser"
    });

    parentToken = setup.token;
    familyId = setup.familyId;
  });

  describe("Success Cases", () => {
    it("should list all family diary entries sorted by date descending", async () => {
      // Create multiple entries
      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-20",
          entry: "First entry",
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Latest entry",
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-21",
          entry: "Middle entry",
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].date).toBe("2025-10-23"); // Latest first
      expect(response.body[1].date).toBe("2025-10-21");
      expect(response.body[2].date).toBe("2025-10-20"); // Oldest last
    });

    it("should return empty array for family with no entries", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should filter entries by date range with startDate", async () => {
      // Create entries
      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-10",
          entry: "Early entry",
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-25",
          entry: "Late entry",
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .query({ startDate: "2025-10-20" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].entry).toBe("Late entry");
    });

    it("should filter entries by date range with endDate", async () => {
      // Create entries
      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-10",
          entry: "Early entry",
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-25",
          entry: "Late entry",
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .query({ endDate: "2025-10-20" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].entry).toBe("Early entry");
    });

    it("should filter entries by full date range", async () => {
      // Create entries
      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-10",
          entry: "Early entry",
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-15",
          entry: "Middle entry",
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-25",
          entry: "Late entry",
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .query({ startDate: "2025-10-12", endDate: "2025-10-20" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].entry).toBe("Middle entry");
    });

    it("should include all required fields in each entry", async () => {
      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Test entry",
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);

      const entry = response.body[0];
      expect(entry).toHaveProperty("_id");
      expect(entry).toHaveProperty("date");
      expect(entry).toHaveProperty("entry");
      expect(entry).toHaveProperty("isPersonal", false);
      expect(entry).toHaveProperty("createdBy");
      expect(entry).toHaveProperty("createdAt");
      expect(entry).toHaveProperty("updatedAt");
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/diary`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", "Bearer invalid-token-123");

      expect(response.status).toBe(401);
    });
  });
});
