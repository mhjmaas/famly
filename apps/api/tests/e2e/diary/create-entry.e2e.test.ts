import request from "supertest";
import { registerTestUser } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/diary - Create Entry", () => {
  let baseUrl: string;
  let authToken: string;
  let userId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const user = await registerTestUser(baseUrl, testCounter, "diaryuser", {
      name: "Diary User",
      birthdate: "1990-05-15",
    });

    authToken = user.token;
    userId = user.userId;
  });

  describe("Success Cases", () => {
    it("should create diary entry with date and entry text", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Today was a wonderful day with beautiful weather.",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("date", "2025-10-23");
      expect(response.body).toHaveProperty(
        "entry",
        "Today was a wonderful day with beautiful weather.",
      );
      expect(response.body).toHaveProperty("isPersonal", true);
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should set isPersonal to true automatically", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-22",
          entry: "A personal reflection.",
        });

      expect(response.status).toBe(201);
      expect(response.body.isPersonal).toBe(true);
    });

    it("should set createdBy to authenticated user ID", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-21",
          entry: "Test entry for createdBy validation.",
        });

      expect(response.status).toBe(201);
      expect(response.body.createdBy).toBe(userId);
    });

    it("should have valid timestamps for createdAt and updatedAt", async () => {
      const beforeRequest = new Date();

      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
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

    it("should return entry with all required fields", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-19",
          entry: "Complete entry structure test.",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("date");
      expect(response.body).toHaveProperty("entry");
      expect(response.body).toHaveProperty("isPersonal");
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      // Verify types
      expect(typeof response.body._id).toBe("string");
      expect(typeof response.body.date).toBe("string");
      expect(typeof response.body.entry).toBe("string");
      expect(typeof response.body.isPersonal).toBe("boolean");
      expect(typeof response.body.createdBy).toBe("string");
      expect(typeof response.body.createdAt).toBe("string");
      expect(typeof response.body.updatedAt).toBe("string");
    });

    it("should accept entry text with maximum length (10,000 characters)", async () => {
      const maxLengthEntry = "a".repeat(10000);

      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-18",
          entry: maxLengthEntry,
        });

      expect(response.status).toBe(201);
      expect(response.body.entry).toBe(maxLengthEntry);
    });

    it("should accept various valid date formats", async () => {
      const testDates = [
        "2020-01-01",
        "2025-12-31",
        "2022-06-15",
        "2021-02-28",
      ];

      for (const testDate of testDates) {
        const response = await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date: testDate,
            entry: `Entry for ${testDate}`,
          });

        expect(response.status).toBe(201);
        expect(response.body.date).toBe(testDate);
      }
    });
  });

  describe("Validation Errors", () => {
    it("should reject missing date field with 400", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Entry without date",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject missing entry field with 400", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
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
        "2025-1-23",
        "2025-10-5",
      ];

      for (const invalidDate of invalidDates) {
        const response = await request(baseUrl)
          .post("/v1/diary")
          .set("Authorization", `Bearer ${authToken}`)
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
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
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
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: tooLongEntry,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should reject empty request body with 400", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should return error message indicating missing field", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const response = await request(baseUrl).post("/v1/diary").send({
        date: "2025-10-23",
        entry: "Entry without auth token",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", "Bearer invalid-token-123")
        .send({
          date: "2025-10-23",
          entry: "Entry with invalid token",
        });

      expect(response.status).toBe(401);
    });

    it("should reject request with malformed Authorization header with 401", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", "NotBearer sometoken")
        .send({
          date: "2025-10-23",
          entry: "Entry with malformed auth",
        });

      expect(response.status).toBe(401);
    });
  });
});
