import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/tasks/schedules", () => {
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
    it("should return empty array when no schedules exist", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return all schedules for a family", async () => {
      // Create multiple schedules
      const schedule1 = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Weekly Cleaning",
          assignment: { type: "role", role: "child" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      const schedule2 = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Bi-weekly Lawn",
          assignment: { type: "role", role: "parent" },
          schedule: {
            daysOfWeek: [6],
            weeklyInterval: 2,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(schedule1.status).toBe(201);
      expect(schedule2.status).toBe(201);

      // List all schedules
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);

      // Verify schedule structure
      interface Schedule {
        _id: string;
        familyId: string;
        name: string;
        assignment: string;
        schedule: {
          daysOfWeek: string[];
          weeklyInterval: number;
          startDate: string;
        };
        createdBy: string;
        createdAt: string;
        updatedAt: string;
      }
      response.body.forEach((schedule: Schedule) => {
        expect(schedule).toHaveProperty("_id");
        expect(schedule).toHaveProperty("familyId", familyId);
        expect(schedule).toHaveProperty("name");
        expect(schedule).toHaveProperty("assignment");
        expect(schedule).toHaveProperty("schedule");
        expect(schedule.schedule).toHaveProperty("daysOfWeek");
        expect(schedule.schedule).toHaveProperty("weeklyInterval");
        expect(schedule.schedule).toHaveProperty("startDate");
        expect(schedule).toHaveProperty("createdBy");
        expect(schedule).toHaveProperty("createdAt");
        expect(schedule).toHaveProperty("updatedAt");
      });

      // Verify both schedules are present
      const names = response.body.map((s: Schedule) => s.name);
      expect(names).toContain("Weekly Cleaning");
      expect(names).toContain("Bi-weekly Lawn");
    });

    it("should include lastGeneratedDate when present", async () => {
      // This would be set by the task generation cron job
      // For now, we just verify the field structure
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Test Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [1],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      expect(response.status).toBe(201);

      const listResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toHaveLength(1);
      // A task is generated immediately, so lastGeneratedDate should be populated
      expect(listResponse.body[0].lastGeneratedDate).toEqual(
        expect.any(String),
      );
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/tasks/schedules`,
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
        .get(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
