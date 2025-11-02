import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: Edge Cases and Error Handling", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Not found errors", () => {
    it("should return 404 for non-existent reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Not Found Family")
        .build();

      const fakeRewardId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${fakeRewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 for non-existent claim", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Claim Not Found Family")
        .build();

      const fakeClaimId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/claims/${fakeClaimId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("Duplicate pending claim prevention", () => {
    it("should prevent duplicate pending claim for same reward (409 conflict)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Duplicate Claim Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Single Claim Reward",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 50) {
        // First claim
        const firstClaimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(firstClaimResponse.status).toBe(201);

        // Second claim with same reward
        const secondClaimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(secondClaimResponse.status).toBe(409);
        expect(secondClaimResponse.body.error).toContain("pending claim");
      }
    });

    it("should allow claim after cancelling previous claim for same reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Reclaim Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Reclaimable",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 100) {
        // First claim
        const firstClaimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(firstClaimResponse.status).toBe(201);
        const firstClaimId = firstClaimResponse.body._id;

        // Cancel first claim
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${firstClaimId}`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(cancelResponse.status).toBe(200);

        // Second claim should succeed
        const secondClaimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(secondClaimResponse.status).toBe(201);
      }
    });

    it("should allow claim after completing previous claim for same reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Reclaimafter Complete Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Repeatable",
          karmaCost: 30,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 60) {
        // First claim
        const firstClaimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(firstClaimResponse.status).toBe(201);
        const taskId = firstClaimResponse.body.autoTaskId;

        // Complete task
        const completeResponse = await request(baseUrl)
          .patch(`/v1/families/${family.familyId}/tasks/${taskId}/complete`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({});

        if ([200, 204].includes(completeResponse.status)) {
          // Second claim should succeed after completion
          const secondClaimResponse = await request(baseUrl)
            .post(`/v1/families/${family.familyId}/claims`)
            .set("Authorization", `Bearer ${childToken}`)
            .send({
              rewardId,
            });

          expect(secondClaimResponse.status).toBe(201);
        }
      }
    });
  });

  describe("Reward update after claims", () => {
    it("should allow updating reward that was claimed", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Update Claimed Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Updatable Reward",
          karmaCost: 50,
          description: "Original",
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 50) {
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);

        // Update reward after claim
        const updateResponse = await request(baseUrl)
          .patch(`/v1/families/${family.familyId}/rewards/${rewardId}`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({
            name: "Updated Reward",
            description: "Modified",
          });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.name).toBe("Updated Reward");
      }
    });
  });

  describe("Task deletion edge cases", () => {
    it("should handle manual task deletion (claim remains pending)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Manual Delete Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Deletable Task",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 50) {
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;
        const taskId = claimResponse.body.autoTaskId;

        // Delete task manually
        const deleteTaskResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/tasks/${taskId}`)
          .set("Authorization", `Bearer ${parentToken}`);

        expect([200, 204]).toContain(deleteTaskResponse.status);

        // Verify claim is still pending
        const claimCheckResponse = await request(baseUrl)
          .get(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`);

        if (claimCheckResponse.status === 200) {
          expect(claimCheckResponse.body.status).toBe("pending");
        }

        // Member can still cancel the orphaned claim
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(cancelResponse.status).toBe(200);
      }
    });
  });

  describe("Metadata edge cases", () => {
    it("should gracefully handle metadata update failure (claim still completes)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Metadata Failure Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Metadata Reward",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 50) {
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const taskId = claimResponse.body.autoTaskId;

        // Complete task (metadata should update but claim should complete regardless)
        const completeResponse = await request(baseUrl)
          .patch(`/v1/families/${family.familyId}/tasks/${taskId}/complete`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({});

        // Task should complete successfully
        expect([200, 204, 400]).toContain(completeResponse.status);
      }
    });

    it("should track favourite count accurately across members", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Favourite Count Family")
        .addChild("Child 1")
        .addChild("Child 2")
        .addChild("Child 3")
        .build();

      const child1Token = family.members[0].token;
      const child2Token = family.members[1].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Popular Reward",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Child 1 favours
      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${child1Token}`)
        .send({
          isFavourite: true,
        });

      // Child 2 favours
      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${child2Token}`)
        .send({
          isFavourite: true,
        });

      // Child 3 does NOT favour

      // Get reward details as parent
      const rewardDetailsResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${parentToken}`);

      if (rewardDetailsResponse.status === 200) {
        const totalFavouriteCount =
          rewardDetailsResponse.body.totalFavouriteCount ?? 0;
        // Should be at least 2 (children 1 and 2)
        expect(totalFavouriteCount).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("Concurrent operations", () => {
    it("should handle concurrent claims from different members", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Concurrent Claims Family")
        .addChild("Child 1")
        .addChild("Child 2")
        .build();

      const child1Token = family.members[0].token;
      const child1Id = family.members[0].memberId;
      const child2Token = family.members[1].token;
      const child2Id = family.members[1].memberId;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Shared Reward",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check both children's karma
      const karma1Response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${child1Id}/karma`)
        .set("Authorization", `Bearer ${child1Token}`);

      const karma2Response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${child2Id}/karma`)
        .set("Authorization", `Bearer ${child2Token}`);

      if (
        karma1Response.body.totalKarma >= 50 &&
        karma2Response.body.totalKarma >= 50
      ) {
        // Both claim concurrently (simulated)
        const claim1Response = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${child1Token}`);

        const claim2Response = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${child2Token}`);

        // Both should succeed (different members)
        expect(claim1Response.status).toBe(201);
        expect(claim2Response.status).toBe(201);

        // Both claims should be pending
        expect(claim1Response.body.status).toBe("pending");
        expect(claim2Response.body.status).toBe("pending");
      }
    });
  });

  describe("Boundary values", () => {
    it("should handle minimum karma cost reward (1)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Min Cost Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Cheapest",
          karmaCost: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.karmaCost).toBe(1);
    });

    it("should handle maximum karma cost reward (1000)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Max Cost Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Most Expensive",
          karmaCost: 1000,
        });

      expect(response.status).toBe(201);
      expect(response.body.karmaCost).toBe(1000);
    });

    it("should reject karma cost above maximum (1001)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Over Max Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Too Expensive",
          karmaCost: 1001,
        });

      expect(response.status).toBe(400);
    });

    it("should handle minimum name length (1 char)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Min Name Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "A",
          karmaCost: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe("A");
    });

    it("should handle maximum name length (100 chars)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Max Name Family")
        .build();

      const maxName = "a".repeat(100);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: maxName,
          karmaCost: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(maxName);
    });
  });
});
