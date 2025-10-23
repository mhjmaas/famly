import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: /v1/diary - Authorization", () => {
  let baseUrl: string;
  let user1Token: string;
  let user1Id: string;
  let user2Token: string;
  let user2Id: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Register and authenticate User 1
    testCounter++;
    const user1Email = `authuser1-${testCounter}@example.com`;
    const user1RegisterResponse = await request(baseUrl)
      .post("/v1/auth/register")
      .send({
        email: user1Email,
        password: "SecurePassword123!",
        name: "Auth User 1",
        birthdate: "1985-01-01",
      });

    expect(user1RegisterResponse.status).toBe(201);
    user1Token =
      user1RegisterResponse.body.accessToken ||
      user1RegisterResponse.body.sessionToken;
    user1Id = user1RegisterResponse.body.user.id;

    // Register and authenticate User 2
    const user2Email = `authuser2-${testCounter}@example.com`;
    const user2RegisterResponse = await request(baseUrl)
      .post("/v1/auth/register")
      .send({
        email: user2Email,
        password: "SecurePassword123!",
        name: "Auth User 2",
        birthdate: "1990-05-15",
      });

    expect(user2RegisterResponse.status).toBe(201);
    user2Token =
      user2RegisterResponse.body.accessToken ||
      user2RegisterResponse.body.sessionToken;
    user2Id = user2RegisterResponse.body.user.id;
  });

  describe("Creator Ownership Authorization", () => {
    it("should reject GET of another user's entry with 403", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 private entry",
        });

      const entryId = createResponse.body._id;

      // User 2 tries to GET
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(getResponse.status).toBe(403);
      expect(getResponse.body.error).toBeDefined();
    });

    it("should reject PATCH of another user's entry with 403", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      const entryId = createResponse.body._id;

      // User 2 tries to PATCH
      const patchResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          entry: "Hacked content",
        });

      expect(patchResponse.status).toBe(403);
      expect(patchResponse.body.error).toBeDefined();

      // Verify original entry unchanged
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getResponse.body.entry).toBe("User 1 entry");
    });

    it("should reject DELETE of another user's entry with 403", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      const entryId = createResponse.body._id;

      // User 2 tries to DELETE
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(deleteResponse.status).toBe(403);
      expect(deleteResponse.body.error).toBeDefined();

      // Verify entry still exists
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(entryId);
    });

    it("should allow user to GET their own entry", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      const entryId = createResponse.body._id;

      // User 1 retrieves their own entry
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(entryId);
    });

    it("should allow user to PATCH their own entry", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Original",
        });

      const entryId = createResponse.body._id;

      // User 1 updates their own entry
      const patchResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          entry: "Updated by owner",
        });

      expect(patchResponse.status).toBe(200);
      expect(patchResponse.body.entry).toBe("Updated by owner");
    });

    it("should allow user to DELETE their own entry", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      const entryId = createResponse.body._id;

      // User 1 deletes their own entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(deleteResponse.status).toBe(204);

      // Verify deletion
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(getResponse.status).toBe(404);
    });

    it("should enforce creator ownership on all mutating endpoints", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Protected entry",
        });

      const entryId = createResponse.body._id;

      // User 2 attempts GET (should fail with 403)
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(getResponse.status).toBe(403);

      // User 2 attempts PATCH (should fail with 403)
      const patchResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({ entry: "Attempted hack" });
      expect(patchResponse.status).toBe(403);

      // User 2 attempts DELETE (should fail with 403)
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);
      expect(deleteResponse.status).toBe(403);

      // Entry should still be accessible to owner
      const ownerGetResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`);
      expect(ownerGetResponse.status).toBe(200);
      expect(ownerGetResponse.body.entry).toBe("Protected entry");
    });
  });

  describe("Data Isolation - List Endpoint", () => {
    it("should not leak other users' entries in list", async () => {
      // User 1 creates 2 entries
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry 1",
        });

      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-24",
          entry: "User 1 entry 2",
        });

      // User 2 creates 1 entry
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          date: "2025-10-25",
          entry: "User 2 entry",
        });

      // User 1 lists entries
      const user1ListResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(user1ListResponse.status).toBe(200);
      expect(user1ListResponse.body).toHaveLength(2);

      // Verify User 2's entry is not in User 1's list
      const user1Entries = user1ListResponse.body.map(
        (e: { entry: string }) => e.entry,
      );
      expect(user1Entries).toContain("User 1 entry 1");
      expect(user1Entries).toContain("User 1 entry 2");
      expect(user1Entries).not.toContain("User 2 entry");

      // User 2 lists entries
      const user2ListResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2ListResponse.status).toBe(200);
      expect(user2ListResponse.body).toHaveLength(1);
      expect(user2ListResponse.body[0].entry).toBe("User 2 entry");
    });

    it("should not leak entries with date range filtering", async () => {
      // User 1 creates entries
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-15",
          entry: "User 1 early",
        });

      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-25",
          entry: "User 1 late",
        });

      // User 2 creates entry in same date range
      await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          date: "2025-10-20",
          entry: "User 2 in range",
        });

      // User 1 lists with date range filter
      const listResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .query({ startDate: "2025-10-01", endDate: "2025-10-31" });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(2);

      const entries = listResponse.body.map((e: { entry: string }) => e.entry);
      expect(entries).not.toContain("User 2 in range");
    });
  });

  describe("Authentication Requirements", () => {
    it("should reject POST without token with 401", async () => {
      const response = await request(baseUrl).post("/v1/diary").send({
        date: "2025-10-23",
        entry: "No auth",
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject POST with invalid token with 401", async () => {
      const response = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", "Bearer invalid-token")
        .send({
          date: "2025-10-23",
          entry: "Invalid token",
        });

      expect(response.status).toBe(401);
    });

    it("should reject GET list without token with 401", async () => {
      const response = await request(baseUrl).get("/v1/diary");

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject GET list with invalid token with 401", async () => {
      const response = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("should reject GET entry without token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl).get(`/v1/diary/${entryId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject GET entry with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("should reject PATCH without token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .send({
          entry: "No auth update",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject PATCH with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token")
        .send({
          entry: "Invalid token update",
        });

      expect(response.status).toBe(401);
    });

    it("should reject DELETE without token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl).delete(`/v1/diary/${entryId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject DELETE with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });

    it("should reject all endpoints with malformed auth header", async () => {
      const entryId = new ObjectId().toString();
      const malformedAuth = "NotBearer sometoken";

      // POST
      const postResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", malformedAuth)
        .send({ date: "2025-10-23", entry: "Test" });
      expect(postResponse.status).toBe(401);

      // GET list
      const getListResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", malformedAuth);
      expect(getListResponse.status).toBe(401);

      // GET entry
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", malformedAuth);
      expect(getResponse.status).toBe(401);

      // PATCH
      const patchResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", malformedAuth)
        .send({ entry: "Update" });
      expect(patchResponse.status).toBe(401);

      // DELETE
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", malformedAuth);
      expect(deleteResponse.status).toBe(401);
    });

    it("should reject all protected endpoints without Authorization header", async () => {
      const entryId = new ObjectId().toString();

      // GET list
      const getListResponse = await request(baseUrl).get("/v1/diary");
      expect(getListResponse.status).toBe(401);

      // GET entry
      const getResponse = await request(baseUrl).get(`/v1/diary/${entryId}`);
      expect(getResponse.status).toBe(401);

      // PATCH
      const patchResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .send({ entry: "Update" });
      expect(patchResponse.status).toBe(401);

      // DELETE
      const deleteResponse = await request(baseUrl).delete(
        `/v1/diary/${entryId}`,
      );
      expect(deleteResponse.status).toBe(401);
    });
  });

  describe("Complex Authorization Scenarios", () => {
    it("should maintain separation even after entry update by owner", async () => {
      // User 1 creates entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;

      // User 1 updates it
      const updateResponse = await request(baseUrl)
        .patch(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          entry: "Updated entry",
        });

      expect(updateResponse.status).toBe(200);

      // User 2 still cannot access it
      const user2GetResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2GetResponse.status).toBe(403);
    });

    it("should prevent privilege escalation attacks", async () => {
      // User 2 creates entry with User 1's ID in attempt to claim ownership
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          date: "2025-10-23",
          entry: "Entry by user 2",
        });

      const entryId = createResponse.body._id;

      // Verify createdBy is User 2, not User 1
      expect(createResponse.body.createdBy).toBe(user2Id);
      expect(createResponse.body.createdBy).not.toBe(user1Id);

      // User 1 cannot access this entry
      const user1GetResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(user1GetResponse.status).toBe(403);
    });

    it("should handle concurrent operations from different users", async () => {
      // User 1 creates entry
      const user1CreateResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 entry",
        });

      const user1EntryId = user1CreateResponse.body._id;

      // User 2 creates entry simultaneously
      const user2CreateResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          date: "2025-10-24",
          entry: "User 2 entry",
        });

      const user2EntryId = user2CreateResponse.body._id;

      // User 1 tries to access User 2's entry
      const crossAccessResponse = await request(baseUrl)
        .get(`/v1/diary/${user2EntryId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(crossAccessResponse.status).toBe(403);

      // Both users should see correct entry counts
      const user1ListResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${user1Token}`);

      const user2ListResponse = await request(baseUrl)
        .get("/v1/diary")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user1ListResponse.body).toHaveLength(1);
      expect(user2ListResponse.body).toHaveLength(1);
      expect(user1ListResponse.body[0]._id).toBe(user1EntryId);
      expect(user2ListResponse.body[0]._id).toBe(user2EntryId);
    });
  });
});
