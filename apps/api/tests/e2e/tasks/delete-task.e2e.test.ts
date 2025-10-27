import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: DELETE /v1/families/:familyId/tasks/:taskId", () => {
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
        name: "Task to Delete",
        assignment: { type: "unassigned" },
      });

    expect(taskResponse.status).toBe(201);
    taskId = taskResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should delete task and return 204", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it("should actually remove task from database", async () => {
      // Delete the task
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Try to get the deleted task
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("should not affect other tasks in the family", async () => {
      // Create another task
      const task2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task to Keep",
          assignment: { type: "unassigned" },
        });

      const task2Id = task2Response.body._id;

      // Delete first task
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Verify second task still exists
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${task2Id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe("Task to Keep");
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent task", async () => {
      const fakeTaskId = new ObjectId().toString();
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/${fakeTaskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid task ID format", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when trying to delete same task twice", async () => {
      // Delete once
      const firstDelete = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(firstDelete.status).toBe(204);

      // Try to delete again
      const secondDelete = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(secondDelete.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).delete(
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
        .delete(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
