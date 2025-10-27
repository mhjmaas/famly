import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/karma/balance/:userId", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should return zero karma for member with no history", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        userId: childUserId,
        totalKarma: 0,
      });
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should return karma balance after manual grant", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Grant karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 50,
          description: "Good behavior",
        })
        .expect(201);

      // Get balance
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.totalKarma).toBe(50);
    });

    it("should allow parent to view child karma", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.userId).toBe(childUserId);
      expect(response.body.totalKarma).toBe(0);
    });

    it("should allow child to view parent karma", async () => {
      testCounter++;
      const { familyId, parentUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${parentUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.userId).toBe(parentUserId);
      expect(response.body.totalKarma).toBe(0);
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid family ID", async () => {
      testCounter++;
      const { childUserId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/invalid-id/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(400);
    });

    it("should reject invalid user ID", async () => {
      testCounter++;
      const { familyId, childToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/invalid-id`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(400);
    });
  });

  describe("Authentication", () => {
    it("should reject request without authentication", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .expect(401);
    });

    it("should reject request with invalid token", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("Authorization", () => {
    it("should reject non-family member", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      testCounter++;
      const { parentToken: outsiderToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .expect(403);
    });
  });
});
