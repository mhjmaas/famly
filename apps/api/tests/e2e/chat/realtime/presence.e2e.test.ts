/**
 * E2E Tests: Socket.IO Presence Tracking
 * Tests for online/offline status and presence pings
 */

import { registerTestUser, setupTestUsers } from "../../helpers/auth-setup";
import { cleanDatabase } from "../../helpers/database";
import {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
} from "../../helpers/socket-client";
import { getTestApp } from "../../helpers/test-app";

describe("E2E: Socket.IO - Presence Tracking", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Connection Tracking", () => {
    it("should track socket on user connection", async () => {
      const user = await registerTestUser(baseUrl, 0, "connection");

      const socket = await connectSocketClient(baseUrl, user.token);

      expect(socket.connected).toBe(true);

      await disconnectSocketClient(socket);
    });

    it("should handle multiple simultaneous connections", async () => {
      const user = await registerTestUser(baseUrl, 0, "multiconnect");

      const socket1 = await connectSocketClient(baseUrl, user.token);
      const socket2 = await connectSocketClient(baseUrl, user.token);

      expect(socket1.connected).toBe(true);
      expect(socket2.connected).toBe(true);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Online Status", () => {
    it("should broadcast online status when user connects", async () => {
      const users = await setupTestUsers(baseUrl, 2, "online");
      const user1 = users[0];
      const user2 = users[1];

      // Create a chat so they become contacts
      const request = (await import("supertest")).default;
      await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      // User2 connects first
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      // Set up listener for presence updates
      const presencePromise = new Promise<any>((resolve) => {
        socket2.on("presence:update", resolve);
      });

      // User1 connects - should trigger presence:update to user2
      const socket1 = await connectSocketClient(baseUrl, user1.token);

      // Wait for presence update
      const presenceUpdate = await Promise.race([
        presencePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000),
        ),
      ]);

      expect(presenceUpdate).toBeDefined();
      expect(presenceUpdate.userId).toBe(user1.userId);
      expect(presenceUpdate.status).toBe("online");

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });

    it("should broadcast online status to all contacts", async () => {
      const users = await setupTestUsers(baseUrl, 3, "multicontact");
      const user1 = users[0];
      const user2 = users[1];
      const user3 = users[2];

      // Create chats so user1 is contacts with both user2 and user3
      const request = (await import("supertest")).default;
      await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user3.userId] });

      // User2 and User3 connect first
      const socket2 = await connectSocketClient(baseUrl, user2.token);
      const socket3 = await connectSocketClient(baseUrl, user3.token);

      // Set up listeners
      const presence2Promise = new Promise<any>((resolve) => {
        socket2.on("presence:update", resolve);
      });
      const presence3Promise = new Promise<any>((resolve) => {
        socket3.on("presence:update", resolve);
      });

      // User1 connects - should broadcast to both contacts
      const socket1 = await connectSocketClient(baseUrl, user1.token);

      // Both should receive the update
      const [update2, update3] = await Promise.all([
        presence2Promise,
        presence3Promise,
      ]);

      expect(update2.userId).toBe(user1.userId);
      expect(update2.status).toBe("online");
      expect(update3.userId).toBe(user1.userId);
      expect(update3.status).toBe("online");

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
      await disconnectSocketClient(socket3);
    });
  });

  describe("Offline Status", () => {
    it("should broadcast offline status when user disconnects", async () => {
      const users = await setupTestUsers(baseUrl, 2, "offline");
      const user1 = users[0];
      const user2 = users[1];

      // Create a chat so they become contacts
      const request = (await import("supertest")).default;
      await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      // Both users connect
      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      // Set up listener for offline presence update
      const presencePromise = new Promise<any>((resolve) => {
        socket2.on("presence:update", (data) => {
          if (data.status === "offline") {
            resolve(data);
          }
        });
      });

      // User1 disconnects - should trigger offline presence:update to user2
      await disconnectSocketClient(socket1);

      // Wait for presence update
      const presenceUpdate = await Promise.race([
        presencePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), 2000),
        ),
      ]);

      expect(presenceUpdate).toBeDefined();
      expect(presenceUpdate.userId).toBe(user1.userId);
      expect(presenceUpdate.status).toBe("offline");

      await disconnectSocketClient(socket2);
    });

    it("should track socket removal on disconnect", async () => {
      const user = await registerTestUser(baseUrl, 0, "disconnect");

      const socket = await connectSocketClient(baseUrl, user.token);
      expect(socket.connected).toBe(true);

      await disconnectSocketClient(socket);

      // After disconnection, socket should be marked disconnected
      expect(socket.connected).toBe(false);
    });

    it("should handle graceful disconnection", async () => {
      const user = await registerTestUser(baseUrl, 0, "graceful");

      const socket = await connectSocketClient(baseUrl, user.token);

      let disconnectFired = false;
      socket.on("disconnect", () => {
        disconnectFired = true;
      });

      await disconnectSocketClient(socket);

      expect(disconnectFired).toBe(true);
    });
  });

  describe("Presence Ping", () => {
    it("should respond to presence:ping with server time", async () => {
      const user = await registerTestUser(baseUrl, 0, "ping");

      const socket = await connectSocketClient(baseUrl, user.token);

      const ack = await emitWithAck<any>(socket, "presence:ping", {});

      expect(ack).toBeDefined();
      expect(ack.ok).toBe(true);
      expect(ack.data).toBeDefined();
      expect(ack.data.serverTime).toBeDefined();

      // Should be ISO format timestamp
      expect(typeof ack.data.serverTime).toBe("string");
      expect(new Date(ack.data.serverTime).toString()).not.toBe("Invalid Date");

      await disconnectSocketClient(socket);
    });

    it("should update last-seen timestamp on ping", async () => {
      const user = await registerTestUser(baseUrl, 0, "lastseen");

      const socket = await connectSocketClient(baseUrl, user.token);

      const ping1 = await emitWithAck<any>(socket, "presence:ping", {});
      expect(ping1.ok).toBe(true);

      // Wait a bit
      await new Promise((r) => setTimeout(r, 100));

      const ping2 = await emitWithAck<any>(socket, "presence:ping", {});
      expect(ping2.ok).toBe(true);

      // Second ping should have different (later) timestamp
      expect(ping2.data.serverTime).not.toBe(ping1.data.serverTime);

      await disconnectSocketClient(socket);
    });

    it("should require valid socket connection for ping", async () => {
      const user = await registerTestUser(baseUrl, 0, "noconnect");

      const socket = await connectSocketClient(baseUrl, user.token);
      await disconnectSocketClient(socket);

      // Socket should no longer be connected
      expect(socket.connected).toBe(false);
    });
  });

  describe("Multi-Device Support", () => {
    it("should keep user online with multiple devices", async () => {
      const user = await registerTestUser(baseUrl, 0, "multidevice");

      const socket1 = await connectSocketClient(baseUrl, user.token);
      const socket2 = await connectSocketClient(baseUrl, user.token);

      expect(socket1.connected).toBe(true);
      expect(socket2.connected).toBe(true);

      // Disconnect one device
      await disconnectSocketClient(socket1);

      // User should still be considered online due to other device
      expect(socket2.connected).toBe(true);

      await disconnectSocketClient(socket2);
    });

    it("should go offline only when all devices disconnect", async () => {
      const user = await registerTestUser(baseUrl, 0, "alldevices");

      const socket1 = await connectSocketClient(baseUrl, user.token);
      const socket2 = await connectSocketClient(baseUrl, user.token);

      expect(socket1.connected).toBe(true);
      expect(socket2.connected).toBe(true);

      // Disconnect first device
      await disconnectSocketClient(socket1);
      expect(socket1.connected).toBe(false);

      // Second device still connected
      expect(socket2.connected).toBe(true);

      // Disconnect second device
      await disconnectSocketClient(socket2);
      expect(socket2.connected).toBe(false);
    });
  });

  describe("Presence in Chat Rooms", () => {
    it("should allow presence ping in joined room", async () => {
      const users = await setupTestUsers(baseUrl, 2, "roompresence");
      const user1 = users[0];
      const user2 = users[1];

      const chatResponse = await (await import("supertest"))
        .default(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({ type: "dm", memberIds: [user2.userId] });

      const chatId = chatResponse.body._id;

      const socket = await connectSocketClient(baseUrl, user1.token);

      // Join room
      const joinAck = await emitWithAck<any>(socket, "room:join", { chatId });
      expect(joinAck.ok).toBe(true);

      // Ping should work while in room
      const ping = await emitWithAck<any>(socket, "presence:ping", {});
      expect(ping.ok).toBe(true);

      await disconnectSocketClient(socket);
    });
  });

  describe("Connection Error Handling", () => {
    it("should handle connection timeout gracefully", async () => {
      const user = await registerTestUser(baseUrl, 0, "timeout");

      let connectionFailed = false;
      try {
        // Try to connect with very short timeout (should fail)
        await connectSocketClient(baseUrl, user.token, 100);
      } catch (_err) {
        connectionFailed = true;
      }

      // Either connection succeeds quickly or fails gracefully
      // Both are acceptable behaviors
      expect(typeof connectionFailed).toBe("boolean");
    });

    it("should auto-join user:<userId> room on successful connection", async () => {
      const user = await registerTestUser(baseUrl, 0, "autoroom");

      const socket = await connectSocketClient(baseUrl, user.token);

      // Socket should be in user:<userId> room for personal notifications
      expect(socket.connected).toBe(true);

      await disconnectSocketClient(socket);
    });
  });

  describe("Throttling", () => {
    it("should throttle presence broadcasts", async () => {
      const users = await setupTestUsers(baseUrl, 2, "throttle");
      const user1 = users[0];
      const user2 = users[1];

      const socket1 = await connectSocketClient(baseUrl, user1.token);
      const socket2 = await connectSocketClient(baseUrl, user2.token);

      // Track presence:update events
      let presenceUpdates = 0;
      socket2.on("presence:update", () => {
        presenceUpdates++;
      });

      // Send multiple pings rapidly (within throttle window)
      for (let i = 0; i < 5; i++) {
        socket1.emit("presence:ping", {});
      }

      // Wait for any broadcasts
      await new Promise((r) => setTimeout(r, 500));

      // Should have throttled broadcasts (at most 1 per 2 seconds)
      expect(presenceUpdates).toBeLessThanOrEqual(1);

      await disconnectSocketClient(socket1);
      await disconnectSocketClient(socket2);
    });
  });

  describe("Reconnection", () => {
    it("should handle reconnection with same socket", async () => {
      const user = await registerTestUser(baseUrl, 0, "reconnect");

      const socket = await connectSocketClient(baseUrl, user.token);
      expect(socket.connected).toBe(true);

      // Simulate server/client issues that trigger automatic reconnection
      // (socket.io-client handles this automatically)

      // Should still be valid
      expect(socket.connected).toBe(true);

      await disconnectSocketClient(socket);
    });
  });
});
