import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PATCH /v1/diary/:entryId - Update Entry", () => {
  let baseUrl: string;
  let authToken: string;
  let _testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    _testCounter++;
    const uniqueEmail = `updateuser${_testCounter}@example.com`;

    // Register and login a test user
    const registerResponse = await request(baseUrl)
      .post("/v1/auth/register")
      .send({
        email: uniqueEmail,
        password: "SecurePassword123!",
        name: "Update User",
        birthdate: "1986-02-14",
      });

    expect(registerResponse.status).toBe(201);
    authToken =
      registerResponse.body.accessToken || registerResponse.body.sessionToken;
    expect(authToken).toBeDefined();
  });

  describe("Success Cases", () => {
    it("should update entry text only", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry text",
        });

      const entryId = createResponse.body._id;
      const originalDate = createResponse.body.date;

      // Update the entry text
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Updated entry text with new content",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.entry).toBe(
        "Updated entry text with new content",
      );
      expect(updateResponse.body.date).toBe(originalDate);
      expect(updateResponse.body._id).toBe(entryId);
    });

    it("should update entry date only", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry text stays same",
        });

      const entryId = createResponse.body._id;
      const originalEntry = createResponse.body.entry;

      // Update the date
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-25",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.date).toBe("2025-10-25");
      expect(updateResponse.body.entry).toBe(originalEntry);
      expect(updateResponse.body._id).toBe(entryId);
    });

    it("should update both date and entry text", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original content",
        });

      const entryId = createResponse.body._id;

      // Update both fields
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-24",
          entry: "Completely updated content",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.date).toBe("2025-10-24");
      expect(updateResponse.body.entry).toBe("Completely updated content");
      expect(updateResponse.body._id).toBe(entryId);
    });

    it("should refresh updatedAt timestamp on update", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;
      const createdAt = new Date(createResponse.body.createdAt);

      // Wait a moment to ensure timestamps differ
      await new Promise((resolve) => setTimeout(resolve, 100));

      const beforeUpdate = new Date();

      // Update the entry
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Updated entry",
        });

      const afterUpdate = new Date();

      expect(updateResponse.status).toBe(200);

      const createdAtFromUpdate = new Date(updateResponse.body.createdAt);
      const updatedAtFromUpdate = new Date(updateResponse.body.updatedAt);

      // createdAt should remain unchanged
      expect(createdAtFromUpdate.getTime()).toBe(createdAt.getTime());

      // updatedAt should be newer
      expect(updatedAtFromUpdate.getTime()).toBeGreaterThan(
        createdAt.getTime(),
      );
      expect(updatedAtFromUpdate.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(updatedAtFromUpdate.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
    });

    it("should preserve createdAt timestamp on update", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;
      const originalCreatedAt = createResponse.body.createdAt;

      // Update the entry
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Updated entry text",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.createdAt).toBe(originalCreatedAt);
    });

    it("should preserve createdBy on update", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;
      const originalCreatedBy = createResponse.body.createdBy;

      // Update the entry
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Updated entry",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.createdBy).toBe(originalCreatedBy);
    });

    it("should accept entry text with maximum length (10,000 characters)", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;
      const maxLengthEntry = "x".repeat(10000);

      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: maxLengthEntry,
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.entry).toBe(maxLengthEntry);
    });

    it("should return updated entry with all fields", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;

      // Update the entry
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Updated entry",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty("_id");
      expect(updateResponse.body).toHaveProperty("date");
      expect(updateResponse.body).toHaveProperty("entry");
      expect(updateResponse.body).toHaveProperty("isPersonal", true);
      expect(updateResponse.body).toHaveProperty("createdBy");
      expect(updateResponse.body).toHaveProperty("createdAt");
      expect(updateResponse.body).toHaveProperty("updatedAt");
    });
  });

  describe("Validation Errors", () => {
    it("should reject update with invalid date format with 400", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;

      // Try to update with invalid date
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025/10/23",
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.error).toBeDefined();
    });

    it("should reject update with entry text exceeding 10,000 characters with 400", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;
      const tooLongEntry = "x".repeat(10001);

      // Try to update with too long entry
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: tooLongEntry,
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.error).toBeDefined();
    });

    it("should handle empty update body", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;

      // Try to update with empty body - should either reject or be no-op
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      // Depending on implementation, this could be 200 (no-op) or 400 (validation error)
      expect([200, 400]).toContain(updateResponse.status);
    });

    it("should reject update with invalid date format", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;

      const invalidDates = [
        "2025-1-23", // missing leading zero on month
        "2025-10-5", // missing leading zero on day
        "invalid-format",
        "2025/10/23",
      ];

      for (const invalidDate of invalidDates) {
        const updateResponse = await request(baseUrl)
          .patch(`/v1/diary/${entryId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            date: invalidDate,
          });

        expect(updateResponse.status).toBe(400);
      }
    });
  });

  describe("Not Found Errors", () => {
    it("should return 404 for non-existent entry", async () => {
      const nonExistentId = new ObjectId().toString();

      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${nonExistentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Update attempt",
        });

      expect(updateResponse.status).toBe(404);
    });

    it("should return 404 or 400 for invalid entry ID format", async () => {
      const updateResponse = await request(baseUrl)
        .patch("/v1/diary/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Update attempt",
        });

      expect([400, 404]).toContain(updateResponse.status);
    });
  });

  describe("Authorization (Creator Ownership)", () => {
    it("should reject update to another user's entry with 403", async () => {
      // Create entry as first user
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      const entryId = createResponse.body._id;

      // Register and authenticate as second user
      _testCounter++;
      const user2Email = `updateuser${_testCounter}@example.com`;
      const user2RegisterResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: user2Email,
          password: "SecurePassword123!",
          name: "Second User",
          birthdate: "1992-06-10",
        });

      const user2Token =
        user2RegisterResponse.body.accessToken ||
        user2RegisterResponse.body.sessionToken;

      // Try to update as second user
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          entry: "Attempting to update another user's entry",
        });

      expect(updateResponse.status).toBe(403);
      expect(updateResponse.body.error).toBeDefined();
    });

    it("should allow user to update their own entry", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original",
        });

      const entryId = createResponse.body._id;

      // Update as same user
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Updated by owner",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.entry).toBe("Updated by owner");
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .send({
          entry: "Update without auth",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token-xyz")
        .send({
          entry: "Update with invalid token",
        });

      expect(response.status).toBe(401);
    });

    it("should reject request with malformed Authorization header with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", "InvalidScheme token")
        .send({
          entry: "Update with malformed auth",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Partial Updates", () => {
    it("should support partial updates without requiring all fields", async () => {
      // Create an entry with specific data
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original complete entry",
        });

      const entryId = createResponse.body._id;
      const originalDate = createResponse.body.date;

      // Update only entry text, not date
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "New text only",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.entry).toBe("New text only");
      expect(updateResponse.body.date).toBe(originalDate);
    });

    it("should allow multiple sequential updates", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Initial entry",
        });

      const entryId = createResponse.body._id;

      // First update
      const update1 = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "First update",
        });

      expect(update1.status).toBe(200);

      // Second update
      const update2 = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-24",
        });

      expect(update2.status).toBe(200);
      expect(update2.body.entry).toBe("First update");
      expect(update2.body.date).toBe("2025-10-24");

      // Third update
      const update3 = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          entry: "Third update",
          date: "2025-10-25",
        });

      expect(update3.status).toBe(200);
      expect(update3.body.entry).toBe("Third update");
      expect(update3.body.date).toBe("2025-10-25");
    });
  });
});
