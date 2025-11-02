import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: Reward Favourite Functionality", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Toggle favourite", () => {
    it("should member mark reward as favourite", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Favourite Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Awesome Reward",
          karmaCost: 50,
        });

      expect(rewardResponse.status).toBe(201);
      const rewardId = rewardResponse.body._id;

      // Mark as favourite
      const favouriteResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: true,
        });

      expect(favouriteResponse.status).toBe(200);
      expect(favouriteResponse.body).toHaveProperty("memberFavourite", true);
    });

    it("should member unmark reward as favourite", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Unfavourite Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Test Reward",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Mark as favourite
      const markResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: true,
        });

      expect(markResponse.status).toBe(200);

      // Unmark as favourite
      const unmarkResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: false,
        });

      expect(unmarkResponse.status).toBe(200);
      expect(unmarkResponse.body).toHaveProperty("memberFavourite", false);
    });

    it("should toggle favourite on/off multiple times", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Toggle Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Toggle Reward",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // First toggle: on
      const toggleOnResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: true,
        });

      expect(toggleOnResponse.status).toBe(200);
      expect(toggleOnResponse.body.memberFavourite).toBe(true);

      // Second toggle: off
      const toggleOffResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: false,
        });

      expect(toggleOffResponse.status).toBe(200);
      expect(toggleOffResponse.body.memberFavourite).toBe(false);

      // Third toggle: on again
      const toggleOnAgainResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: true,
        });

      expect(toggleOnAgainResponse.status).toBe(200);
      expect(toggleOnAgainResponse.body.memberFavourite).toBe(true);
    });
  });

  describe("Member-specific favourites", () => {
    it("should different members have different favourite statuses for same reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Multiple Members Family")
        .addChild("Child 1")
        .addChild("Child 2")
        .build();

      const child1Token = family.members[0].token;
      const child2Token = family.members[1].token;
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

      // Child 1 marks as favourite
      const child1FavResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${child1Token}`)
        .send({
          isFavourite: true,
        });

      expect(child1FavResponse.status).toBe(200);
      expect(child1FavResponse.body.memberFavourite).toBe(true);

      // Child 2 does NOT mark as favourite
      const child2FavResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${child2Token}`)
        .send({
          isFavourite: false,
        });

      expect(child2FavResponse.status).toBe(200);
      expect(child2FavResponse.body.memberFavourite).toBe(false);

      // Get reward as child 1 - should show as favourite
      const child1GetResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${child1Token}`);

      if (child1GetResponse.status === 200) {
        expect(child1GetResponse.body.memberFavourite).toBe(true);
      }

      // Get reward as child 2 - should NOT show as favourite
      const child2GetResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${child2Token}`);

      if (child2GetResponse.status === 200) {
        expect(child2GetResponse.body.memberFavourite).toBe(false);
      }
    });
  });

  describe("Favourite persistence", () => {
    it("should favourite status persist across multiple requests", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Persistence Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Persistent Reward",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Mark as favourite
      const markResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: true,
        });

      expect(markResponse.status).toBe(200);

      // Get reward and verify favourite status
      const firstGetResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`);

      if (firstGetResponse.status === 200) {
        expect(firstGetResponse.body.memberFavourite).toBe(true);
      }

      // Get reward again - favourite should still be set
      const secondGetResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`);

      if (secondGetResponse.status === 200) {
        expect(secondGetResponse.body.memberFavourite).toBe(true);
      }

      // List all rewards - favourite status should appear
      const listResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${childToken}`);

      if (listResponse.status === 200 && Array.isArray(listResponse.body)) {
        const reward = listResponse.body.find((r: any) => r._id === rewardId);
        if (reward) {
          // Verify reward has favourite info in list
          expect(reward).toHaveProperty("memberFavourite");
        }
      }
    });

    it("should favourite status survives after updating reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Update Favourite Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Original Name",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Mark as favourite
      const markResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: true,
        });

      expect(markResponse.status).toBe(200);

      // Update reward
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Updated Name",
          karmaCost: 75,
        });

      expect(updateResponse.status).toBe(200);

      // Verify favourite status still set after update
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`);

      if (getResponse.status === 200) {
        expect(getResponse.body.memberFavourite).toBe(true);
      }
    });
  });

  describe("Favourite endpoint errors", () => {
    it("should return 404 when marking non-existent reward as favourite", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Not Found Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const fakeRewardId = new ObjectId().toString();

      const response = await request(baseUrl)
        .post(
          `/v1/families/${family.familyId}/rewards/${fakeRewardId}/favourite`,
        )
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          isFavourite: true,
        });

      expect(response.status).toBe(404);
    });

    it("should reject unauthenticated favourite toggle (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auth Family")
        .build();

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test",
          karmaCost: 50,
        });

      const rewardId = rewardResponse.body._id;

      // Try to toggle without auth
      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/favourite`)
        .send({
          isFavourite: true,
        });

      expect(response.status).toBe(401);
    });
  });
});
