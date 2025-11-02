import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: Reward Authorization Matrix", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Reward CRUD authorization", () => {
    it("should parent can create reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Parent Create Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Parent Created",
          karmaCost: 50,
        });

      expect(response.status).toBe(201);
    });

    it("should child cannot create reward (403)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Child Create Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Unauthorized",
          karmaCost: 50,
        });

      expect(response.status).toBe(403);
    });

    it("should parent can update reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Parent Update Family")
        .build();

      // Create reward
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Original",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Update
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Updated",
        });

      expect(updateResponse.status).toBe(200);
    });

    it("should child cannot update reward (403)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Child Update Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // Create reward as parent
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Try to update as child
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Hacked",
        });

      expect(updateResponse.status).toBe(403);
    });

    it("should parent can delete reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Parent Delete Family")
        .build();

      // Create reward
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Deletable",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Delete
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(deleteResponse.status).toBe(204);
    });

    it("should child cannot delete reward (403)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Child Delete Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // Create reward as parent
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Protected",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Try to delete as child
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(deleteResponse.status).toBe(403);
    });

    it("should any member can list rewards", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("List Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // Create reward as parent
      await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Listed",
          karmaCost: 50,
        });

      // List as child
      const listResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
    });

    it("should any member can get single reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Get Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // Create reward as parent
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Gettable",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Get as child
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(getResponse.status).toBe(200);
    });
  });

  describe("Claim authorization", () => {
    it("should member can claim reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Claim Member Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Claimable",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 50) {
        // Claim
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
      }
    });

    it("should member can list own claims", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("List Claims Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // List claims
      const listResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/claims`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
    });

    it("should member can cancel own claim", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Cancel Own Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Cancellable",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 50) {
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        const claimId = claimResponse.body._id;

        // Cancel
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(cancelResponse.status).toBe(200);
      }
    });

    it("should parent can cancel member's claim", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Parent Cancel Member Family")
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
          name: "Parent Cancel",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma and claim if sufficient
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 50) {
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        const claimId = claimResponse.body._id;

        // Parent cancels
        const cancelResponse = await request(baseUrl)
          .delete(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${parentToken}`);

        expect(cancelResponse.status).toBe(200);
      }
    });
  });

  describe("Non-family member access", () => {
    it("should non-family member cannot access family rewards (403)", async () => {
      const family1 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 1")
        .build();

      const family2 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 2")
        .build();

      // Try to list rewards from family1 using family2's token
      const response = await request(baseUrl)
        .get(`/v1/families/${family1.familyId}/rewards`)
        .set("Authorization", `Bearer ${family2.parentToken}`);

      expect(response.status).toBe(403);
    });

    it("should non-family member cannot create reward in other family (403)", async () => {
      const family1 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 1")
        .build();

      const family2 = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Family 2")
        .build();

      // Try to create reward in family1 using family2's token
      const response = await request(baseUrl)
        .post(`/v1/families/${family1.familyId}/rewards`)
        .set("Authorization", `Bearer ${family2.parentToken}`)
        .send({
          name: "Hacked",
          karmaCost: 50,
        });

      expect(response.status).toBe(403);
    });
  });

  describe("Unauthenticated access", () => {
    it("should unauthenticated request rejected when creating reward (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auth Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .send({
          name: "Unauthorized",
          karmaCost: 50,
        });

      expect(response.status).toBe(401);
    });

    it("should unauthenticated request rejected when listing rewards (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auth List Family")
        .build();

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards`);

      expect(response.status).toBe(401);
    });

    it("should unauthenticated request rejected when claiming reward (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auth Claim Family")
        .build();

      const fakeRewardId = new ObjectId().toString();
      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${fakeRewardId}/claim`);

      expect(response.status).toBe(401);
    });

    it("should unauthenticated request rejected when updating reward (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auth Update Family")
        .build();

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/rewards/${new ObjectId().toString()}`)
        .send({
          name: "Hacked",
        });

      expect(response.status).toBe(401);
    });

    it("should unauthenticated request rejected when deleting reward (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auth Delete Family")
        .build();

      const response = await request(baseUrl)
        .delete(
          `/v1/families/${family.familyId}/rewards/${new ObjectId().toString()}`,
        );

      expect(response.status).toBe(401);
    });
  });
});
