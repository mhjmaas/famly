import request from "supertest";
import { setupFamilyWithMembers } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: GET /v1/families/:familyId/karma/history/:userId", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should return empty history for new member", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body).toEqual({
        events: [],
        pagination: {
          hasMore: false,
        },
      });
    });

    it("should return karma events after manual grant", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Grant karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 25,
          description: "Good behavior",
        })
        .expect(201);

      // Get history
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0]).toMatchObject({
        amount: 25,
        source: "manual_grant",
        description: "Good behavior",
      });
      expect(response.body.events[0]).toHaveProperty("id");
      expect(response.body.events[0]).toHaveProperty("createdAt");
      expect(response.body.pagination.hasMore).toBe(false);
      expect(response.body.pagination.nextCursor).toBeUndefined();
    });

    it("should paginate karma events", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Grant karma multiple times
      for (let i = 1; i <= 3; i++) {
        await request(baseUrl)
          .post(`/v1/families/${familyId}/karma/grant`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({
            userId: childUserId,
            amount: 10 * i,
            description: `Grant ${i}`,
          })
          .expect(201);
      }

      // Get first page with limit 2
      const page1Response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}?limit=2`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(page1Response.body.events).toHaveLength(2);
      expect(page1Response.body.pagination.hasMore).toBe(true);
      expect(page1Response.body.pagination.nextCursor).toBeTruthy();

      // Get second page using cursor
      const page2Response = await request(baseUrl)
        .get(
          `/v1/families/${familyId}/karma/history/${childUserId}?limit=2&cursor=${page1Response.body.pagination.nextCursor}`,
        )
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(page2Response.body.events).toHaveLength(1);
      expect(page2Response.body.pagination.hasMore).toBe(false);
    });

    it("should respect limit parameter", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Grant karma 5 times
      for (let i = 1; i <= 5; i++) {
        await request(baseUrl)
          .post(`/v1/families/${familyId}/karma/grant`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({
            userId: childUserId,
            amount: 10,
          })
          .expect(201);
      }

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}?limit=3`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(3);
      expect(response.body.pagination.hasMore).toBe(true);
    });

    it("should allow parent to view child history", async () => {
      testCounter++;
      const { familyId, parentToken, childUserId } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      // Grant karma
      await request(baseUrl)
        .post(`/v1/families/${familyId}/karma/grant`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          userId: childUserId,
          amount: 15,
        })
        .expect(201);

      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .expect(200);

      expect(response.body.events).toHaveLength(1);
      expect(response.body.events[0].amount).toBe(15);
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
        .get(`/v1/families/invalid-id/karma/history/${childUserId}`)
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
        .get(`/v1/families/${familyId}/karma/history/invalid-id`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(400);
    });

    it("should reject invalid cursor", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .get(
          `/v1/families/${familyId}/karma/history/${childUserId}?cursor=invalid-cursor`,
        )
        .set("Authorization", `Bearer ${childToken}`)
        .expect(400);
    });

    it("should reject negative limit", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}?limit=-1`)
        .set("Authorization", `Bearer ${childToken}`)
        .expect(400);
    });

    it("should reject limit exceeding maximum", async () => {
      testCounter++;
      const { familyId, childUserId, childToken } =
        await setupFamilyWithMembers(baseUrl, testCounter);

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}?limit=101`)
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
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .expect(401);
    });

    it("should reject request with invalid token", async () => {
      testCounter++;
      const { familyId, childUserId } = await setupFamilyWithMembers(
        baseUrl,
        testCounter,
      );

      await request(baseUrl)
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
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
        .get(`/v1/families/${familyId}/karma/history/${childUserId}`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .expect(403);
    });
  });
});
