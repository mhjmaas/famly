import request from "supertest";
import { cleanDatabase } from "../../helpers/database";
import { getTestApp } from "../../helpers/test-app";
import { setupTestFamily } from "../../helpers/auth-setup";

describe("E2E: POST /v1/families/:familyId/diary - Create Family Diary Entry", () => {
  let baseUrl: string;
  let parentToken: string;
  let parentUserId: string;
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
    parentUserId = setup.userId;
    familyId = setup.familyId;
  });

  describe("Success Cases", () => {
    it("should create family diary entry with date and entry text", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Today our family went to the park together...",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("date", "2025-10-23");
      expect(response.body).toHaveProperty(
        "entry",
        "Today our family went to the park together...",
      );
      expect(response.body).toHaveProperty("isPersonal", false);
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should set isPersonal to false automatically", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-22",
          entry: "A family reflection.",
        });

      expect(response.status).toBe(201);
      expect(response.body.isPersonal).toBe(false);
    });

    it("should set createdBy to authenticated user ID", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-21",
          entry: "Test entry for createdBy validation.",
        });

      expect(response.status).toBe(201);
      expect(response.body.createdBy).toBe(parentUserId);
    });

    it("should have valid timestamps for createdAt and updatedAt", async () => {
      const beforeRequest = new Date();

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-20",
          entry: "Entry for timestamp validation.",
        });

      const afterRequest = new Date();

      expect(response.status).toBe(201);
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      const createdAt = new Date(response.body.createdAt);
      const updatedAt = new Date(response.body.updatedAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeRequest.getTime(),
      );
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeRequest.getTime(),
      );
      expect(updatedAt.getTime()).toBeLessThanOrEqual(afterRequest.getTime());

      // createdAt and updatedAt should be equal on creation
      expect(createdAt.getTime()).toBe(updatedAt.getTime());
    });

    it("should accept entry text with maximum length (10,000 characters)", async () => {
      const maxLengthEntry = "a".repeat(10000);

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-18",
          entry: maxLengthEntry,
        });

      expect(response.status).toBe(201);
      expect(response.body.entry).toBe(maxLengthEntry);
    });
  });

  describe("Validation Errors", () => {
    it("should reject missing date field with 400", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          entry: "Entry without date",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject missing entry field with 400", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject invalid date format with 400", async () => {
      const invalidDates = [
        "23-10-2025",
        "2025/10/23",
        "10/23/2025",
        "invalid-date",
      ];

      for (const invalidDate of invalidDates) {
        const response = await request(baseUrl)
          .post(`/v1/families/${familyId}/diary`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({
            date: invalidDate,
            entry: "Test entry",
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      }
    });

    it("should reject empty entry text with 400", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject entry text exceeding 10,000 characters with 400", async () => {
      const tooLongEntry = "a".repeat(10001);

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: tooLongEntry,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .send({
          date: "2025-10-23",
          entry: "Entry without auth token",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", "Bearer invalid-token-123")
        .send({
          date: "2025-10-23",
          entry: "Entry with invalid token",
        });

      expect(response.status).toBe(401);
    });
  });
});
