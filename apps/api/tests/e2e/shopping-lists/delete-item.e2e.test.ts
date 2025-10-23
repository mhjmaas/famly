import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { setupTestFamily } from "../helpers/auth-setup";

describe("E2E: DELETE /v1/families/:familyId/shopping-lists/:listId/items/:itemId", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let listId: string;
  let itemId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Delete Item User",
      familyName: "Test Family",
      prefix: "deleteitemuser"
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Create a test shopping list
    const listResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Shopping List",
      });

    listId = listResponse.body._id;

    // Add an item
    const itemResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Item to Delete",
      });

    itemId = itemResponse.body.items[0]._id;
  });

  describe("Success Cases", () => {
    it("should delete item from list", async () => {
      const response = await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it("should not be able to retrieve deleted item", async () => {
      // Delete the item
      await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      // Try to retrieve the list (item should be gone)
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(0);
    });

    it("should preserve other items when deleting one", async () => {
      // Add a second item
      const item2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Item 2",
        });

      const itemId2 = item2Response.body.items[1]._id;

      // Delete first item
      await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      // Get list and verify
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]._id).toBe(itemId2);
      expect(getResponse.body.items[0].name).toBe("Item 2");
    });

    it("should allow deleting multiple items", async () => {
      // Add two more items
      const item2Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Item 2" });

      const itemId2 = item2Response.body.items[1]._id;

      const item3Response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Item 3" });

      const itemId3 = item3Response.body.items[2]._id;

      // Delete first and third items
      await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId3}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      // Verify only item 2 remains
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.items).toHaveLength(1);
      expect(getResponse.body.items[0]._id).toBe(itemId2);
    });
  });

  describe("Not Found Cases", () => {
    it("should return 404 for non-existent item", async () => {
      const fakeItemId = "507f1f77bcf86cd799439999";
      const response = await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${fakeItemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 for invalid item id format", async () => {
      const response = await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/invalid-id`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 when deleting already deleted item", async () => {
      // Delete the item
      await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      // Try to delete again
      const response = await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("Authorization", () => {
    it("should reject request without authentication", async () => {
      const response = await request(baseUrl).delete(
        `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
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
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
