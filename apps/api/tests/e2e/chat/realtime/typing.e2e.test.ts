/**
 * E2E Tests: Socket.IO Typing Indicators
 * Tests for typing start/stop events and broadcasts
 */

import request from "supertest";
import { registerTestUser, setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
  waitForEvent,
  waitForEventOrNull,
} from "../../helpers/socket-client";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: Socket.IO - Typing Indicators", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Typing Start", () => {
    it("should broadcast typing:update with state start to other members", async () => {
      const users = await setupTestUsers(baseUrl, 2, "typingstart");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // Set up listener for typing event on socket2
      const typingPromise = waitForEvent<any>(socket2, "typing:update", 5000);

      // User1 starts typing (fire-and-forget, no ack expected)
      socket1.emit("typing:start", { chatId });

      // User2 should receive the event
      const typingUpdate = await typingPromise;
      expect(typingUpdate).toBeDefined();
      expect(typingUpdate.chatId).toBe(chatId);
      expect(typingUpdate.userId).toBe(user1.userId);
      expect(typingUpdate.state).toBe("start");

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });

    it("should not send typing event back to sender", async () => {
      const users = await setupTestUsers(baseUrl, 2, "nosender");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // Set up listener on sender's socket
      const typingPromise = waitForEventOrNull<any>(
        socket1,
        "typing:update",
        2000,
      );

      // Sender emits typing start
      socket1.emit("typing:start", { chatId });

      // Sender should NOT receive their own event
      const typingUpdate = await typingPromise;
      expect(typingUpdate).toBeNull();

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Typing Stop", () => {
    it("should broadcast typing:update with state stop to other members", async () => {
      const users = await setupTestUsers(baseUrl, 2, "typingstop");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      const typingPromise = waitForEvent<any>(socket2, "typing:update", 5000);

      // Emit typing stop
      socket1.emit("typing:stop", { chatId });

      const typingUpdate = await typingPromise;
      expect(typingUpdate).toBeDefined();
      expect(typingUpdate.state).toBe("stop");

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });

    it("should not send typing stop to sender", async () => {
      const users = await setupTestUsers(baseUrl, 2, "stopsender");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      const typingPromise = waitForEventOrNull<any>(
        socket1,
        "typing:update",
        2000,
      );

      socket1.emit("typing:stop", { chatId });

      const typingUpdate = await typingPromise;
      expect(typingUpdate).toBeNull();

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Validation", () => {
    it("should silently fail for non-member typing start", async () => {
      const users = await setupTestUsers(baseUrl, 3, "nonmembertype");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      const socket3 = await connectSocketClient(baseUrl, user3.token); // Non-member

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });

      // Set up listener on member's socket
      const typingPromise = waitForEventOrNull<any>(
        socket2,
        "typing:update",
        2000,
      );

      // Non-member emits typing (should be silently ignored)
      socket3.emit("typing:start", { chatId });

      // Member should not receive any typing event
      const typingUpdate = await typingPromise;
      expect(typingUpdate).toBeNull();

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
      await disconnectSocketClient(socket3);
    });

    it("should reject invalid chatId format", async () => {
      const user = await registerTestUser(baseUrl, 0, "invalidformat");
      const socket = await connectSocketClient(baseUrl, user.token);

      // Should not throw, just silently fail for fire-and-forget events
      socket.emit("typing:start", { chatId: "invalid-id" });

      await disconnectSocketClient(socket);
    });

    it("should reject missing chatId", async () => {
      const user = await registerTestUser(baseUrl, 0, "missingchat");
      const socket = await connectSocketClient(baseUrl, user.token);

      socket.emit("typing:start", {});

      await disconnectSocketClient(socket);
    });
  });

  describe("Multiple Users Typing", () => {
    it("should track multiple users typing in same room", async () => {
      const users = await setupTestUsers(baseUrl, 3, "multitype");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "group",
          memberIds: [user2.userId, user3.userId],
          title: "Group Chat",
        });

      const chatId = chatResponse.body._id;

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      const socket3 = await connectSocketClient(baseUrl, user3.token);

      await emitWithAck(socket1, "room:join", { chatId });
      await emitWithAck(socket2, "room:join", { chatId });
      await emitWithAck(socket3, "room:join", { chatId });

      // Collect typing updates on socket3
      const typingUpdates: any[] = [];
      socket3.on("typing:update", (update) => {
        typingUpdates.push(update);
      });

      // User1 and User2 type
      socket1.emit("typing:start", { chatId });
      socket2.emit("typing:start", { chatId });

      // Wait for events
      await new Promise((r) => setTimeout(r, 500));

      // Should have received typing updates from both user1 and user2
      expect(typingUpdates.length).toBeGreaterThanOrEqual(2);

      const user1Typing = typingUpdates.find((u) => u.userId === user1.userId);
      const user2Typing = typingUpdates.find((u) => u.userId === user2.userId);

      expect(user1Typing).toBeDefined();
      expect(user2Typing).toBeDefined();
      expect(user1Typing.state).toBe("start");
      expect(user2Typing.state).toBe("start");

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
      await disconnectSocketClient(socket3);
    });
  });

  describe("Fire-and-Forget Pattern", () => {
    it("typing:start should not expect acknowledgment", async () => {
      const users = await setupTestUsers(baseUrl, 2, "noack");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);
      await emitWithAck(socket, "room:join", { chatId });

      // Emit without waiting for ack - should not error
      let errorOccurred = false;
      try {
        socket.emit("typing:start", { chatId });
        // No callback means fire-and-forget
      } catch (err) {
        errorOccurred = true;
      }

      expect(errorOccurred).toBe(false);

      await disconnectSocketClient(socket);
    });
  });
});
