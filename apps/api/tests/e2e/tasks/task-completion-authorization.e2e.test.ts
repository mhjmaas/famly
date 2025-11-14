/**
 * E2E Tests: Task Completion Authorization
 * Tests for the new authorization rules where only assignees or parents can complete member-assigned tasks
 */

import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Task Completion Authorization", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Member-Assigned Task Completion", () => {
    it("should allow assignee to complete their own task", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Child's task",
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

      const taskId = createResponse.body._id;

      // Child completes their own task
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(updateResponse.body.completedAt).toBeDefined();
      expect(updateResponse.body.completedBy).toBe(childUserId);
    });

    it("should allow parent to complete child-assigned task", async () => {
      testCounter++;
      const { familyId, parentToken, parentUserId, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Child's task",
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

      const taskId = createResponse.body._id;

      // Parent completes child's task
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(updateResponse.body.completedAt).toBeDefined();
      // completedBy should be the child (assignee), not the parent
      expect(updateResponse.body.completedBy).toBe(childUserId);
      expect(updateResponse.body.completedBy).not.toBe(parentUserId);
    });

    it("should reject child completing another child's task", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Add a second child
      const child2Email = `child2-${testCounter}@example.com`;
      const child2Password = "ChildPassword123!";
      await request(baseUrl)
        .post(`/v1/families/${familyId}/members`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          email: child2Email,
          password: child2Password,
          name: "Child 2",
          birthdate: "2010-01-15",
          role: "Child",
        })
        .expect(201);

      // Login as child2
      const child2LoginResponse = await request(baseUrl)
        .post("/v1/auth/login")
        .send({
          email: child2Email,
          password: child2Password,
        })
        .expect(200);

      const child2Token = child2LoginResponse.body.accessToken;

      // Create task assigned to child1
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Child 1's task",
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

      // Child2 tries to complete child1's task - should fail
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${child2Token}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(403);
    });

    it("should store completedBy as assignee when parent completes task", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Child's chore",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: childUserId,
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

      // Verify stored completedBy is the child
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(getResponse.body.completedBy).toBe(childUserId);
    });
  });

  describe("Role and Unassigned Task Completion", () => {
    it("should allow any child to complete role-based child task", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create task assigned to child role
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
            karma: 5,
          },
        })
        .expect(201);

      const taskId = createResponse.body._id;

      // Child completes role-based task
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(updateResponse.body.completedAt).toBeDefined();
      // For role-based tasks, completedBy should be the actor
      expect(updateResponse.body.completedBy).toBe(childUserId);
    });

    it("should allow any family member to complete unassigned task", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Create unassigned task
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Unassigned task",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "unassigned",
          },
          metadata: {
            karma: 8,
          },
        })
        .expect(201);

      const taskId = createResponse.body._id;

      // Child completes unassigned task
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          completedAt: new Date().toISOString(),
        })
        .expect(200);

      expect(updateResponse.body.completedAt).toBeDefined();
      // For unassigned tasks, completedBy should be the actor
      expect(updateResponse.body.completedBy).toBe(childUserId);
    });
  });
});
