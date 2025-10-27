import request from "supertest";
import { setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: DELETE /v1/families/:familyId/shopping-lists/:listId", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let listId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Delete List User",
      familyName: "Test Family",
      prefix: "deletelistuser",
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Create a test shopping list
    const listResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "List To Delete",
      });

    listId = listResponse.body._id;
  });

  describe("Success Cases", () => {
    it("should delete shopping list", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it("should not be able to retrieve deleted list", async () => {
      // Delete the list
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Try to retrieve it
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("should not appear in list after deletion", async () => {
      // Delete the list
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Get all lists
      const listResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body).toHaveLength(0);
    });

    it("should allow deleting multiple lists independently", async () => {
      // Create another list
      const list2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "List 2",
        });

      const listId2 = list2Response.body._id;

      // Delete first list
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Second list should still exist
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId2}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body._id).toBe(listId2);
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent list", async () => {
      const fakeListId = "507f1f77bcf86cd799439999";
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${fakeListId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 for invalid list id format", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/invalid-id`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 when deleting already deleted list", async () => {
      // Delete the list
      await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      // Try to delete again
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).delete(
        `/v1/families/${familyId}/shopping-lists/${listId}`,
      );

      expect(response.status).toBe(401);
    });

    it("should reject request from non-family member", async () => {
      testCounter++;
      const otherEmail = `other${testCounter}@example.com`;
      const otherRegisterResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: otherEmail,
          password: "SecurePassword123!",
          name: "Other User",
          birthdate: "1985-05-20",
        });

      const otherToken =
        otherRegisterResponse.body.accessToken ||
        otherRegisterResponse.body.sessionToken;

      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
