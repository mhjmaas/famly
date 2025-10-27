import request from "supertest";
import {
  registerTestUser,
  setupFamilyWithMembers,
} from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Karma Authorization", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Family Member Access", () => {
    it("should allow any family member to view any other member's karma balance", async () => {
      testCounter++;
      const { familyId, parentUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${parentUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.userId).toBe(parentUserId);
    });

    it("should allow any family member to view any other member's karma history", async () => {
      testCounter++;
      const { familyId, parentUserId, parentToken, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Grant some karma first
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: parentUserId,
          amount: 10,
        })
        .expect(201);

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${parentUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(1);
    });
  });

  describe("Non-Member Access Restriction", () => {
    it("should block non-member from viewing karma balance", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      testCounter++;
      const outsider = await registerTestUser(baseUrl, testCounter, "outsider");

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${outsider.token}`)
        .expect(403);
    });

    it("should block non-member from viewing karma history", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      testCounter++;
      const outsider = await registerTestUser(baseUrl, testCounter, "outsider");

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${outsider.token}`)
        .expect(403);
    });

    it("should block non-member from granting karma", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      testCounter++;
      const outsider = await registerTestUser(baseUrl, testCounter, "outsider");

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${outsider.token}`)
        .send({
          userId: childUserId,
          amount: 50,
        })
        .expect(403);
    });
  });

  describe("Parent Role Restrictions", () => {
    it("should allow only parents to grant karma", async () => {
      testCounter++;
      const { familyId, parentToken, childToken, childUserId, parentUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Parent can grant
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 50,
        })
        .expect(201);

      // Child cannot grant
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          userId: parentUserId,
          amount: 50,
        })
        .expect(403);
    });
  });

  describe("Cross-Family Isolation", () => {
    it("should prevent accessing karma from different family", async () => {
      testCounter++;
      const family1 = await setupFamilyWithMembers(baseUrl, testCounter);

      testCounter++;
      const family2 = await setupFamilyWithMembers(baseUrl, testCounter);

      // Try to access family1 child's karma using family2 parent's token
      await request(baseUrl)
        .get(
          `/v1/families/${family1.familyId}/karma/balance/${family1.childUserId}`,
        )
        .set("Authorization", `Bearer ${family2.parentToken}`)
        .expect(403);
    });

    it("should prevent granting karma to member of different family", async () => {
      testCounter++;
      const family1 = await setupFamilyWithMembers(baseUrl, testCounter);

      testCounter++;
      const family2 = await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/karma/grant`)
        .set("Authorization", `Bearer ${family2.parentToken}`)
        .send({
          userId: family1.childUserId,
          amount: 50,
        })
        .expect(403);
    });
  });

  describe("Unauthenticated Access", () => {
    it("should require authentication for all karma endpoints", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      // Get balance
      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .expect(401);

      // Get history
      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .expect(401);

      // Grant karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .send({
          userId: childUserId,
          amount: 50,
        })
        .expect(401);
    });
  });
});
