import request from "supertest";
import { cleanDatabase } from "../../helpers/database";
import { getTestApp } from "../../helpers/test-app";
import {
  registerTestUser,
  setupTestFamily,
  addChildMember,
  loginTestUser,
} from "../../helpers/auth-setup";

describe("E2E: /v1/families/:familyId/diary - Family Diary Authorization", () => {
  let baseUrl: string;
  let parent1Token: string;
  let parent1UserId: string;
  let parent2Token: string;
  let childToken: string;
  let familyId: string;
  let otherFamilyId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;

    // Create parent 1 and their family
    const family1 = await setupTestFamily(baseUrl, testCounter, {
      userName: "Parent 1",
      familyName: "Family 1",
      userBirthdate: "1985-03-10",
    });

    parent1Token = family1.token;
    parent1UserId = family1.userId;
    familyId = family1.familyId;

    // Create parent 2 and add to family
    testCounter++;
    const parent2Email = `parent2user${testCounter}@test.com`;
    const parent2Password = "Password123!";
    
    const parent2Response = await request(baseUrl)
      .post(`/v1/families/${familyId}/members`)
      .set("Authorization", `Bearer ${parent1Token}`)
      .send({
        email: parent2Email,
        password: parent2Password,
        name: "Parent 2",
        birthdate: "1987-06-15",
        role: "Parent",
      });

    if (parent2Response.status !== 201) {
      throw new Error(`Failed to add parent2: ${parent2Response.status} ${parent2Response.body.message}`);
    }

    // Login as parent2 to get token
    const parent2LoginResponse = await loginTestUser(baseUrl, parent2Email, parent2Password);
    parent2Token = parent2LoginResponse.token;

    // Create child and add to family
    testCounter++;
    const childResponse = await addChildMember(baseUrl, familyId, parent1Token, testCounter, {
      name: "Child",
    });

    childToken = childResponse.childToken;

    // Create another family for isolation tests
    testCounter++;
    const otherFamily = await setupTestFamily(baseUrl, testCounter + 100, {
      familyName: "Other Family",
      userName: "Other Parent",
      userBirthdate: "1980-01-01",
    });

    otherFamilyId = otherFamily.familyId;
  });

  describe("Family Membership Authorization", () => {
    it("should reject non-member trying to create entry with 403", async () => {
      // Create non-member user
      testCounter++;
      const nonMember = await registerTestUser(
        baseUrl,
        testCounter,
        "nonmember",
        {
          name: "Non Member",
          birthdate: "1990-01-01",
        },
      );

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${nonMember.token}`)
        .send({
          date: "2025-10-23",
          entry: "Attempted entry",
        });

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it("should reject non-member trying to list entries with 403", async () => {
      // Create non-member user
      testCounter++;
      const nonMember = await registerTestUser(
        baseUrl,
        testCounter,
        "nonmember2",
        {
          name: "Non Member 2",
          birthdate: "1990-01-01",
        },
      );

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${nonMember.token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });

    it("should reject non-member trying to get entry with 403", async () => {
      // Parent 1 creates entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Family entry",
        });

      const entryId = createResponse.body._id;

      // Create non-member user
      testCounter++;
      const nonMember = await registerTestUser(
        baseUrl,
        testCounter,
        "nonmember3",
        {
          name: "Non Member 3",
          birthdate: "1990-01-01",
        },
      );

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${nonMember.token}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toBeDefined();
    });
  });

  describe("Family Role Access (All Family Members Have Equal Access)", () => {
    it("should allow parent to create family diary entry", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Parent created entry",
        });

      expect(response.status).toBe(201);
      expect(response.body.createdBy).toBe(parent1UserId);
    });

    it("should allow second parent to create family diary entry", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent2Token}`)
        .send({
          date: "2025-10-23",
          entry: "Second parent entry",
        });

      expect(response.status).toBe(201);
    });

    it("should allow child to create family diary entry", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          date: "2025-10-23",
          entry: "Child created entry",
        });

      expect(response.status).toBe(201);
    });

    it("should allow all family members to list family entries", async () => {
      // Parent 1 creates entry
      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Parent 1 entry",
        });

      // Parent 2 lists (should see Parent 1's entry)
      const parent2Response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent2Token}`);

      expect(parent2Response.status).toBe(200);
      expect(parent2Response.body).toHaveLength(1);
      expect(parent2Response.body[0].entry).toBe("Parent 1 entry");

      // Child lists (should see Parent 1's entry)
      const childResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(childResponse.status).toBe(200);
      expect(childResponse.body).toHaveLength(1);
      expect(childResponse.body[0].entry).toBe("Parent 1 entry");
    });

    it("should allow all family members to read family entries", async () => {
      // Parent 1 creates entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Shared family entry",
        });

      const entryId = createResponse.body._id;

      // Parent 2 reads it
      const parent2Response = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parent2Token}`);

      expect(parent2Response.status).toBe(200);
      expect(parent2Response.body._id).toBe(entryId);

      // Child reads it
      const childResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(childResponse.status).toBe(200);
      expect(childResponse.body._id).toBe(entryId);
    });

    it("should allow all family members to update family entries", async () => {
      // Parent 1 creates entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Original entry",
        });

      const entryId = createResponse.body._id;

      // Parent 2 updates it
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parent2Token}`)
        .send({
          entry: "Updated by Parent 2",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.entry).toBe("Updated by Parent 2");

      // Child updates it further
      const childUpdateResponse = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          entry: "Updated by Child",
        });

      expect(childUpdateResponse.status).toBe(200);
      expect(childUpdateResponse.body.entry).toBe("Updated by Child");
    });

    it("should allow all family members to delete family entries", async () => {
      // Parent 1 creates entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Entry to delete",
        });

      const entryId = createResponse.body._id;

      // Child deletes it
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify deletion
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${parent1Token}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe("Family Isolation", () => {
    it("should not allow access to another family's entries", async () => {
      // Family 1: Parent 1 creates entry
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Family 1 entry",
        });

      const entryId = createResponse.body._id;

      // Create user in other family (they're already the creator of otherFamily)
      testCounter++;
      const otherFamilySetup = await setupTestFamily(baseUrl, testCounter + 200, {
        userName: "Other Family Member",
        familyName: "Other Family 2",
        prefix: "otherfamilymember"
      });

      // Other family member tries to access Family 1's entry
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary/${entryId}`)
        .set("Authorization", `Bearer ${otherFamilySetup.token}`);

      expect(getResponse.status).toBe(403);
    });

    it("should keep family entries isolated in list endpoint", async () => {
      // Family 1: Parent 1 creates entry
      await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`)
        .send({
          date: "2025-10-23",
          entry: "Family 1 entry",
        });

      // Other family: Use other family's parent to create entry
      const otherParent = await registerTestUser(baseUrl, testCounter + 200, "otherparent2", {
        name: "Other Parent 2",
        birthdate: "1980-01-01",
      });

      // Add other parent to other family
      const addResponse = await request(baseUrl)
        .post(`/v1/families/${otherFamilyId}/members`)
        .set("Authorization", `Bearer ${otherParent.token}`)
        .send({
          email: `otherparentmember${testCounter + 200}@test.com`,
          password: "Password123!",
          name: "Other Parent Member",
          birthdate: "1982-01-01",
          role: "Parent",
        });

      const otherMemberToken = addResponse.body.token;

      await request(baseUrl)
        .post(`/v1/families/${otherFamilyId}/diary`)
        .set("Authorization", `Bearer ${otherMemberToken}`)
        .send({
          date: "2025-10-24",
          entry: "Other family entry",
        });

      // Parent 1 lists family 1 entries (should only see their own)
      const family1ListResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/diary`)
        .set("Authorization", `Bearer ${parent1Token}`);

      expect(family1ListResponse.status).toBe(200);
      expect(family1ListResponse.body).toHaveLength(1);
      expect(family1ListResponse.body[0].entry).toBe("Family 1 entry");
    });
  });

  describe("Authentication Requirements", () => {
    it("should reject POST without token with 401", async () => {
      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/diary`)
        .send({
          date: "2025-10-23",
          entry: "No auth",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject GET without token with 401", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/diary`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject GET entry without token with 401", async () => {
      const response = await request(baseUrl).get(
        `/v1/families/${familyId}/diary/someId`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject PATCH without token with 401", async () => {
      const response = await request(baseUrl)
        .patch(`/v1/families/${familyId}/diary/someId`)
        .send({
          entry: "No auth update",
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it("should reject DELETE without token with 401", async () => {
      const response = await request(baseUrl).delete(
        `/v1/families/${familyId}/diary/someId`,
      );

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });
});
