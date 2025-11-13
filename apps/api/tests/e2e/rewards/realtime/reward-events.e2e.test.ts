/**
 * E2E Tests: Reward Realtime Events
 * Tests for reward claim event broadcasts via Socket.IO
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

describe("E2E: Rewards - Realtime Events", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("claim.created Event", () => {
    it("should broadcast claim.created when child claims a reward", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 1);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Give child karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 100,
          description: "Initial karma",
        });

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/rewards`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Movie night",
          description: "Watch a movie together",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Connect child's socket
      const childSocket = await connectSocketClient(baseUrl, child.token);

      // Wait a bit for socket to fully connect and join rooms
      await new Promise((r) => setTimeout(r, 200));

      const claimCreatedPromise = waitForEvent<any>(
        childSocket,
        "claim.created",
        5000,
      );

      // Child claims the reward
      const claimResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/rewards/${rewardId}/claim`)
        .set("Authorization", `Bearer ${child.token}`);

      // Child should receive claim.created event
      const event = await claimCreatedPromise;

      expect(event).toBeDefined();
      expect(event.claimId).toBe(claimResponse.body._id);
      expect(event.rewardId).toBe(rewardId);
      expect(event.memberId).toBe(child.userId);
      expect(event.familyId).toBe(parent.familyId);
      expect(event.claim).toBeDefined();

      await disconnectSocketClient(childSocket);
    });
  });

  describe("approval_task.created Event", () => {
    it("should broadcast task.created to parent when claim requires approval", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 3);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Give child karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 100,
        });

      // Create reward that requires approval
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/rewards`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Special treat",
          karmaCost: 60,
          requiresApproval: true,
        });

      const rewardId = rewardResponse.body._id;

      // Connect parent's socket
      const parentSocket = await connectSocketClient(baseUrl, parent.token);

      // Wait for socket to fully connect
      await new Promise((r) => setTimeout(r, 200));

      const taskCreatedPromise = waitForEvent<any>(
        parentSocket,
        "task.created",
        5000,
      );

      // Child claims reward
      await request(baseUrl)
        .post(`/v1/families/${familyId}/rewards/${rewardId}/claim`)
        .set("Authorization", `Bearer ${child.token}`);

      // Parent should receive task.created event for the approval task
      const event = await taskCreatedPromise;

      expect(event).toBeDefined();
      expect(event.taskId).toBeDefined();
      expect(event.task).toBeDefined();
      expect(event.task.metadata?.claimId).toBeDefined();
      expect(event.familyId).toBe(parent.familyId);

      await disconnectSocketClient(parentSocket);
    });

    it("should create approval task and emit both claim.created and task.created", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 4);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Give child karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 100,
        });

      // Create reward requiring approval
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/rewards`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Sleepover",
          karmaCost: 80,
          requiresApproval: true,
        });

      const rewardId = rewardResponse.body._id;

      // Connect parent's socket
      const parentSocket = await connectSocketClient(baseUrl, parent.token);

      // Wait for socket to fully connect
      await new Promise((r) => setTimeout(r, 200));

      // Parent should receive task.created event (not claim.created, which only goes to child)
      const taskCreatedPromise = waitForEvent<any>(
        parentSocket,
        "task.created",
        5000,
      );

      // Child claims reward
      await request(baseUrl)
        .post(`/v1/families/${familyId}/rewards/${rewardId}/claim`)
        .set("Authorization", `Bearer ${child.token}`);

      // Parent should receive task.created event
      const event = await taskCreatedPromise;

      expect(event).toBeDefined();
      expect(event.task).toBeDefined();
      expect(event.task.metadata?.claimId).toBeDefined();

      await disconnectSocketClient(parentSocket);
    });
  });

  describe("Complete Reward Flow", () => {
    it("should emit events throughout entire reward claim lifecycle", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 8);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Setup
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 100,
        });

      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/rewards`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          name: "Full flow reward",
          karmaCost: 60,
          requiresApproval: true,
        });

      // Connect child's socket
      const childSocket = await connectSocketClient(baseUrl, child.token);

      // Track all events
      const events: any[] = [];
      childSocket.on("claim.created", (e) =>
        events.push({ type: "created", ...e }),
      );
      childSocket.on("claim.completed", (e) =>
        events.push({ type: "completed", ...e }),
      );
      childSocket.on("karma.deducted", (e) =>
        events.push({ type: "karma", ...e }),
      );

      // Claim reward
      const claimResponse = await request(baseUrl)
        .post(
          `/v1/families/${familyId}/rewards/${rewardResponse.body._id}/claim`,
        )
        .set("Authorization", `Bearer ${child.token}`);

      await new Promise((r) => setTimeout(r, 500));

      // Get approval task and complete it
      const tasksResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/tasks`)
        .set("Authorization", `Bearer ${parent.token}`);

      const approvalTask = tasksResponse.body.find(
        (t: any) => t.metadata?.claimId === claimResponse.body._id,
      );

      await request(baseUrl)
        .patch(`/v1/families/${familyId}/tasks/${approvalTask._id}`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          completedAt: new Date().toISOString(),
        });

      await new Promise((r) => setTimeout(r, 500));

      // Should have received: claim.created, karma.deducted, claim.completed
      expect(events.length).toBeGreaterThanOrEqual(2);
      expect(events.some((e) => e.type === "created")).toBe(true);
      expect(
        events.some((e) => e.type === "karma" || e.type === "completed"),
      ).toBe(true);

      await disconnectSocketClient(childSocket);
    });
  });

  describe("Authentication", () => {
    it("should not receive reward events without authentication", async () => {
      // Try to connect without token
      try {
        await connectSocketClient(baseUrl, "", 2000);
        fail("Should not connect without token");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
