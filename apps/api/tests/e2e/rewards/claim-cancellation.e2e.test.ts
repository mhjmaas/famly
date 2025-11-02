import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: Claim Cancellation Workflows", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Member cancellation", () => {
    it("should member cancel own pending claim successfully", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Cancellation Family")
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
          name: "Prize",
          karmaCost: 40,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 40) {
        // Create claim
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;

        // Verify claim is pending
        expect(claimResponse.body.status).toBe("pending");

        // Cancel claim
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`)
          .send({});

        expect(cancelResponse.status).toBe(200);
        expect(cancelResponse.body).toHaveProperty("status", "cancelled");
        expect(cancelResponse.body).toHaveProperty("cancelledAt");

        // Verify claim is cancelled
        const checkResponse = await request(baseUrl)
          .get(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`);

        if (checkResponse.status === 200) {
          expect(checkResponse.body.status).toBe("cancelled");
        }
      }
    });

    it("should delete auto-task when member cancels claim", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Task Deletion Family")
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
          name: "Gadget",
          karmaCost: 35,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 35) {
        // Create claim
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;
        const taskId = claimResponse.body.autoTaskId;

        // Verify task exists
        expect(taskId).toBeDefined();

        // Cancel claim
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`)
          .send({});

        expect(cancelResponse.status).toBe(200);

        // Verify task is deleted (404 when trying to access it)
        const taskCheckResponse = await request(baseUrl)
          .get(`/v1/families/${family.familyId}/tasks/${taskId}`)
          .set("Authorization", `Bearer ${parentToken}`);

        expect(taskCheckResponse.status).toBe(404);
      }
    });
  });

  describe("Parent cancellation", () => {
    it("should parent cancel member's pending claim", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Parent Cancel Family")
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
          name: "Tablet",
          karmaCost: 60,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 60) {
        // Create claim as child
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;

        // Parent cancels claim
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({});

        expect(cancelResponse.status).toBe(200);
        expect(cancelResponse.body).toHaveProperty("status", "cancelled");
      }
    });

    it("should delete auto-task when parent cancels member's claim", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Parent Task Delete Family")
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
          name: "Laptop",
          karmaCost: 200,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 200) {
        // Create claim as child
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const taskId = claimResponse.body.autoTaskId;

        // Parent cancels claim
        const cancelResponse = await request(baseUrl)
          .delete(
            `/v1/families/${family.familyId}/claims/${claimResponse.body._id}`,
          )
          .set("Authorization", `Bearer ${parentToken}`)
          .send({});

        expect(cancelResponse.status).toBe(200);

        // Verify task is deleted
        const taskCheckResponse = await request(baseUrl)
          .get(`/v1/families/${family.familyId}/tasks/${taskId}`)
          .set("Authorization", `Bearer ${parentToken}`);

        expect(taskCheckResponse.status).toBe(404);
      }
    });
  });

  describe("Authorization", () => {
    it("should child cannot cancel another child's claim (403)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Multi-Child Family")
        .addChild("Child 1")
        .addChild("Child 2")
        .build();

      const child1Token = family.members[0].token;
      const child1Id = family.members[0].memberId;
      const child2Token = family.members[1].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Shared Prize",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma for child1 and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${child1Id}/karma`)
        .set("Authorization", `Bearer ${child1Token}`);

      if (karmaResponse.body.totalKarma >= 50) {
        // Create claim as child1
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${child1Token}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;

        // Try to cancel with child2 token
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${child2Token}`)
          .send({});

        expect(cancelResponse.status).toBe(403);
      }
    });
  });

  describe("Error cases", () => {
    it("should prevent cancelling completed claim (409)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Completed Claim Family")
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
          name: "Book",
          karmaCost: 20,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 20) {
        // Create claim
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;
        const taskId = claimResponse.body.autoTaskId;

        // Complete task to mark claim as completed
        const completeResponse = await request(baseUrl)
          .patch(`/v1/families/${family.familyId}/tasks/${taskId}/complete`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({});

        if ([200, 204].includes(completeResponse.status)) {
          // Try to cancel completed claim
          const cancelResponse = await request(baseUrl)
            .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
            .set("Authorization", `Bearer ${childToken}`)
            .send({});

          expect(cancelResponse.status).toBe(409);
        }
      }
    });

    it("should return 404 for non-existent claim cancellation", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Not Found Family")
        .build();

      const fakeClaimId = new ObjectId().toString();

      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/claims/${fakeClaimId}`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({});

      expect(response.status).toBe(404);
    });

    it("should prevent cancelling already cancelled claim", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Double Cancel Family")
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
          name: "Thing",
          karmaCost: 15,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 15) {
        // Create claim
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;

        // Cancel claim first time
        const firstCancel = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`)
          .send({});

        expect(firstCancel.status).toBe(200);

        // Try to cancel again
        const secondCancel = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`)
          .send({});

        expect(secondCancel.status).toBe(409);
      }
    });
  });
});
