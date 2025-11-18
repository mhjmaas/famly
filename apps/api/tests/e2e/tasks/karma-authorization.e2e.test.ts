import request from "supertest";
import {
  addChildMember,
  setupFamilyWithMembers,
  setupTestFamily,
} from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Task Karma Authorization", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter++;
  });

  describe("POST /v1/families/:familyId/tasks - Karma Authorization", () => {
    it("should allow parent to create task with karma reward", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Task Test Family",
      });

      const response = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Clean room",
          description: "Tidy up bedroom",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 50,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.metadata?.karma).toBe(50);
    });

    it("should prevent child from creating task with karma reward", async () => {
      const { familyId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
        {
          familyName: "Karma Authorization Test",
          parentName: "Parent User",
          childName: "Child User",
        },
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Clean room",
          description: "Tidy up bedroom",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 50,
          },
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain(
        "Only parents can set karma on tasks",
      );
    });

    it("should allow child to create task without karma", async () => {
      const { familyId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
        {
          familyName: "Child Task Test",
          parentName: "Parent",
          childName: "Child",
        },
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Clean room",
          description: "Tidy up bedroom",
          assignment: {
            type: "role",
            role: "child",
          },
        });

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.metadata?.karma).toBeUndefined();
    });

    it("should allow parent to create recurring task with karma", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Recurring Task Test",
      });

      const response = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Weekly chores",
          assignment: {
            type: "role",
            role: "child",
          },
          schedule: {
            daysOfWeek: [1, 3, 5], // Mon, Wed, Fri (0-6)
            weeklyInterval: 1,
            startDate: new Date().toISOString(),
          },
          metadata: {
            karma: 25,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body._id).toBeDefined();
      expect(response.body.metadata?.karma).toBe(25);
    });

    it("should prevent child from creating recurring task with karma", async () => {
      const { familyId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
        {
          familyName: "Recurring Karma Test",
          parentName: "Parent",
          childName: "Child",
        },
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Weekly chores",
          assignment: {
            type: "role",
            role: "child",
          },
          schedule: {
            daysOfWeek: [1, 3, 5],
            weeklyInterval: 1,
            startDate: new Date().toISOString(),
          },
          metadata: {
            karma: 25,
          },
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain(
        "Only parents can set karma on tasks",
      );
    });

    it("should validate karma amount for parent", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Validation Test",
      });

      // Test invalid karma amount (too high)
      const response = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Clean room",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 5000, // Exceeds max of 1000
          },
        });

      expect(response.status).toBe(400);
    });

    it("should allow parent to create task with minimum karma (1)", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Min Karma Test",
      });

      const response = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Small task",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 1,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.metadata?.karma).toBe(1);
    });

    it("should allow parent to create task with maximum karma (1000)", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Max Karma Test",
      });

      const response = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Major task",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 1000,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.metadata?.karma).toBe(1000);
    });
  });

  describe("Authorization Edge Cases", () => {
    it("should not allow user from different family to set karma", async () => {
      const family1 = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent 1",
        familyName: "Family 1",
      });

      const family2 = await setupTestFamily(baseUrl, testCounter + 100, {
        userName: "Parent 2",
        familyName: "Family 2",
      });

      // Get a child token from family 2
      const childSetup = await addChildMember(
        baseUrl,
        family2.familyId,
        family2.token,
        testCounter + 5000,
        {
          name: "Child from Family 2",
          password: "TestPassword123!",
        },
      );

      // Try to create task in family 1 with child token from family 2
      const response = await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/tasks`)
        .set("Authorization", `Bearer ${childSetup.childToken}`)
        .send({
          name: "Malicious task",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 100,
          },
        });

      // Should fail - user not in family
      expect(response.status).toBe(403);
    });

    it("should allow multiple tasks with karma in same family", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Multiple Tasks Test",
      });

      // Create first task with karma
      const response1 = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Task 1",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: { karma: 50 },
        });

      expect(response1.status).toBe(201);

      // Create second task with karma
      const response2 = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Task 2",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: { karma: 75 },
        });

      expect(response2.status).toBe(201);
      expect(response2.body.metadata?.karma).toBe(75);
    });

    it("should prevent child from setting karma but allow creating task without it", async () => {
      const { familyId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
        {
          familyName: "Child Permissions Test",
          parentName: "Parent",
          childName: "Child",
        },
      );

      // First, child attempts to set karma (should fail)
      const failResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Attempted karma task",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 50,
          },
        });

      expect(failResponse.status).toBe(403);

      // Then, child creates task without karma (should succeed)
      const successResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Child created task",
          assignment: {
            type: "role",
            role: "child",
          },
        });

      expect(successResponse.status).toBe(201);
      expect(successResponse.body.metadata?.karma).toBeUndefined();
    });
  });

  describe("PATCH /v1/families/:familyId/tasks/:taskId - Update Task Karma Authorization", () => {
    it("should allow parent to update task and add karma reward", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Task Update Test",
      });

      // Create a task without karma first
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Task without karma",
          description: "Initial task",
          assignment: {
            type: "role",
            role: "child",
          },
        });

      expect(createResponse.status).toBe(201);
      const taskId = createResponse.body._id;

      // Parent updates to add karma
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${setup.familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          metadata: {
            karma: 50,
          },
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.metadata?.karma).toBe(50);
    });

    it("should prevent child from updating task to add karma reward", async () => {
      const { familyId, parentToken, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter, {
          familyName: "Child Update Karma Test",
          parentName: "Parent",
          childName: "Child",
        });

      // Parent creates a task without karma
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task without karma",
          assignment: {
            type: "role",
            role: "child",
          },
        });

      expect(createResponse.status).toBe(201);
      const taskId = createResponse.body._id;

      // Child attempts to add karma (should fail)
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          metadata: {
            karma: 50,
          },
        });

      expect(updateResponse.status).toBe(403);
      expect(updateResponse.body.error).toContain(
        "Only parents can set karma on tasks",
      );
    });

    it("should allow child to update task without modifying karma", async () => {
      const { familyId, parentToken, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter, {
          familyName: "Child Update Name Test",
          parentName: "Parent",
          childName: "Child",
        });

      // Parent creates a task
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Original name",
          assignment: {
            type: "role",
            role: "child",
          },
        });

      expect(createResponse.status).toBe(201);
      const taskId = createResponse.body._id;

      // Child updates task name (should succeed)
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Updated by child",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe("Updated by child");
      expect(updateResponse.body.metadata?.karma).toBeUndefined();
    });

    it("should prevent child from modifying existing task karma", async () => {
      const { familyId, parentToken, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter, {
          familyName: "Modify Karma Test",
          parentName: "Parent",
          childName: "Child",
        });

      // Parent creates task WITH karma
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Task with karma",
          assignment: {
            type: "role",
            role: "child",
          },
          metadata: {
            karma: 50,
          },
        });

      expect(createResponse.status).toBe(201);
      const taskId = createResponse.body._id;

      // Child attempts to change karma value (should fail)
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          metadata: {
            karma: 100, // Try to increase karma
          },
        });

      expect(updateResponse.status).toBe(403);
      expect(updateResponse.body.error).toContain(
        "Only parents can set karma on tasks",
      );
    });
  });

  describe("PATCH /v1/families/:familyId/tasks/schedules/:scheduleId - Update Schedule Karma Authorization", () => {
    it("should allow parent to update schedule and add karma reward", async () => {
      const setup = await setupTestFamily(baseUrl, testCounter, {
        userName: "Parent User",
        familyName: "Schedule Update Test",
      });

      // Create a schedule without karma first
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${setup.familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          name: "Weekly chores",
          assignment: {
            type: "role",
            role: "child",
          },
          schedule: {
            daysOfWeek: [1, 3, 5],
            weeklyInterval: 1,
            startDate: new Date().toISOString(),
          },
        });

      expect(createResponse.status).toBe(201);
      const scheduleId = createResponse.body._id;

      // Parent updates to add karma
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${setup.familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${setup.token}`)
        .send({
          metadata: {
            karma: 25,
          },
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.metadata?.karma).toBe(25);
    });

    it("should prevent child from updating schedule to add karma reward", async () => {
      const { familyId, parentToken, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter, {
          familyName: "Child Schedule Karma Test",
          parentName: "Parent",
          childName: "Child",
        });

      // Parent creates a schedule without karma
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Weekly chores",
          assignment: {
            type: "role",
            role: "child",
          },
          schedule: {
            daysOfWeek: [1, 3, 5],
            weeklyInterval: 1,
            startDate: new Date().toISOString(),
          },
        });

      expect(createResponse.status).toBe(201);
      const scheduleId = createResponse.body._id;

      // Child attempts to add karma (should fail)
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          metadata: {
            karma: 25,
          },
        });

      expect(updateResponse.status).toBe(403);
      expect(updateResponse.body.error).toContain(
        "Only parents can set karma on schedules",
      );
    });

    it("should allow child to update schedule without modifying karma", async () => {
      const { familyId, parentToken, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter, {
          familyName: "Child Schedule Update Test",
          parentName: "Parent",
          childName: "Child",
        });

      // Parent creates a schedule
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks/schedules`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Original schedule",
          assignment: {
            type: "role",
            role: "child",
          },
          schedule: {
            daysOfWeek: [1, 3, 5],
            weeklyInterval: 1,
            startDate: new Date().toISOString(),
          },
        });

      expect(createResponse.status).toBe(201);
      const scheduleId = createResponse.body._id;

      // Child updates schedule name (should succeed)
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/schedules/${scheduleId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Updated by child",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.name).toBe("Updated by child");
      expect(updateResponse.body.metadata?.karma).toBeUndefined();
    });
  });
});
