import request from "supertest";
import { registerTestUser } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/activity-events - List Activity Events", () => {
  let baseUrl: string;
  let authToken: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const user = await registerTestUser(baseUrl, testCounter, "activityuser", {
      name: "Activity User",
      birthdate: "1990-05-15",
    });

    authToken = user.token;
  });

  describe("Success Cases", () => {
    it("should return empty array for user with no events", async () => {
      const response = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("should return array with proper structure", async () => {
      const response = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Validation Cases", () => {
    it("should return 400 for invalid start date format", async () => {
      const response = await request(baseUrl)
        .get("/v1/activity-events?startDate=invalid-date")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Date must be in YYYY-MM-DD format",
      );
    });

    it("should return 400 for invalid end date format", async () => {
      const response = await request(baseUrl)
        .get("/v1/activity-events?endDate=2024/01/01")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain(
        "Date must be in YYYY-MM-DD format",
      );
    });

    it("should accept valid date range parameters", async () => {
      const response = await request(baseUrl)
        .get("/v1/activity-events?startDate=2024-01-01&endDate=2024-12-31")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Authentication Cases", () => {
    it("should return 401 when not authenticated", async () => {
      const response = await request(baseUrl).get("/v1/activity-events");

      expect(response.status).toBe(401);
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });
});
