import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Shopping Lists Authorization", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let listId: string;
  let childEmail: string;
  let childToken: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const uniqueEmail = `authuser${testCounter}@example.com`;

    // Register parent user
    const registerResponse = await request(baseUrl)
      .post("/v1/auth/register")
      .send({
        email: uniqueEmail,
        password: "SecurePassword123!",
        name: "Auth User",
        birthdate: "1980-01-15",
      });

    authToken =
      registerResponse.body.accessToken || registerResponse.body.sessionToken;

    // Create family
    const familyResponse = await request(baseUrl)
      .post("/v1/families")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test Family",
      });

    familyId = familyResponse.body.familyId;

    // Create shopping list
    const listResponse = await request(baseUrl)
      .post(`/v1/families/${familyId}/shopping-lists`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        name: "Test List",
      });

    listId = listResponse.body._id;

    // Add child to family (this also registers the child user)
    childEmail = `child${testCounter}@example.com`;
    await request(baseUrl)
      .post(`/v1/families/${familyId}/members`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        email: childEmail,
        password: "ChildPassword123!",
        name: "Child User",
        birthdate: "2010-01-15",
        role: "Child",
      });

    // Login as child to get a token (since add-member doesn't return one)
    const childLoginResponse = await request(baseUrl)
      .post("/v1/auth/login")
      .send({
        email: childEmail,
        password: "ChildPassword123!",
      });

    childToken =
      childLoginResponse.body.accessToken ||
      childLoginResponse.body.sessionToken;
  });

  describe("Parent Authorization", () => {
    it("parent should be able to create shopping lists", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "New List",
        });

      expect(response.status).toBe(201);
    });

    it("parent should be able to list shopping lists", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it("parent should be able to get shopping list", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it("parent should be able to update shopping list", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated List",
        });

      expect(response.status).toBe(200);
    });

    it("parent should be able to delete shopping list", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it("parent should be able to add items", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Item",
        });

      expect(response.status).toBe(201);
    });

    it("parent should be able to update items", async () => {
      const itemResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Item",
        });

      const itemId = itemResponse.body.items[0]._id;

      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(200);
    });

    it("parent should be able to delete items", async () => {
      const itemResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Item",
        });

      const itemId = itemResponse.body.items[0]._id;

      const response = await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });
  });

  describe("Child Authorization", () => {
    it("child should be able to create shopping lists", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "New List",
        });

      expect(response.status).toBe(201);
    });

    it("child should be able to list shopping lists", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(response.status).toBe(200);
    });

    it("child should be able to get shopping list", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(response.status).toBe(200);
    });

    it("child should be able to update shopping list", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Updated List",
        });

      expect(response.status).toBe(200);
    });

    it("child should be able to delete shopping list", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(response.status).toBe(204);
    });

    it("child should be able to add items", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Item",
        });

      expect(response.status).toBe(201);
    });

    it("child should be able to update items", async () => {
      const itemResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Item",
        });

      expect(itemResponse.status).toBe(201);
      expect(itemResponse.body.items).toBeDefined();
      expect(itemResponse.body.items.length).toBeGreaterThan(0);
      const itemId = itemResponse.body.items[0]._id;

      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(200);
    });

    it("child should be able to delete items", async () => {
      const itemResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Item",
        });

      expect(itemResponse.status).toBe(201);
      expect(itemResponse.body.items).toBeDefined();
      expect(itemResponse.body.items.length).toBeGreaterThan(0);
      const itemId = itemResponse.body.items[0]._id;

      const response = await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${childToken}`);

      expect(response.status).toBe(204);
    });
  });

  describe("Non-family Member Authorization", () => {
    let outsiderToken: string;

    beforeEach(async () => {
      testCounter++;
      const outsiderEmail = `outsider${testCounter}@example.com`;

      const registerResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: outsiderEmail,
          password: "SecurePassword123!",
          name: "Outsider User",
          birthdate: "1985-05-20",
        });

      outsiderToken =
        registerResponse.body.accessToken || registerResponse.body.sessionToken;
    });

    it("non-family member cannot create shopping lists", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({
          name: "New List",
        });

      expect(response.status).toBe(403);
    });

    it("non-family member cannot list shopping lists", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(response.status).toBe(403);
    });

    it("non-family member cannot get shopping list", async () => {
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(response.status).toBe(403);
    });

    it("non-family member cannot update shopping list", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({
          name: "Updated List",
        });

      expect(response.status).toBe(403);
    });

    it("non-family member cannot delete shopping list", async () => {
      const response = await request(baseUrl)
        .delete(`/v1/families/${familyId}/shopping-lists/${listId}`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(response.status).toBe(403);
    });

    it("non-family member cannot add items", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({
          name: "Item",
        });

      expect(response.status).toBe(403);
    });

    it("non-family member cannot update items", async () => {
      // First, add an item as a family member
      const itemResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Item",
        });

      const itemId = itemResponse.body.items[0]._id;

      const response = await request(baseUrl)
        .patch(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({
          checked: true,
        });

      expect(response.status).toBe(403);
    });

    it("non-family member cannot delete items", async () => {
      // First, add an item as a family member
      const itemResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/shopping-lists/${listId}/items`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Item",
        });

      const itemId = itemResponse.body.items[0]._id;

      const response = await request(baseUrl)
        .delete(
          `/v1/families/${familyId}/shopping-lists/${listId}/items/${itemId}`,
        )
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(response.status).toBe(403);
    });
  });
});
