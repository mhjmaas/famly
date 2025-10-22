import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/tasks", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const uniqueEmail = `taskuser${testCounter}@example.com`;

    // Register and login a test user
    const registerResponse = await request(baseUrl)
      .post("/v1/auth/register")
      .send({
        email: uniqueEmail,
        password: "SecurePassword123!",
        name: "Task User",
        birthdate: "1990-01-15",
      });

    expect(registerResponse.status).toBe(201);
    authToken =
      registerResponse.body.accessToken || registerResponse.body.sessionToken;

    // Create a family
    const familyResponse = await request(baseUrl)
      .post("/v1/families")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Test Family" });

    expect(familyResponse.status).toBe(201);
    familyId = familyResponse.body.familyId;
  });

  describe("Success Cases", () => {
    it("should return empty array for family with no tasks", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return all tasks for a family", async () => {
      // Create multiple tasks
      const task1 = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task 1",
          assignment: { type: "unassigned" },
        });

      const task2 = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task 2",
          dueDate: "2025-01-20T10:00:00Z",
          assignment: { type: "role", role: "parent" },
        });

      const task3 = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task 3",
          description: "Description",
          assignment: { type: "role", role: "child" },
        });

      expect(task1.status).toBe(201);
      expect(task2.status).toBe(201);
      expect(task3.status).toBe(201);

      // List all tasks
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);

      // Verify all tasks are present (ordered by createdAt desc)
      const taskNames = response.body.map((t: any) => t.name);
      expect(taskNames).toContain("Task 1");
      expect(taskNames).toContain("Task 2");
      expect(taskNames).toContain("Task 3");

      // Verify task structure
      response.body.forEach((task: any) => {
        expect(task).toHaveProperty("_id");
        expect(task).toHaveProperty("familyId", familyId);
        expect(task).toHaveProperty("name");
        expect(task).toHaveProperty("assignment");
        expect(task).toHaveProperty("createdBy");
        expect(task).toHaveProperty("createdAt");
        expect(task).toHaveProperty("updatedAt");
      });
    });

    it("should filter tasks by date range (dueDateFrom)", async () => {
      // Create tasks with different due dates
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Past Task",
          dueDate: "2025-01-10T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Future Task",
          dueDate: "2025-01-25T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      // Filter from Jan 20
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks?dueDateFrom=2025-01-20T00:00:00Z`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Future Task");
    });

    it("should filter tasks by date range (dueDateTo)", async () => {
      // Create tasks with different due dates
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Past Task",
          dueDate: "2025-01-10T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Future Task",
          dueDate: "2025-01-25T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      // Filter to Jan 15
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks?dueDateTo=2025-01-15T00:00:00Z`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("Past Task");
    });

    it("should filter tasks by date range (both dueDateFrom and dueDateTo)", async () => {
      // Create tasks with different due dates
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Before Range",
          dueDate: "2025-01-05T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "In Range",
          dueDate: "2025-01-15T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "After Range",
          dueDate: "2025-01-25T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      // Filter Jan 10 to Jan 20
      const response = await request(baseUrl)
        .get(
          `/v1/families/${familyId}/tasks?dueDateFrom=2025-01-10T00:00:00Z&dueDateTo=2025-01-20T00:00:00Z`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe("In Range");
    });

    it("should include tasks without due dates when no date filter applied", async () => {
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "No Due Date",
          assignment: { type: "unassigned" },
        });

      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "With Due Date",
          dueDate: "2025-01-15T10:00:00Z",
          assignment: { type: "unassigned" },
        });

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/tasks`,
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
        .get(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
