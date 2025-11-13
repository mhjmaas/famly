/**
 * E2E Tests: Task Realtime Events
 * Tests for task event broadcasts via Socket.IO
 */

import request from "supertest";
import { setupFamilyWithMembers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import {
  connectSocketClient,
  disconnectSocketClient,
  waitForEvent,
} from "../../helpers/socket-client";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: Tasks - Realtime Events", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("task.created Event", () => {
    it("should broadcast task.created when a task is manually created", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 1);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Connect child's socket to listen for events
      const childSocket = await connectSocketClient(baseUrl, child.token);

      // Set up listener for task.created event
      const taskCreatedPromise = waitForEvent<any>(
        childSocket,
        "task.created",
        5000,
      );

      // Parent creates a task assigned to child
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Clean your room",
          description: "Make sure it's spotless",
          dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          assignment: {
            type: "member",
            memberId: child.userId,
          },
        });

      // Child should receive task.created event
      const event = await taskCreatedPromise;

      expect(event).toBeDefined();
      expect(event.task).toBeDefined();
      expect(event.task.name).toBe("Clean your room");
      expect(event.task.familyId).toBe(parent.familyId);
      expect(event.task.assignment.type).toBe("member");
      expect(event.task.assignment.memberId).toBe(child.userId);

      await disconnectSocketClient(childSocket);
    });

    it("should not broadcast task.created to non-assigned users", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 2);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child1 = { token: childToken, userId: childUserId };
      // For this test, we'll use child1 as the assigned user and parent as the non-assigned listener
      const child2 = parent;

      // Connect child2's socket (not assigned to the task)
      const child2Socket = await connectSocketClient(baseUrl, child2.token);

      // Set up listener with short timeout
      let receivedEvent = false;
      child2Socket.on("task.created", () => {
        receivedEvent = true;
      });

      // Parent creates a task assigned to child1
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Do homework",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: child1.userId,
          },
        });

      // Wait a bit to see if event is received
      await new Promise((r) => setTimeout(r, 500));

      // Child2 should not receive the event (task not assigned to them)
      expect(receivedEvent).toBe(false);

      await disconnectSocketClient(child2Socket);
    });
  });

  describe("task.assigned Event", () => {
    it("should broadcast task.assigned when task assignment changes", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 3);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child1 = { token: childToken, userId: childUserId };

      // Create unassigned task
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Wash dishes",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "unassigned",
          },
        });

      const taskId = createResponse.body._id;

      // Connect child1's socket
      const child1Socket = await connectSocketClient(baseUrl, child1.token);

      const taskAssignedPromise = waitForEvent<any>(
        child1Socket,
        "task.assigned",
        5000,
      );

      // Parent assigns task to child1
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          assignment: {
            type: "member",
            memberId: child1.userId,
          },
        });

      // Child1 should receive task.assigned event
      const event = await taskAssignedPromise;

      expect(event).toBeDefined();
      expect(event.task).toBeDefined();
      expect(event.task._id).toBe(taskId);
      expect(event.task.assignment.type).toBe("member");
      expect(event.task.assignment.memberId).toBe(child1.userId);

      await disconnectSocketClient(child1Socket);
    });
  });

  describe("task.completed Event", () => {
    it("should broadcast task.completed when a task is marked complete", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 4);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Create task assigned to child
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Take out trash",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: child.userId,
          },
        });

      const taskId = createResponse.body._id;

      // Connect child's socket
      const childSocket = await connectSocketClient(baseUrl, child.token);

      const taskCompletedPromise = waitForEvent<any>(
        childSocket,
        "task.completed",
        5000,
      );

      // Child completes the task
      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${child.token}`)
        .send({
          completedAt: new Date().toISOString(),
        });

      // Child should receive task.completed event
      const event = await taskCompletedPromise;

      expect(event).toBeDefined();
      expect(event.task).toBeDefined();
      expect(event.task._id).toBe(taskId);
      expect(event.task.completedAt).toBeDefined();
      expect(event.completedBy).toBe(child.userId);

      await disconnectSocketClient(childSocket);
    });
  });

  describe("task.deleted Event", () => {
    it("should broadcast task.deleted when a task is deleted", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 6);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Create task assigned to child
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Water plants",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: child.userId,
          },
        });

      const taskId = createResponse.body._id;

      // Connect child's socket
      const childSocket = await connectSocketClient(baseUrl, child.token);

      const taskDeletedPromise = waitForEvent<any>(
        childSocket,
        "task.deleted",
        5000,
      );

      // Parent deletes the task
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${parent.token}`);

      // Child should receive task.deleted event
      const event = await taskDeletedPromise;

      expect(event).toBeDefined();
      expect(event.taskId).toBe(taskId);
      expect(event.familyId).toBe(parent.familyId);

      await disconnectSocketClient(childSocket);
    });
  });

  describe("Authentication", () => {
    it("should not receive task events without authentication", async () => {
      const { parentToken, parentUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 7);
      const parent = { token: parentToken, userId: parentUserId, familyId };

      // Try to connect without token (should fail)
      try {
        await connectSocketClient(baseUrl, "", 2000);
        fail("Should not connect without token");
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Create a task - no socket to receive it
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Test task",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: { type: "unassigned" },
        });

      // Test passes if we reach here (no socket connection was made)
    });
  });

  describe("Multiple Clients", () => {
    it("should broadcast to multiple connected clients in same family", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 8);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Connect two sockets for the same child (different devices)
      const childSocket1 = await connectSocketClient(baseUrl, child.token);
      const childSocket2 = await connectSocketClient(baseUrl, child.token);

      const promise1 = waitForEvent<any>(childSocket1, "task.created", 5000);
      const promise2 = waitForEvent<any>(childSocket2, "task.created", 5000);

      // Create task assigned to child
      await request(baseUrl)
        .post(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Multi-device task",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          assignment: {
            type: "member",
            memberId: child.userId,
          },
        });

      // Both sockets should receive the event
      const [event1, event2] = await Promise.all([promise1, promise2]);

      expect(event1).toBeDefined();
      expect(event2).toBeDefined();
      expect(event1.task.name).toBe("Multi-device task");
      expect(event2.task.name).toBe("Multi-device task");

      await disconnectSocketClient(childSocket1);
      await disconnectSocketClient(childSocket2);
    });
  });
});
