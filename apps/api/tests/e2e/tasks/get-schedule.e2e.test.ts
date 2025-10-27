import { ObjectId } from "mongodb";
import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/tasks/schedules/:scheduleId", () => {
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
        name: "Test Schedule",
        description: "Test Description",
        assignment: { type: "role", role: "child" },
        schedule: {
          daysOfWeek: [1, 3, 5],
          weeklyInterval: 2,
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
        timeOfDay: "09:00",
      });

    expect(scheduleResponse.status).toBe(201);
    scheduleId = scheduleResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should return schedule by ID", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body._id).toBe(scheduleId);
      expect(response.body.familyId).toBe(familyId);
      expect(response.body.name).toBe("Test Schedule");
      expect(response.body.description).toBe("Test Description");
      expect(response.body.assignment).toEqual({ type: "role", role: "child" });
      expect(response.body.schedule.daysOfWeek).toEqual([1, 3, 5]);
      expect(response.body.schedule.weeklyInterval).toBe(2);
      expect(response.body.schedule.startDate).toBe("2025-01-01T00:00:00.000Z");
      expect(response.body.schedule.endDate).toBe("2025-12-31T23:59:59.000Z");
      expect(response.body.timeOfDay).toBe("09:00");
      expect(response.body).toHaveProperty("createdBy");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent schedule", async () => {
      const fakeScheduleId = new ObjectId().toString();
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules/${fakeScheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid schedule ID format", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 403 when schedule belongs to different family", async () => {
      // Create another family
      const otherFamilyResponse = await request(baseUrl)
        .post("/v1/families")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Other Family" });

      const otherFamilyId = otherFamilyResponse.body.familyId;

      // Try to access schedule from first family using second family ID
      const response = await request(baseUrl)
        .get(`/v1/families/${otherFamilyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/tasks/schedules/${scheduleId}`,
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
        .get(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
