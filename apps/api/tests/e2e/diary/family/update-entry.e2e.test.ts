import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: PATCH /v1/families/:familyId/diary/:entryId - Update Family Diary Entry", () => {
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
    it("should update family diary entry text", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;

      // Update entry
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          entry: "Updated entry text",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.entry).toBe("Updated entry text");
      expect(updateResponse.body.date).toBe("2025-10-23"); // Date unchanged
    });

    it("should update family diary entry date", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Test entry",
        });

      const entryId = createResponse.body._id;

      // Update date
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-24",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.date).toBe("2025-10-24");
      expect(updateResponse.body.entry).toBe("Test entry"); // Entry unchanged
    });

    it("should update both date and entry text", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original",
        });

      const entryId = createResponse.body._id;

      // Update both
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-25",
          entry: "Updated both",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.date).toBe("2025-10-25");
      expect(updateResponse.body.entry).toBe("Updated both");
    });

    it("should update updatedAt timestamp", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original",
        });

      const entryId = createResponse.body._id;
      const originalUpdatedAt = new Date(createResponse.body.updatedAt);

      // Wait a moment and update
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          entry: "Updated",
        });

      const newUpdatedAt = new Date(updateResponse.body.updatedAt);

      expect(newUpdatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it("should not change createdBy on update", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original",
        });

      const entryId = createResponse.body._id;
      const originalCreatedBy = createResponse.body.createdBy;

      // Update entry
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          entry: "Updated",
        });

      expect(updateResponse.body.createdBy).toBe(originalCreatedBy);
    });
  });

  describe("Validation Errors", () => {
    it("should reject update with invalid date format with 400", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Test",
        });

      const entryId = createResponse.body._id;

      // Try to update with invalid date
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "invalid-date",
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.error).toBeDefined();
    });

    it("should reject update with entry exceeding max length with 400", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original",
        });

      const entryId = createResponse.body._id;

      // Try to update with too long entry
      const tooLongEntry = "a".repeat(10001);
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          entry: tooLongEntry,
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.error).toBeDefined();
    });

    it("should accept update with max length entry", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          date: "2025-10-23",
          entry: "Original",
        });

      const entryId = createResponse.body._id;

      // Update with max length entry
      const maxLengthEntry = "a".repeat(10000);
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          entry: maxLengthEntry,
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.entry).toBe(maxLengthEntry);
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent entry", async () => {
      const nonExistentId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${nonExistentId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          entry: "Updated",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .send({
          entry: "No auth update",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token-123")
        .send({
          entry: "Invalid token update",
        });

      expect(response.status).toBe(401);
    });
  });
});
