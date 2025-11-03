import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Activity Events - Task Integration", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Task Creation Events", () => {
    it("should create activity event when non-recurring task is created", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a non-recurring task
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Take out the trash",
          description: "Weekly chore",
          assignment: { type: "member", memberId: childUserId },
          metadata: { karma: 10 },
        })
        .expect(201);

      expect(taskResponse.body.name).toBe("Take out the trash");

      // Verify activity event was created
      const eventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(1);
      expect(eventsResponse.body[0]).toMatchObject({
        type: "TASK",
        title: "Take out the trash",
        description: "Weekly chore",
        userId: childUserId,
        metadata: { karma: 10 },
      });
      expect(eventsResponse.body[0]).toHaveProperty("id");
      expect(eventsResponse.body[0]).toHaveProperty("createdAt");
    });

    it("should create activity event when task is created without optional fields", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a task without description or karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Simple task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Verify activity event was created
      const eventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(1);
      expect(eventsResponse.body[0]).toMatchObject({
        type: "TASK",
        title: "Simple task",
        description: null,
        userId: childUserId,
        metadata: null,
      });
    });
  });

  describe("Task Completion Events", () => {
    it("should create activity event when task is completed", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a task
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Do homework",
          assignment: { type: "member", memberId: childUserId },
          metadata: { karma: 20 },
        })
        .expect(201);

      const taskId = taskResponse.body._id;

      // Complete the task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify activity events were created (creation + completion)
      const eventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(2);

      // Most recent event should be completion
      expect(eventsResponse.body[0]).toMatchObject({
        type: "TASK",
        title: "Do homework",
        description: "Completed Do homework",
        userId: childUserId,
        metadata: { karma: 20 },
      });

      // Older event should be creation
      expect(eventsResponse.body[1]).toMatchObject({
        type: "TASK",
        title: "Do homework",
        description: null,
        userId: childUserId,
        metadata: { karma: 20 },
      });
    });

    it("should create activity event with correct description format on completion", async () => {
      testCounter++;
      const { familyId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      // Create and complete a task
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Take out the trash",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskResponse.body._id}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Get events
      const eventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      // Verify completion event has correct description format
      const completionEvent = eventsResponse.body.find(
        (e: any) => e.description && e.description.startsWith("Completed"),
      );

      expect(completionEvent).toBeDefined();
      expect(completionEvent.description).toBe("Completed Take out the trash");
    });
  });

  describe("Multiple Events", () => {
    it("should track multiple task operations in chronological order", async () => {
      testCounter++;
      const { familyId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      // Create first task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Task 1",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create second task
      const task2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Task 2",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Complete second task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${task2Response.body._id}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify all events in correct order
      const eventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(3);

      // Most recent: Task 2 completion
      expect(eventsResponse.body[0].title).toBe("Task 2");
      expect(eventsResponse.body[0].description).toBe("Completed Task 2");

      // Middle: Task 2 creation
      expect(eventsResponse.body[1].title).toBe("Task 2");
      expect(eventsResponse.body[1].description).toBeNull();

      // Oldest: Task 1 creation
      expect(eventsResponse.body[2].title).toBe("Task 1");
      expect(eventsResponse.body[2].description).toBeNull();
    });

    it("should only show events for the authenticated user", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Parent creates a task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Parent task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Child creates a task
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Child task",
          assignment: { type: "unassigned" },
        })
        .expect(201);

      // Child should only see their own event
      const childEventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(childEventsResponse.body).toHaveLength(1);
      expect(childEventsResponse.body[0].title).toBe("Child task");
      expect(childEventsResponse.body[0].userId).toBe(childUserId);
    });
  });
});
