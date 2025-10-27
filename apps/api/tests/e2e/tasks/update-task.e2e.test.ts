import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PATCH /v1/families/:familyId/tasks/:taskId", () => {
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
        name: "Original Task",
        description: "Original Description",
        dueDate: "2025-01-15T10:00:00Z",
        assignment: { type: "role", role: "parent" },
      });

    expect(taskResponse.status).toBe(201);
    taskId = taskResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should update task name", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Task Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Task Name");
      expect(response.body.description).toBe("Original Description"); // Unchanged
    });

    it("should update task description", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "Updated Description",
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe("Updated Description");
      expect(response.body.name).toBe("Original Task"); // Unchanged
    });

    it("should update task due date", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          dueDate: "2025-02-20T14:30:00Z",
        });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBe("2025-02-20T14:30:00.000Z");
    });

    it("should update task assignment", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          assignment: { type: "role", role: "child" },
        });

      expect(response.status).toBe(200);
      expect(response.body.assignment).toEqual({
        type: "role",
        role: "child",
      });
    });

    it("should update multiple fields at once", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Completely Updated",
          description: "New description",
          dueDate: "2025-03-01T09:00:00Z",
          assignment: { type: "unassigned" },
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Completely Updated");
      expect(response.body.description).toBe("New description");
      expect(response.body.dueDate).toBe("2025-03-01T09:00:00.000Z");
      expect(response.body.assignment).toEqual({ type: "unassigned" });
    });

    it("should refresh updatedAt timestamp", async () => {
      // Get original task
      const originalResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      const originalUpdatedAt = originalResponse.body.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update task
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime(),
      );
    });

    it("should mark task as complete by setting completedAt", async () => {
      const completedAt = "2025-01-16T15:30:00Z";
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          completedAt,
        });

      expect(response.status).toBe(200);
      expect(response.body.completedAt).toBe("2025-01-16T15:30:00.000Z");
    });

    it("should mark task as incomplete by setting completedAt to null", async () => {
      // First complete the task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          completedAt: "2025-01-16T15:30:00Z",
        });

      // Then mark as incomplete
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          completedAt: null,
        });

      expect(response.status).toBe(200);
      expect(response.body.completedAt).toBeUndefined();
    });
  });

  describe("Validation Errors", () => {
    it("should reject empty name", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject name exceeding 200 characters", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "a".repeat(201),
        });

      expect(response.status).toBe(400);
    });

    it("should reject description exceeding 2000 characters", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "a".repeat(2001),
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid dueDate format", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          dueDate: "not-a-date",
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid completedAt format", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          completedAt: "invalid-date",
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid assignment type", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          assignment: { type: "invalid" },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent task", async () => {
      const fakeTaskId = new ObjectId().toString();
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${fakeTaskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid task ID format", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .send({
          name: "Updated Name",
        });

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
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(403);
    });
  });
});
