import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { setupTestFamily } from "../helpers/auth-setup";

describe("E2E: DELETE /v1/families/:familyId/tasks/schedules/:scheduleId", () => {
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
      prefix: "scheduleuser"
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Create a schedule
    const scheduleResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/tasks/schedules`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Schedule to Delete",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: "2025-01-01T00:00:00Z",
        },
      });

    expect(scheduleResponse.status).toBe(201);
    scheduleId = scheduleResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should delete schedule and return 204", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
    });

    it("should actually remove schedule from database", async () => {
      // Delete the schedule
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Try to get the deleted schedule
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("should not affect other schedules in the family", async () => {
      // Create another schedule
      const schedule2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Schedule to Keep",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [2],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      const schedule2Id = schedule2Response.body._id;

      // Delete first schedule
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Verify second schedule still exists
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules/${schedule2Id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe("Schedule to Keep");
    });

    it("should remove schedule from list", async () => {
      // Create another schedule
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Another Schedule",
          assignment: { type: "unassigned" },
          schedule: {
            daysOfWeek: [3],
            weeklyInterval: 1,
            startDate: "2025-01-01T00:00:00Z",
          },
        });

      // Verify we have 2 schedules
      const listBefore = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(listBefore.body).toHaveLength(2);

      // Delete one schedule
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Verify we now have 1 schedule
      const listAfter = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(listAfter.body).toHaveLength(1);
      expect(listAfter.body[0].name).toBe("Another Schedule");
    });
  });

  describe("Error Cases", () => {
    it("should return 404 for non-existent schedule", async () => {
      const fakeScheduleId = new ObjectId().toString();
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/${fakeScheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 400 for invalid schedule ID format", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("should return 404 when trying to delete same schedule twice", async () => {
      // Delete once
      const firstDelete = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(firstDelete.status).toBe(204);

      // Try to delete again
      const secondDelete = await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(secondDelete.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).delete(
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
        .delete(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
