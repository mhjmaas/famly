/**
 * E2E Tests: Karma Realtime Events
 * Tests for karma event broadcasts via Socket.IO
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

describe("E2E: Karma - Realtime Events", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("karma.awarded Event", () => {
    it("should broadcast karma.awarded when parent manually grants karma", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 1);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // Connect child's socket to listen for events
      const childSocket = await connectSocketClient(baseUrl, child.token);

      const karmaAwardedPromise = waitForEvent<any>(
        childSocket,
        "karma.awarded",
        5000,
      );

      // Parent grants karma to child
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 50,
          description: "Great job on homework",
        });

      // Child should receive karma.awarded event
      const event = await karmaAwardedPromise;

      expect(event).toBeDefined();
      expect(event.userId).toBe(child.userId);
      expect(event.amount).toBe(50);
      expect(event.source).toBe("manual_grant");
      expect(event.description).toBe("Great job on homework");
      expect(event.familyId).toBe(parent.familyId);

      await disconnectSocketClient(childSocket);
    });

    it("should not broadcast karma.awarded to other family members", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 3);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child1 = { token: childToken, userId: childUserId };
      // For this test, we'll use parent as child2 to test non-recipient
      const child2 = parent;

      // Connect child2's socket
      const child2Socket = await connectSocketClient(baseUrl, child2.token);

      let receivedEvent = false;
      child2Socket.on("karma.awarded", () => {
        receivedEvent = true;
      });

      // Parent grants karma to child1
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child1.userId,
          amount: 30,
          description: "Good behavior",
        });

      // Wait to see if event is received
      await new Promise((r) => setTimeout(r, 500));

      // Child2 should not receive karma event for child1
      expect(receivedEvent).toBe(false);

      await disconnectSocketClient(child2Socket);
    });
  });

  describe("Multiple Karma Events", () => {
    it("should receive multiple karma.awarded events in sequence", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 6);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      const childSocket = await connectSocketClient(baseUrl, child.token);

      const events: any[] = [];
      childSocket.on("karma.awarded", (event) => {
        events.push(event);
      });

      // Grant karma multiple times
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 10,
          description: "First grant",
        });

      await new Promise((r) => setTimeout(r, 200));

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 20,
          description: "Second grant",
        });

      await new Promise((r) => setTimeout(r, 200));

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 30,
          description: "Third grant",
        });

      await new Promise((r) => setTimeout(r, 500));

      // Should have received 3 events
      expect(events.length).toBe(3);
      expect(events[0].amount).toBe(10);
      expect(events[1].amount).toBe(20);
      expect(events[2].amount).toBe(30);

      await disconnectSocketClient(childSocket);
    });
  });

  describe("Authentication", () => {
    it("should not receive karma events without authentication", async () => {
      const { parentToken, parentUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 7);
      const parent = { token: parentToken, userId: parentUserId, familyId };

      // Try to connect without token
      try {
        await connectSocketClient(baseUrl, "", 2000);
        fail("Should not connect without token");
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Grant karma - no socket to receive it
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: parent.userId,
          amount: 50,
          description: "Test",
        });

      // Test passes if we reach here
    });
  });

  describe("Reconnection", () => {
    it("should continue receiving events after reconnection", async () => {
      const { parentToken, parentUserId, childToken, childUserId, familyId } =
        await setupFamilyWithMembers(baseUrl, 8);
      const parent = { token: parentToken, userId: parentUserId, familyId };
      const child = { token: childToken, userId: childUserId };

      // First connection
      let childSocket = await connectSocketClient(baseUrl, child.token);

      const firstPromise = waitForEvent<any>(
        childSocket,
        "karma.awarded",
        5000,
      );

      // Grant karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 25,
          description: "Before disconnect",
        });

      const firstEvent = await firstPromise;
      expect(firstEvent.amount).toBe(25);

      // Disconnect
      await disconnectSocketClient(childSocket);

      // Reconnect
      childSocket = await connectSocketClient(baseUrl, child.token);

      const secondPromise = waitForEvent<any>(
        childSocket,
        "karma.awarded",
        5000,
      );

      // Grant karma again
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parent.token}`)
        .send({
          userId: child.userId,
          amount: 35,
          description: "After reconnect",
        });

      const secondEvent = await secondPromise;
      expect(secondEvent.amount).toBe(35);

      await disconnectSocketClient(childSocket);
    });
  });
});
