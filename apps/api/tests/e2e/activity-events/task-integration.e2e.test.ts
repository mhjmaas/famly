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
      const { familyId, parentUserId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a non-recurring task (parent creates it with karma)
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Take out the trash",
          description: "Weekly chore",
          assignment: { type: "member", memberId: childUserId },
          metadata: { karma: 10 },
        })
        .expect(201);

      expect(taskResponse.body.name).toBe("Take out the trash");

      // Verify activity event was created for the parent who created the task
      const eventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveLength(1);
      const event = eventsResponse.body[0];
      expect(event).toMatchObject({
        type: "TASK",
        title: "Take out the trash",
        description: "Created Take out the trash",
        userId: parentUserId,
        metadata: { karma: 10 },
      });
      expect(event.detail).toBe("CREATED");
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("createdAt");
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
        description: "Created Simple task",
        userId: childUserId,
        metadata: null,
      });
    });
  });

  describe("Task Completion Events", () => {
    it("should create activity event when task is completed", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a task (parent creates with karma)
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Do homework",
          assignment: { type: "member", memberId: childUserId },
          metadata: { karma: 20 },
        })
        .expect(201);

      const taskId = taskResponse.body._id;

      // Parent completes the task (for member-assigned tasks, only parent can complete them)
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify activity events were created (parent creation + child completion since task is member-assigned to child)
      const childEventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      // Child should see completion event (task was assigned to them)
      expect(childEventsResponse.body.length).toBeGreaterThan(0);
      const completionEvent = childEventsResponse.body.find((e: any) =>
        e.description?.startsWith("Completed"),
      );
      expect(completionEvent).toBeDefined();
      expect(completionEvent?.title).toBe("Do homework");
      expect(completionEvent?.detail).toBe("COMPLETED");
      expect(completionEvent?.metadata).toEqual({
        karma: 20,
        triggeredBy: expect.any(String),
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
      const completionEvent = eventsResponse.body.find((e: any) =>
        e.description?.startsWith("Completed"),
      );

      expect(completionEvent).toBeDefined();
      expect(completionEvent.description).toBe("Completed Take out the trash");
    });

    it("should record activity event in assigned member's timeline when parent completes their task", async () => {
      testCounter++;
      const { familyId, parentToken, parentUserId, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Homework for child",
          assignment: { type: "member", memberId: childUserId },
        })
        .expect(201);

      const taskId = taskResponse.body._id;

      // Parent completes task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Child should see the completion event in their activity log
      const childEventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      const childCompletionEvent = childEventsResponse.body.find((e: any) =>
        e.description?.includes("Completed Homework for child"),
      );
      expect(childCompletionEvent).toBeDefined();
      expect(childCompletionEvent.detail).toBe("COMPLETED");
      expect(childCompletionEvent.userId).toBe(childUserId);

      // Parent should NOT see a "Completed Homework for child" event
      const parentEventsResponse = await request(baseUrl)
        .get("/v1/activity-events")
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      const parentCompletionEvent = parentEventsResponse.body.find((e: any) =>
        e.description?.includes("Completed Homework for child"),
      );
      expect(parentCompletionEvent).toBeUndefined();

      // Double-check: verify parent doesn't have a COMPLETION event for this task
      const parentCompletionEventForTask = parentEventsResponse.body.filter(
        (e: any) =>
          e.description?.includes("Completed Homework for child") &&
          e.userId === parentUserId,
      );
      expect(parentCompletionEventForTask).toHaveLength(0);

      // But parent SHOULD see the creation event since they created the task
      const parentCreationEventForTask = parentEventsResponse.body.filter(
        (e: any) =>
          e.description?.includes("Created Homework for child") &&
          e.userId === parentUserId,
      );
      expect(parentCreationEventForTask.length).toBeGreaterThan(0);
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
      expect(eventsResponse.body[1].description).toBe("Created Task 2");

      // Oldest: Task 1 creation
      expect(eventsResponse.body[2].title).toBe("Task 1");
      expect(eventsResponse.body[2].description).toBe("Created Task 1");
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
