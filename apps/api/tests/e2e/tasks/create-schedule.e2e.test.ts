import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/families/:familyId/tasks/schedules", () => {
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
      userName: "Schedule User",
      familyName: "Test Family",
      prefix: "scheduleuser",
    });

    authToken = setup.token;
    familyId = setup.familyId;
  });

  describe("Success Cases", () => {
    it("should create weekly schedule with single day", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Weekly Trash Day",
          description: "Take out the trash",
          assignment: { type: "role", role: "child" },
          schedule: {
            daysOfWeek: [1], // Monday
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe("Weekly Trash Day");
      expect(response.body.description).toBe("Take out the trash");
      expect(response.body.schedule.daysOfWeek).toEqual([1]);
      expect(response.body.schedule.weeklyInterval).toBe(1);
      expect(response.body.assignment).toEqual({ type: "role", role: "child" });
      expect(response.body.familyId).toBe(familyId);
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should create schedule with multiple days", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Weekday Homework",
          assignment: { type: "role", role: "child" },
          schedule: {
            daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.schedule.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
    });

    it("should create bi-weekly schedule", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Bi-weekly Lawn Mowing",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [6], // Saturday
            weeklyInterval: 2,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.schedule.weeklyInterval).toBe(2);
    });

    it("should create monthly schedule (4-week interval)", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Monthly Deep Clean",
          assignment: { type: "role", role: "parent" },
          schedule: {
            daysOfWeek: [0], // Sunday
            weeklyInterval: 4,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.schedule.weeklyInterval).toBe(4);
    });

    it("should create schedule with start date", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Future Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [3], // Wednesday
            weeklyInterval: 1,
            startDate: "2025-02-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.schedule.startDate).toBe("2025-02-01T00:00:00.000Z");
    });

    it("should create schedule with end date", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Limited Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [5], // Friday
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
            endDate: "2025-12-31T23:59:59Z",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.schedule.endDate).toBe("2025-12-31T23:59:59.000Z");
    });

    it("should create schedule with member assignment", async () => {
      const memberId = new ObjectId().toString();
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Assigned Schedule",
          assignment: { type: "member", memberId },
          schedule: {
            daysOfWeek: [2],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.assignment.type).toBe("member");
      expect(response.body.assignment.memberId).toBeDefined();
    });

    it("should immediately generate a task when schedule is already active", async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      const scheduleResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Daily Dishes",
          description: "Keep the kitchen clean",
          assignment: { type: "role", role: "child" },
          schedule: {
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            weeklyInterval: 1,
            startDate: yesterday.toISOString(),
          },
          timeOfDay: "08:30",
          metadata: {
            karma: 25,
          },
        });

      expect(scheduleResponse.status).toBe(201);

      const tasksResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(tasksResponse.status).toBe(200);
      expect(Array.isArray(tasksResponse.body)).toBe(true);

      const generatedTasks = tasksResponse.body.filter(
        (task: any) => task.scheduleId === scheduleResponse.body._id,
      );

      expect(generatedTasks.length).toBe(1);
      expect(generatedTasks[0].dueDate).toContain("08:30:00.000Z");
      expect(generatedTasks[0].description).toBe("Keep the kitchen clean");
      expect(generatedTasks[0].assignment).toEqual({
        type: "role",
        role: "child",
      });
      expect(generatedTasks[0].metadata).toEqual({ karma: 25 });
    });
  });

  describe("Validation Errors", () => {
    it("should reject missing name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject empty name", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject name exceeding 200 characters", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "a".repeat(201),
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject empty daysOfWeek array", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid day of week (negative)", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [-1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid day of week (> 6)", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [7],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject weeklyInterval < 1", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 0,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject weeklyInterval > 4", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 5,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject missing assignment", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Invalid Schedule",
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .send({
          name: "Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
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
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(403);
    });
  });
});
