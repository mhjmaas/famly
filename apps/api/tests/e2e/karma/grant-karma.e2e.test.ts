import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: POST /v1/families/:familyId/karma/grant", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should allow parent to grant karma to child", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 50,
          description: "Good behavior this week",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        userId: childUserId,
        totalKarma: 50,
      });
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("eventId");
    });

    it("should grant karma without description", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 25,
        })
        .expect(201);

      expect(response.body.totalKarma).toBe(25);
    });

    it("should accumulate karma from multiple grants", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // First grant
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 30,
        })
        .expect(201);

      // Second grant
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 20,
        })
        .expect(201);

      // Verify total
      const balanceResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/balance/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(balanceResponse.body.totalKarma).toBe(50);
    });

    it("should create karma event with metadata", async () => {
      testCounter++;
      const { familyId, parentToken, parentUserId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 40,
          description: "Great homework",
        })
        .expect(201);

      const historyResponse = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(historyResponse.body.events).toHaveLength(1);
      expect(historyResponse.body.events[0]).toMatchObject({
        amount: 40,
        source: "manual_grant",
        description: "Great homework",
        metadata: {
          grantedBy: parentUserId,
        },
      });
    });

    it("should allow parent to grant karma to themselves", async () => {
      testCounter++;
      const { familyId, parentToken, parentUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: parentUserId,
          amount: 10,
        })
        .expect(201);

      expect(response.body.totalKarma).toBe(10);
    });
  });

  describe("Validation Errors", () => {
    it("should reject invalid family ID", async () => {
      testCounter++;
      const { parentToken, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .post("/v1/families/invalid-id/karma/grant")
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 50,
        })
        .expect(400);
    });

    it("should reject invalid user ID", async () => {
      testCounter++;
      const { familyId, parentToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: "invalid-id",
          amount: 50,
        })
        .expect(400);
    });

    it("should reject amount less than 1", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 0,
        })
        .expect(400);
    });

    it("should reject amount greater than 1000", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 1001,
        })
        .expect(400);
    });

    it("should reject non-integer amount", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 25.5,
        })
        .expect(400);
    });

    it("should reject description longer than 500 characters", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 50,
          description: "a".repeat(501),
        })
        .expect(400);
    });

    it("should reject missing userId", async () => {
      testCounter++;
      const { familyId, parentToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          amount: 50,
        })
        .expect(400);
    });

    it("should reject missing amount", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
        })
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
        .post(`/v1/families/${familyId}/karma/grant`)
        .send({
          userId: childUserId,
          amount: 50,
        })
        .expect(401);
    });

    it("should reject request with invalid token", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", "Bearer invalid-token")
        .send({
          userId: childUserId,
          amount: 50,
        })
        .expect(401);
    });
  });

  describe("Authorization", () => {
    it("should reject child attempting to grant karma", async () => {
      testCounter++;
      const { familyId, parentUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          userId: parentUserId,
          amount: 50,
        })
        .expect(403);
    });

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
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({
          userId: childUserId,
          amount: 50,
        })
        .expect(403);
    });

    it("should reject granting karma to user not in family", async () => {
      testCounter++;
      const { familyId, parentToken } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      testCounter++;
      const { childUserId: otherChildUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: otherChildUserId,
          amount: 50,
        })
        .expect(403);
    });
  });
});
