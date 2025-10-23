import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { setupTestFamily } from "../helpers/auth-setup";

describe("E2E: POST /v1/families/:familyId/tasks", () => {
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
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Task User",
      familyName: "Test Family",
      prefix: "taskuser"
    });

    authToken = setup.token;
    familyId = setup.familyId;
  });

  describe("Success Cases", () => {
    it("should create task with member assignment", async () => {
      const memberId = new ObjectId().toString();
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Clean the kitchen",
          description: "Wipe counters and do dishes",
          dueDate: "2025-01-15T10:00:00Z",
          assignment: {
            type: "member",
            memberId,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe("Clean the kitchen");
      expect(response.body.description).toBe("Wipe counters and do dishes");
      expect(response.body.dueDate).toBe("2025-01-15T10:00:00.000Z");
      expect(response.body.assignment.type).toBe("member");
      expect(response.body.assignment.memberId).toBeDefined();
      // ObjectIds are serialized as objects in JSON responses, not strings
      expect(response.body.familyId).toBe(familyId);
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
      expect(response.body.scheduleId).toBeUndefined();
      expect(response.body.completedAt).toBeUndefined();
    });

    it("should create task with role assignment (parent)", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Pay bills",
          assignment: {
            type: "role",
            role: "parent",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Pay bills");
      expect(response.body.assignment).toEqual({
        type: "role",
        role: "parent",
      });
    });

    it("should create task with role assignment (child)", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Do homework",
          assignment: {
            type: "role",
            role: "child",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.assignment).toEqual({
        type: "role",
        role: "child",
      });
    });

    it("should create task with unassigned", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Water plants",
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.assignment).toEqual({
        type: "unassigned",
      });
    });

    it("should create minimal task (name and assignment only)", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Quick task",
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("Quick task");
      expect(response.body.description).toBeUndefined();
      expect(response.body.dueDate).toBeUndefined();
    });
  });

  describe("Validation Errors", () => {
    it("should reject task with missing name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject task with empty name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject task with name exceeding 200 characters", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "a".repeat(201),
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject task with description exceeding 2000 characters", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task",
          description: "a".repeat(2001),
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject task with invalid dueDate format", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task",
          dueDate: "not-a-date",
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject task with missing assignment", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task",
        });

      expect(response.status).toBe(400);
    });

    it("should reject task with invalid assignment type", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task",
          assignment: {
            type: "invalid",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject member assignment with invalid ObjectId", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task",
          assignment: {
            type: "member",
            memberId: "invalid-id",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject role assignment with invalid role", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Task",
          assignment: {
            type: "role",
            role: "invalid-role",
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .send({
          name: "Task",
          assignment: {
            type: "unassigned",
          },
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
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Task",
          assignment: {
            type: "unassigned",
          },
        });

      expect(response.status).toBe(403);
    });
  });
});
