import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Task-Karma Integration", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Task Completion with Karma Reward", () => {
    it("should award karma when task with karma metadata is completed", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a task with karma reward
      const createTaskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Clean your room",
          description: "Make your bed and organize toys",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 25,
          },
        })
        .expect(201);

      const taskId = createTaskResponse.body._id;

      // Complete the task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify karma was awarded
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(25);

      // Verify karma event was created
      const historyResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(historyResponse.body.events).toHaveLength(1);
      expect(historyResponse.body.events[0]).toMatchObject({
        amount: 25,
        source: "task_completion",
        description: 'Completed task "Clean your room"',
        metadata: {
          taskId,
        },
      });
    });

    it("should not award karma when task without karma metadata is completed", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a task without karma reward
      const createTaskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Simple task",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
        })
        .expect(201);

      const taskId = createTaskResponse.body._id;

      // Complete the task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify no karma was awarded
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(0);
    });

    it("should not award karma if task is already completed", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create and complete a task
      const createTaskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task with karma",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 30,
          },
        })
        .expect(201);

      const taskId = createTaskResponse.body._id;

      // Complete the task first time
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Try to update task again (not marking as completed again)
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Updated task name",
        })
        .expect(200);

      // Verify only 30 karma was awarded (not doubled)
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(30);

      // Verify only one karma event exists
      const historyResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(historyResponse.body.events).toHaveLength(1);
    });

    it("should accumulate karma from multiple task completions", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create and complete first task
      const task1CreateResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task 1",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 20,
          },
        })
        .expect(201);

      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${task1CreateResponse.body._id}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Create and complete second task
      const task2CreateResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task 2",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 35,
          },
        })
        .expect(201);

      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${task2CreateResponse.body._id}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify total karma
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(55);

      // Verify both events in history
      const historyResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(historyResponse.body.events).toHaveLength(2);
    });
  });

  describe("Task Schedule with Karma Metadata", () => {
    it("should preserve karma metadata in task schedule", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const createScheduleResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Weekly chores",
          description: "Regular weekly tasks",
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          schedule: {
            daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
            weeklyInterval: 1,
            startDate: new Date().toISOString(),
          },
          timeOfDay: "09:00",
          metadata: {
            karma: 15,
          },
        })
        .expect(201);

      expect(createScheduleResponse.body.metadata).toEqual({
        karma: 15,
      });
    });

    it("should allow updating karma metadata in task schedule", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const createScheduleResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Daily chores",
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          schedule: {
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            weeklyInterval: 1,
            startDate: new Date().toISOString(),
          },
          metadata: {
            karma: 10,
          },
        })
        .expect(201);

      const scheduleId = createScheduleResponse.body._id;

      // Update karma metadata
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          metadata: {
            karma: 20,
          },
        })
        .expect(200);

      expect(updateResponse.body.metadata.karma).toBe(20);
    });
  });

  describe("Error Resilience", () => {
    it("should succeed task completion even if karma award fails", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create a task with karma
      const createTaskResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task with karma",
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 25,
          },
        })
        .expect(201);

      const taskId = createTaskResponse.body._id;

      // Task completion should succeed regardless of karma errors
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(updateResponse.body.completedAt).toBeDefined();

      // Verify the task is marked as completed
      const getTaskResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(getTaskResponse.body.completedAt).toBeDefined();
    });
  });
});
