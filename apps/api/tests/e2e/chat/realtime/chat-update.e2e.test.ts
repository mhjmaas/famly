/**
 * E2E Tests: Socket.IO Chat Updates
 * Tests for chat:update broadcasts triggered by REST API changes
 */

import request from "supertest";
import { setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import {
  connectSocketClient,
  disconnectSocketClient,
  waitForEvent,
} from "../../helpers/socket-client";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: Socket.IO - Chat Updates", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Member Addition", () => {
    it("should broadcast chat:update when member is added via REST", async () => {
      const users = await setupTestUsers(baseUrl, 3, "addmember");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Create chat with user1 and user2
      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId],
          title: "Test Group",
        });

      const chatId = chatResponse.body._id;

      // Connect user1 and user2
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      // Set up listeners for chat:update
      const updatePromise1 = waitForEvent<any>(socket1, "chat:update", 5000);
      const updatePromise2 = waitForEvent<any>(socket2, "chat:update", 5000);

      // Add user3 to chat via REST API
      const addResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ userIds: [user3.userId] });

      expect(addResponse.status).toBe(200);

      // Both existing members should receive chat:update
      const update1 = await updatePromise1;
      const update2 = await updatePromise2;

      expect(update1).toBeDefined();
      expect(update1.chat).toBeDefined();
      expect(update1.chat._id).toBe(chatId);
      expect(update1.chat.memberIds).toContain(user3.userId);

      expect(update2).toBeDefined();
      expect(update2.chat._id).toBe(chatId);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });

    it("should send chat:update to only current members", async () => {
      const users = await setupTestUsers(baseUrl, 3, "onlymembers");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId],
          title: "Group",
        });

      const chatId = chatResponse.body._id;

      // Connect user1, user2, and non-member user3
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      const socket3 = await connectSocketClient(baseUrl, user3.token);

      // User3 should not receive updates (not a member yet)
      const update3Promise = waitForEvent<any>(
        socket3,
        "chat:update",
        2000,
      ).catch(() => null);

      // Add user3 to chat
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ userIds: [user3.userId] });

      // User3 should not have received the update (wasn't member when event fired)
      const update3 = await update3Promise;
      expect(update3).toBeNull();

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
      await disconnectSocketClient(socket3);
    });
  });

  describe("Member Removal", () => {
    it("should broadcast chat:update when member is removed via REST", async () => {
      const users = await setupTestUsers(baseUrl, 3, "removemember");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Create group with all three
      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId, user3.userId],
          title: "Group",
        });

      const chatId = chatResponse.body._id;

      // Connect all members
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      const socket3 = await connectSocketClient(baseUrl, user3.token);

      const updatePromise1 = waitForEvent<any>(socket1, "chat:update", 5000);
      const updatePromise2 = waitForEvent<any>(socket2, "chat:update", 5000);
      const updatePromise3 = waitForEvent<any>(socket3, "chat:update", 5000);

      // Remove user3
      const removeResponse = await request(baseUrl)
        .delete(`/v1/chats/${chatId}/members/${user3.userId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(removeResponse.status).toBe(204);

      // All members should receive the update
      const update1 = await updatePromise1;
      const update2 = await updatePromise2;
      const update3 = await updatePromise3;

      expect(update1).toBeDefined();
      expect(update2).toBeDefined();
      expect(update3).toBeDefined();

      // User3 should not be in memberIds anymore
      expect(update1.chat.memberIds).not.toContain(user3.userId);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
      await disconnectSocketClient(socket3);
    });
  });

  describe("Chat Update Content", () => {
    it("should include full chat object in update", async () => {
      const users = await setupTestUsers(baseUrl, 3, "chatcontent");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId],
          title: "Test Group",
        });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);

      const updatePromise = waitForEvent<any>(socket, "chat:update", 5000);

      // Trigger an update by adding member
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ userIds: [user3.userId] });

      const update = await updatePromise;

      expect(update.chat).toBeDefined();
      expect(update.chat._id).toBe(chatId);
      expect(update.chat).toHaveProperty("type");
      expect(update.chat).toHaveProperty("memberIds");
      expect(update.chat).toHaveProperty("createdBy");
      expect(update.chat).toHaveProperty("createdAt");
      expect(update.chat).toHaveProperty("updatedAt");

      await disconnectSocketClient(socket);
    });
  });

  describe("User Context", () => {
    it("should send to user:<userId> rooms for member notifications", async () => {
      const users = await setupTestUsers(baseUrl, 3, "userrooms");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId],
          title: "Test Group",
        });

      const chatId = chatResponse.body._id;

      // Connect users
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      // Both should auto-join user:<userId> rooms on connect
      // So they should receive chat updates

      const updatePromise1 = waitForEvent<any>(socket1, "chat:update", 5000);
      const updatePromise2 = waitForEvent<any>(socket2, "chat:update", 5000);

      // Trigger update
      await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ userIds: [user3.userId] });

      const update1 = await updatePromise1;
      const update2 = await updatePromise2;

      expect(update1).toBeDefined();
      expect(update2).toBeDefined();

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Error Handling", () => {
    it("should handle broadcast even if some users are disconnected", async () => {
      const users = await setupTestUsers(baseUrl, 3, "errorbroad");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId, user3.userId],
          title: "Group",
        });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      // User3 not connected

      const updatePromise1 = waitForEvent<any>(socket1, "chat:update", 5000);
      const updatePromise2 = waitForEvent<any>(socket2, "chat:update", 5000);

      // This should succeed even though user3 is offline
      // Create a fourth user to add
      const users4 = await setupTestUsers(baseUrl, 1, "errorbroad4");
      const user4 = users4[0];

      const addResponse = await request(baseUrl)
        .post(`/v1/chats/${chatId}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ userIds: [user4.userId] });

      expect(addResponse.status).toBe(200);

      // Connected users should still receive updates
      const update1 = await updatePromise1;
      const update2 = await updatePromise2;

      expect(update1).toBeDefined();
      expect(update2).toBeDefined();

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Multiple Chats", () => {
    it("should broadcast to correct chat room only", async () => {
      const users = await setupTestUsers(baseUrl, 5, "multichat");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];
      const user4 = users[3];
      const user5 = users[4];

      // Create two group chats
      const chat1Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "group", memberIds: [user2.userId], title: "Group 1" });

      const chat2Response = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "group", memberIds: [user3.userId], title: "Group 2" });

      const chatId1 = chat1Response.body._id;
      const chatId2 = chat2Response.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);

      // Track all updates
      const updates: any[] = [];
      socket.on("chat:update", (update) => {
        updates.push(update);
      });

      // Update chat1 by adding user4
      await request(baseUrl)
        .post(`/v1/chats/${chatId1}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ userIds: [user4.userId] });

      await new Promise((r) => setTimeout(r, 200));

      // Update chat2 by adding user5
      await request(baseUrl)
        .post(`/v1/chats/${chatId2}/members`)
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ userIds: [user5.userId] });

      await new Promise((r) => setTimeout(r, 200));

      // Should have updates for both chats
      expect(updates.length).toBeGreaterThanOrEqual(2);

      const update1 = updates.find((u) => u.chat._id === chatId1);
      const update2 = updates.find((u) => u.chat._id === chatId2);

      expect(update1).toBeDefined();
      expect(update2).toBeDefined();

      await disconnectSocketClient(socket);
    });
  });
});
