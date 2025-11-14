/**
 * E2E Tests: Task Completion Karma Credit
 * Tests that karma is awarded to the correct user based on task assignment
 */

import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Task Completion Karma Credit", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Parent Completes Child Task", () => {
    it("should award karma to child when parent completes their task", async () => {
      testCounter++;
      const { familyId, parentToken, parentUserId, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child with karma
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Child's homework",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 25,
          },
        })
        .expect(201);

      const taskId = createResponse.body._id;

      // Parent completes the task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify child received karma, not parent
      const childKarmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(childKarmaResponse.body.totalKarma).toBe(25);

      // Verify parent did NOT receive karma
      const parentKarmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${parentUserId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(parentKarmaResponse.body.totalKarma).toBe(0);
    });

    it("should create karma event for child when parent completes task", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Clean room",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 30,
          },
        })
        .expect(201);

      const taskId = createResponse.body._id;

      // Parent completes task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify karma event in child's history
      const historyResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(historyResponse.body.events).toHaveLength(1);
      expect(historyResponse.body.events[0]).toMatchObject({
        amount: 30,
        source: "task_completion",
        description: 'Completed task "Clean room"',
        metadata: {
          taskId,
        },
      });
    });

    it("should deduct karma from child when parent reopens their completed task", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Do dishes",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 20,
          },
        })
        .expect(201);

      const taskId = createResponse.body._id;

      // Child completes task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify child has karma
      let karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(20);

      // Parent reopens the task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: null,
        })
        .expect(200);

      // Verify karma was deducted from child
      karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(0);
    });
  });

  describe("Role and Unassigned Task Karma", () => {
    it("should award karma to actor for role-based task", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create role-based task
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Any child task",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 15,
          },
        })
        .expect(201);

      const taskId = createResponse.body._id;

      // Child completes task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify child received karma
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(15);
    });

    it("should award karma to actor for unassigned task", async () => {
      testCounter++;
      const { familyId, parentToken, parentUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create unassigned task
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Unassigned chore",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "unassigned",
          },
          metadata: {
            karma: 10,
          },
        })
        .expect(201);

      const taskId = createResponse.body._id;

      // Parent completes task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify parent received karma (since they completed an unassigned task)
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${parentUserId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(10);
    });
  });

  describe("Multiple Completions", () => {
    it("should accumulate karma correctly when parent completes multiple child tasks", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create first task
      const task1Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task 1",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 10,
          },
        })
        .expect(201);

      // Create second task
      const task2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task 2",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
          },
          metadata: {
            karma: 15,
          },
        })
        .expect(201);

      // Parent completes both tasks
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${task1Response.body._id}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${task2Response.body._id}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      // Verify child has accumulated karma
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(karmaResponse.body.totalKarma).toBe(25);
    });
  });
});
