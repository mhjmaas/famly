import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: PATCH /v1/families/:familyId/tasks/schedules/:scheduleId", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let scheduleId: string;
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

    // Create a schedule
    const scheduleResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/tasks/schedules`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Original Schedule",
        description: "Original Description",
        assignment: { type: "role", role: "parent" },
        schedule: {
          daysOfWeek: [1, 3],
          weeklyInterval: 1,
          startDate: "2025-01-01T00:00:00Z",
        },
        timeOfDay: "09:00",
      });

    expect(scheduleResponse.status).toBe(201);
    scheduleId = scheduleResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should update schedule name", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Schedule Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Schedule Name");
      expect(response.body.description).toBe("Original Description"); // Unchanged
    });

    it("should update schedule description", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "Updated Description",
        });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe("Updated Description");
      expect(response.body.name).toBe("Original Schedule"); // Unchanged
    });

    it("should update schedule assignment", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
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

    it("should update schedule configuration", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          schedule: {
            daysOfWeek: [0, 6], // Weekend
            weeklyInterval: 2,
            startDate: "2025-02-01T00:00:00Z",
            endDate: "2025-12-31T23:59:59Z",
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.schedule.daysOfWeek).toEqual([0, 6]);
      expect(response.body.schedule.weeklyInterval).toBe(2);
      expect(response.body.schedule.startDate).toBe("2025-02-01T00:00:00.000Z");
      expect(response.body.schedule.endDate).toBe("2025-12-31T23:59:59.000Z");
    });

    it("should update timeOfDay", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          timeOfDay: "14:30",
        });

      expect(response.status).toBe(200);
      expect(response.body.timeOfDay).toBe("14:30");
    });

    it("should update multiple fields at once", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Completely Updated",
          description: "New description",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1, 2, 3, 4, 5],
            weeklyInterval: 1,
            startDate: "2025-03-01T00:00:00Z",
          },
          timeOfDay: "08:00",
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Completely Updated");
      expect(response.body.description).toBe("New description");
      expect(response.body.assignment).toEqual({ type: "unassigned" });
      expect(response.body.schedule.daysOfWeek).toEqual([1, 2, 3, 4, 5]);
      expect(response.body.timeOfDay).toBe("08:00");
    });

    it("should refresh updatedAt timestamp", async () => {
      // Get original schedule
      const originalResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      const originalUpdatedAt = originalResponse.body.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update schedule
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
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

    it("should handle member assignment update", async () => {
      const memberId = new ObjectId().toString();
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          assignment: { type: "member", memberId },
        });

      expect(response.status).toBe(200);
      expect(response.body.assignment.type).toBe("member");
      expect(response.body.assignment.memberId).toBeDefined();
    });
  });

  describe("Validation Errors", () => {
    it("should reject empty name", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "",
        });

      expect(response.status).toBe(400);
    });

    it("should reject name exceeding 200 characters", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "a".repeat(201),
        });

      expect(response.status).toBe(400);
    });

    it("should reject description exceeding 2000 characters", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          description: "a".repeat(2001),
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid timeOfDay format", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          timeOfDay: "25:00", // Invalid hour
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid assignment type", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          assignment: { type: "invalid" },
        });

      expect(response.status).toBe(400);
    });

    it("should reject empty daysOfWeek in schedule", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          schedule: {
            daysOfWeek: [],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid day of week", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          schedule: {
            daysOfWeek: [7], // Invalid
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });

    it("should reject invalid weeklyInterval", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 5, // Invalid (must be 1-4)
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent schedule", async () => {
      const fakeScheduleId = new ObjectId().toString();
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${fakeScheduleId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid schedule ID format", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/invalid-id`)
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
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
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
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(403);
    });
  });
});
