import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/tasks/:taskId", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let taskId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Task User",
      familyName: "Test Family",
      prefix: "taskuser",
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Create a task
    const taskResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/tasks`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Task",
        description: "Test Description",
        dueDate: "2025-01-15T10:00:00Z",
        assignment: { type: "role", role: "parent" },
      });

    expect(taskResponse.status).toBe(201);
    taskId = taskResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should return task by ID", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(taskId);
      expect(response.body.familyId).toBe(familyId);
      expect(response.body.name).toBe("Test Task");
      expect(response.body.description).toBe("Test Description");
      expect(response.body.dueDate).toBe("2025-01-15T10:00:00.000Z");
      expect(response.body.assignment).toEqual({
        type: "role",
        role: "parent",
      });
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent task", async () => {
      const fakeTaskId = new ObjectId().toString();
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${fakeTaskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid task ID format", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 403 when task belongs to different family", async () => {
      // Create another family
      const otherFamilyResponse = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Other Family" });

      const otherFamilyId = otherFamilyResponse.body.familyId;

      // Try to access task from first family using second family ID
      const response = await request(baseUrl)
        .get(`/v1/families/${otherFamilyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/tasks/${taskId}`,
      );

      expect(response.status).toBe(401);
    });

    it("should reject request from non-member", async () => {
      // Create another user
      const otherUserResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: `otheruser${testCounter}@example.com`,
          password: "SecurePassword123!",
          name: "Other User",
          birthdate: "1990-01-15",
        });

      const otherToken =
        otherUserResponse.body.accessToken ||
        otherUserResponse.body.sessionToken;

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
