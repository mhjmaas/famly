import { ObjectId } from "mongodb";
import request from "supertest";
import { registerTestUser } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: DELETE /v1/diary/:entryId - Delete Entry", () => {
  let baseUrl: string;
  let authToken: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const user = await registerTestUser(baseUrl, testCounter, "deleteuser", {
      name: "Delete User",
      birthdate: "1984-11-30",
    });

    authToken = user.token;
  });

  describe("Success Cases", () => {
    it("should delete own entry and return 204 No Content", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      expect(createResponse.status).toBe(201);
      const entryId = createResponse.body._id;

      // Delete the entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});
    });

    it("should return empty body in 204 response", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      const entryId = createResponse.body._id;

      // Delete the entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);
      // 204 should have no content
      expect(deleteResponse.body).toEqual({});
    });

    it("should remove entry from database after deletion", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      const entryId = createResponse.body._id;

      // Delete the entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify entry is gone by trying to retrieve it
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("should not appear in list after deletion", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      const entryId = createResponse.body._id;

      // Verify entry is in list
      let listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      expect(listResponse.body[0]._id).toBe(entryId);

      // Delete the entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify entry is no longer in list
      listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(0);
    });

    it("should delete one entry without affecting others", async () => {
      // Create multiple entries
      const entry1Response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry 1",
        });

      const entry2Response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-24",
          entry: "Entry 2",
        });

      const entry3Response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-25",
          entry: "Entry 3",
        });

      // Delete the middle entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entry2Response.body._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify only entry2 is deleted
      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(2);

      const remainingIds = listResponse.body.map((e: { _id: string }) => e._id);
      expect(remainingIds).toContain(entry1Response.body._id);
      expect(remainingIds).toContain(entry3Response.body._id);
      expect(remainingIds).not.toContain(entry2Response.body._id);
    });

    it("should allow idempotent first deletion", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      const entryId = createResponse.body._id;

      // First delete
      const deleteResponse1 = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse1.status).toBe(204);

      // Entry should now be gone
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe("Not Found Errors", () => {
    it("should return 404 for non-existent entry", async () => {
      const nonExistentId = new ObjectId().toString();

      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${nonExistentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.body.error).toBeDefined();
    });

    it("should return 404 on second delete of same entry", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      const entryId = createResponse.body._id;

      // First delete succeeds
      const deleteResponse1 = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse1.status).toBe(204);

      // Second delete should return 404
      const deleteResponse2 = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse2.status).toBe(404);
    });

    it("should return 404 or 400 for invalid entry ID format", async () => {
      const deleteResponse = await request(baseUrl)
        .delete("/v1/diary/invalid-id-format")
        .set("Authorization", `Bearer ${authToken}`);

      expect([400, 404]).toContain(deleteResponse.status);
    });

    it("should return 404 for malformed ObjectId", async () => {
      const deleteResponse = await request(baseUrl)
        .delete("/v1/diary/12345invalid")
        .set("Authorization", `Bearer ${authToken}`);

      expect([400, 404]).toContain(deleteResponse.status);
    });
  });

  describe("Authorization (Creator Ownership)", () => {
    it("should reject deletion of another user's entry with 403", async () => {
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
      testCounter++;
      const user2 = await registerTestUser(baseUrl, testCounter, "deleteuser", {
        name: "Second User",
        birthdate: "1991-03-15",
      });
      const user2Token = user2.token;

      // Try to delete as second user
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(deleteResponse.status).toBe(403);
      expect(deleteResponse.body.error).toBeDefined();

      // Verify entry still exists
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(entryId);
    });

    it("should allow user to delete their own entry", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Own entry",
        });

      const entryId = createResponse.body._id;

      // Delete as owner
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify entry is deleted
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("should not allow unauthorized deletion even if entry exists", async () => {
      // Create entry as first user
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Protected entry",
        });

      const entryId = createResponse.body._id;

      // Register second user
      testCounter++;
      const user2 = await registerTestUser(baseUrl, testCounter, "deleteuser", {
        name: "Other User",
        birthdate: "1995-07-20",
      });
      const user2Token = user2.token;

      // User 2 cannot delete user 1's entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(deleteResponse.status).toBe(403);
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl).delete(`/v1/diary/${entryId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token-abc");

      expect(response.status).toBe(401);
    });

    it("should reject request with malformed Authorization header with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", "InvalidScheme token");

      expect(response.status).toBe(401);
    });

    it("should reject request without Authorization header with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl).delete(`/v1/diary/${entryId}`);

      expect(response.status).toBe(401);
    });
  });

  describe("Data Consistency", () => {
    it("should not affect other users' entries when deleting", async () => {
      // User 1 creates an entry
      const user1EntryResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      // User 2 creates an entry
      testCounter++;
      const user2 = await registerTestUser(baseUrl, testCounter, "deleteuser", {
        name: "User 2",
        birthdate: "1993-09-12",
      });
      const user2Token = user2.token;

      const user2EntryResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 2 entry",
        });

      // User 1 deletes their entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${user1EntryResponse.body._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // User 2's entry should still be accessible
      const user2GetResponse = await request(baseUrl)
        .get(`/v1/diary/${user2EntryResponse.body._id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2GetResponse.status).toBe(200);
      expect(user2GetResponse.body._id).toBe(user2EntryResponse.body._id);
    });
  });

  describe("Edge Cases", () => {
    it("should handle deletion of entry with long text content", async () => {
      const longEntry = "x".repeat(10000);

      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: longEntry,
        });

      const entryId = createResponse.body._id;

      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify deletion
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("should handle rapid deletion attempts", async () => {
      // Create two entries
      const entry1Response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry 1",
        });

      const entry2Response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-24",
          entry: "Entry 2",
        });

      // Delete both rapidly
      const delete1 = await request(baseUrl)
        .delete(`/v1/diary/${entry1Response.body._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      const delete2 = await request(baseUrl)
        .delete(`/v1/diary/${entry2Response.body._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(delete1.status).toBe(204);
      expect(delete2.status).toBe(204);

      // Verify both are deleted
      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(0);
    });
  });
});
