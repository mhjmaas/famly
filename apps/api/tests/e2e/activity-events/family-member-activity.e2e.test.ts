import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Activity Events - Family Member Activity Trails", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /families/{familyId}/members/{memberId}/activity-events", () => {
    it("should allow parent to view child's activity events", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Child creates a task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Child's task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Parent views child's activity events
      const eventsResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/members/${childUserId}/activity-events`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(1);
      expect(eventsResponse.body[0]).toMatchObject({
        type: "TASK",
        title: "Child's task",
        userId: childUserId,
      });
    });

    it("should allow child to view sibling's activity events", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a second child in the same family
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: `child2-${testCounter}@example.com`,
          password: "Test123!@#",
          name: "Second Child",
          birthdate: "2015-06-15",
          role: "Child",
        })
        .expect(201);

      const secondChildResponse2 = await request(baseUrl)
        .post("/v1/auth/sign-in/email")
        .send({
          email: `child2-${testCounter}@example.com`,
          password: "Test123!@#",
        })
        .expect(200);

      const secondChildToken = secondChildResponse2.body.token;

      // First child creates a task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "First child's task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Second child views first child's activity events
      const eventsResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/members/${childUserId}/activity-events`)
        .set("Authorization", `Bearer ${secondChildToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(1);
      expect(eventsResponse.body[0]).toMatchObject({
        title: "First child's task",
        userId: childUserId,
      });
    });

    it("should allow user to view their own activity events via family endpoint", async () => {
      testCounter++;
      const { familyId, parentToken, parentUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Parent creates a task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Parent's task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Parent views their own activity events via family endpoint
      const eventsResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/members/${parentUserId}/activity-events`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(1);
      expect(eventsResponse.body[0]).toMatchObject({
        title: "Parent's task",
        userId: parentUserId,
      });
    });

    it("should support date range filtering for family member events", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      // Child creates a task (today)
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Today's task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Parent views events with end date = today
      const eventsResponse = await request(baseUrl)
        .get(
          `/v1/families/${familyId}/members/${childUserId}/activity-events?endDate=${today}`,
        )
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(1);

      // Parent views events with start date = tomorrow (should be empty)
      const emptyEventsResponse = await request(baseUrl)
        .get(
          `/v1/families/${familyId}/members/${childUserId}/activity-events?startDate=${tomorrow}`,
        )
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(emptyEventsResponse.body).toHaveLength(0);
    });

    it("should return 401 if user is not authenticated", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/${familyId}/members/${childUserId}/activity-events`)
        .expect(401);
    });

    it("should return 403 if user is not a member of the family", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      // Create a different family with another user
      const anotherUserResponse = await request(baseUrl)
        .post("/v1/auth/sign-up/email")
        .send({
          email: `outsider-${testCounter}@example.com`,
          password: "Test123!@#",
          name: "Outsider User",
          birthdate: "1990-01-01",
        })
        .expect(200);

      const outsiderToken = anotherUserResponse.body.token;

      // Outsider tries to access family member's activity events
      await request(baseUrl)
        .get(`/v1/families/${familyId}/members/${childUserId}/activity-events`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .expect(403);
    });

    it("should return 404 if family member does not exist in the family", async () => {
      testCounter++;
      const { familyId, parentToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      // Create another family with a different user
      const anotherUserResponse = await request(baseUrl)
        .post("/v1/auth/sign-up/email")
        .send({
          email: `other-user-${testCounter}@example.com`,
          password: "Test123!@#",
          name: "Other User",
          birthdate: "1990-01-01",
        })
        .expect(200);

      const otherUserId = anotherUserResponse.body.user.id;

      // Parent tries to access activity events for a user who is not in their family
      await request(baseUrl)
        .get(`/v1/families/${familyId}/members/${otherUserId}/activity-events`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(404);
    });

    it("should return 400 if familyId is invalid", async () => {
      testCounter++;
      const { childUserId, parentToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/invalid-id/members/${childUserId}/activity-events`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(400);
    });

    it("should return 400 if memberId is invalid", async () => {
      testCounter++;
      const { familyId, parentToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/${familyId}/members/invalid-id/activity-events`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(400);
    });

    it("should return 400 if date parameters are invalid", async () => {
      testCounter++;
      const { familyId, childUserId, parentToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Invalid date format
      await request(baseUrl)
        .get(
          `/v1/families/${familyId}/members/${childUserId}/activity-events?startDate=2024-13-45`,
        )
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(400);
    });

    it("should return events in correct order (most recent first)", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create first task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "First task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create second task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Second task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Parent views child's activity events
      const eventsResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/members/${childUserId}/activity-events`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(2);
      // Most recent should be first
      expect(eventsResponse.body[0].title).toBe("Second task");
      expect(eventsResponse.body[1].title).toBe("First task");
    });
  });
});
