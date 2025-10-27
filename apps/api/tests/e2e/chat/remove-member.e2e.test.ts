import request from "supertest";
import { setupTestUsers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: DELETE /v1/chats/:chatId/members/:userId - Remove Member", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testCounter++;
  });

  describe("Success Cases", () => {
    it("should allow user to remove themselves from group with 204", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const member3 = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId, member3.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;
      expect(createResponse.body.memberIds).toHaveLength(3);

      // Member 2 removes themselves
      const removeResponse = await request(baseUrl)
        .delete(`/v1/chats/${chatId}/members/${member2.userId}`)
        .set("Authorization", `Bearer ${member2.token}`);

      expect(removeResponse.status).toBe(204);

      // Verify response has no content
      expect(removeResponse.text).toBe("");
    });

    it("should allow admin to remove another member with 204", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const member3 = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId, member3.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Admin removes member 2
      const removeResponse = await request(baseUrl)
        .delete(`/v1/chats/${chatId}/members/${member2.userId}`)
        .set("Authorization", `Bearer ${creator.token}`);

      expect(removeResponse.status).toBe(204);
    });
  });

  describe("Validation Errors", () => {
    it("should reject removing member from DM with 400", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const user1 = users[0];
      const user2 = users[1];

      // Create DM
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${user1.token}`)
        .send({
          type: "dm",
          memberIds: [user2.userId],
        });

      const chatId = createResponse.body._id;

      // Try to remove member
      const response = await request(baseUrl)
        .delete(`/v1/chats/${chatId}/members/${user2.userId}`)
        .set("Authorization", `Bearer ${user1.token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should return 404 if member not found", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member = users[1];
      const nonMember = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try to remove non-member
      const response = await request(baseUrl)
        .delete(`/v1/chats/${chatId}/members/${nonMember.userId}`)
        .set("Authorization", `Bearer ${creator.token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Authorization", () => {
    it("should reject non-admin removing other members with 403", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member2 = users[1];
      const member3 = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member2.userId, member3.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Non-admin tries to remove member
      const response = await request(baseUrl)
        .delete(`/v1/chats/${chatId}/members/${member3.userId}`)
        .set("Authorization", `Bearer ${member2.token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it("should reject non-member removing members with 403", async () => {
      const users = await setupTestUsers(baseUrl, 3, "groupuser");
      const creator = users[0];
      const member = users[1];
      const nonMember = users[2];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Non-member tries to remove
      const response = await request(baseUrl)
        .delete(`/v1/chats/${chatId}/members/${member.userId}`)
        .set("Authorization", `Bearer ${nonMember.token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it("should require authentication with 401", async () => {
      const users = await setupTestUsers(baseUrl, 2, "groupuser");
      const creator = users[0];
      const member = users[1];

      // Create group
      const createResponse = await request(baseUrl)
        .post("/v1/chats")
        .set("Authorization", `Bearer ${creator.token}`)
        .send({
          type: "group",
          memberIds: [member.userId],
          title: "Test Group",
        });

      const chatId = createResponse.body._id;

      // Try without auth
      const response = await request(baseUrl).delete(
        `/v1/chats/${chatId}/members/${member.userId}`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });
});
