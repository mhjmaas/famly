import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/diary/:entryId - Get Entry", () => {
  let baseUrl: string;
  let authToken: string;
  let _testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    _testCounter++;
    const uniqueEmail = `getuser${_testCounter}@example.com`;

    // Register and login a test user
    const registerResponse = await request(baseUrl)
      .post("/v1/auth/register")
      .send({
        email: uniqueEmail,
        password: "SecurePassword123!",
        name: "Get User",
        birthdate: "1987-08-10",
      });

    expect(registerResponse.status).toBe(201);
    authToken =
      registerResponse.body.accessToken || registerResponse.body.sessionToken;
    expect(authToken).toBeDefined();
  });

  describe("Success Cases", () => {
    it("should retrieve own diary entry by ID", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Test entry for retrieval",
        });

      expect(createResponse.status).toBe(201);
      const entryId = createResponse.body._id;

      // Retrieve the entry
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(entryId);
      expect(getResponse.body.date).toBe("2025-10-23");
      expect(getResponse.body.entry).toBe("Test entry for retrieval");
    });

    it("should return complete diary entry object with all fields", async () => {
      // Create an entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-22",
          entry: "Complete entry validation",
        });

      const entryId = createResponse.body._id;

      // Retrieve the entry
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty("_id");
      expect(getResponse.body).toHaveProperty("date");
      expect(getResponse.body).toHaveProperty("entry");
      expect(getResponse.body).toHaveProperty("isPersonal", true);
      expect(getResponse.body).toHaveProperty("createdBy");
      expect(getResponse.body).toHaveProperty("createdAt");
      expect(getResponse.body).toHaveProperty("updatedAt");

      // Verify types
      expect(typeof getResponse.body._id).toBe("string");
      expect(typeof getResponse.body.date).toBe("string");
      expect(typeof getResponse.body.entry).toBe("string");
      expect(typeof getResponse.body.isPersonal).toBe("boolean");
      expect(typeof getResponse.body.createdBy).toBe("string");
      expect(typeof getResponse.body.createdAt).toBe("string");
      expect(typeof getResponse.body.updatedAt).toBe("string");
    });

    it("should retrieve entry with long text content", async () => {
      const longEntry = "a".repeat(5000);

      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-21",
          entry: longEntry,
        });

      const entryId = createResponse.body._id;

      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.entry).toBe(longEntry);
    });

    it("should preserve exact entry content on retrieval", async () => {
      const specialContent = "Line 1\nLine 2\tTab\nSpecial chars: !@#$%^&*()";

      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-20",
          entry: specialContent,
        });

      const entryId = createResponse.body._id;

      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.entry).toBe(specialContent);
    });
  });

  describe("Not Found Errors", () => {
    it("should return 404 for non-existent entry", async () => {
      const nonExistentId = new ObjectId().toString();

      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${nonExistentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
      expect(getResponse.body.error).toBeDefined();
    });

    it("should return 404 for invalid entry ID format", async () => {
      const getResponse = await request(baseUrl)
        .get("/v1/diary/invalid-id-format")
        .set("Authorization", `Bearer ${authToken}`);

      expect([400, 404]).toContain(getResponse.status);
    });

    it("should return 404 for malformed ObjectId", async () => {
      const getResponse = await request(baseUrl)
        .get("/v1/diary/12345")
        .set("Authorization", `Bearer ${authToken}`);

      expect([400, 404]).toContain(getResponse.status);
    });
  });

  describe("Authorization (Creator Ownership)", () => {
    it("should reject access to another user's entry with 403", async () => {
      // Create entry as first user
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "User 1 private entry",
        });

      const entryId = createResponse.body._id;

      // Register and authenticate as second user
      _testCounter++;
      const user2Email = `getuser${_testCounter}@example.com`;
      const user2RegisterResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: user2Email,
          password: "SecurePassword123!",
          name: "Second User",
          birthdate: "1990-12-05",
        });

      const user2Token =
        user2RegisterResponse.body.accessToken ||
        user2RegisterResponse.body.sessionToken;

      // Try to retrieve as second user
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(getResponse.status).toBe(403);
      expect(getResponse.body.error).toBeDefined();
    });

    it("should allow user to retrieve their own entry", async () => {
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Own entry",
        });

      const entryId = createResponse.body._id;

      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(entryId);
    });

    it("should not expose deleted entries", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      const entryId = createResponse.body._id;

      // Delete entry
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Try to retrieve deleted entry
      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl).get(`/v1/diary/${entryId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject request with invalid token with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", "Bearer invalid-token-abc");

      expect(response.status).toBe(401);
    });

    it("should reject request with malformed Authorization header with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", "NotBearer token");

      expect(response.status).toBe(401);
    });

    it("should reject request without Authorization header with 401", async () => {
      const entryId = new ObjectId().toString();

      const response = await request(baseUrl).get(`/v1/diary/${entryId}`);

      expect(response.status).toBe(401);
    });
  });

  describe("Data Integrity", () => {
    it("should return consistent data when retrieving same entry multiple times", async () => {
      // Create entry
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "Consistency test",
        });

      const entryId = createResponse.body._id;

      // Retrieve multiple times
      const getResponse1 = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      const getResponse2 = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse1.status).toBe(200);
      expect(getResponse2.status).toBe(200);

      // Compare all fields except timestamps which might differ slightly
      expect(getResponse1.body._id).toBe(getResponse2.body._id);
      expect(getResponse1.body.date).toBe(getResponse2.body.date);
      expect(getResponse1.body.entry).toBe(getResponse2.body.entry);
      expect(getResponse1.body.isPersonal).toBe(getResponse2.body.isPersonal);
      expect(getResponse1.body.createdBy).toBe(getResponse2.body.createdBy);
    });

    it("should maintain createdBy for retrieved entries", async () => {
      const createResponse = await request(baseUrl)
        .post("/v1/diary")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          date: "2025-10-23",
          entry: "CreatedBy validation",
        });

      const entryId = createResponse.body._id;
      const expectedCreatedBy = createResponse.body.createdBy;

      const getResponse = await request(baseUrl)
        .get(`/v1/diary/${entryId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.createdBy).toBe(expectedCreatedBy);
    });
  });
});
