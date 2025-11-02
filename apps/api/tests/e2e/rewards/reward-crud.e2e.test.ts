import { ObjectId } from "mongodb";
import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: Reward CRUD Operations", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Success Cases", () => {
    it("should create reward as parent with 201", async () => {
      // Setup family with parent
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Homework Completion",
          karmaCost: 50,
          description: "Complete all homework assignments",
          imageUrl: "https://example.com/reward.png",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body).toHaveProperty("name", "Homework Completion");
      expect(response.body).toHaveProperty("karmaCost", 50);
      expect(response.body).toHaveProperty(
        "description",
        "Complete all homework assignments",
      );
      expect(response.body).toHaveProperty(
        "imageUrl",
        "https://example.com/reward.png",
      );
      expect(response.body).toHaveProperty("familyId", family.familyId);
      expect(response.body).toHaveProperty("createdAt");
    });

    it("should list rewards and child can see all", async () => {
      // Setup family with parent and child
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // Create multiple rewards as parent
      const reward1Response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Reward 1",
          karmaCost: 50,
          description: "First reward",
        });

      const reward2Response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Reward 2",
          karmaCost: 100,
          description: "Second reward",
        });

      expect(reward1Response.status).toBe(201);
      expect(reward2Response.status).toBe(201);

      // List as child
      const listResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(listResponse.status).toBe(200);
      expect(Array.isArray(listResponse.body)).toBe(true);
      expect(listResponse.body.length).toBeGreaterThanOrEqual(2);

      const rewardNames = listResponse.body.map((r: any) => r.name);
      expect(rewardNames).toContain("Reward 1");
      expect(rewardNames).toContain("Reward 2");
    });

    it("should get single reward with details", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      // Create reward
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test Reward",
          karmaCost: 75,
          description: "A test reward",
        });

      const rewardId = createResponse.body._id;

      // Get reward
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty("_id", rewardId);
      expect(getResponse.body).toHaveProperty("name", "Test Reward");
      expect(getResponse.body).toHaveProperty("karmaCost", 75);
      expect(getResponse.body).toHaveProperty("description", "A test reward");
    });

    it("should update reward as parent", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      // Create reward
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Original Name",
          karmaCost: 50,
          description: "Original description",
        });

      const rewardId = createResponse.body._id;

      // Update reward
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Updated Name",
          karmaCost: 100,
          description: "Updated description",
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body).toHaveProperty("name", "Updated Name");
      expect(updateResponse.body).toHaveProperty("karmaCost", 100);
      expect(updateResponse.body).toHaveProperty(
        "description",
        "Updated description",
      );

      // Verify by getting the reward
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(getResponse.body).toHaveProperty("name", "Updated Name");
      expect(getResponse.body).toHaveProperty("karmaCost", 100);
    });

    it("should delete reward with no pending claims", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      // Create reward
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Deletable Reward",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Delete reward
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify reward is gone
      const getResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(getResponse.status).toBe(404);
    });
  });

  describe("Delete with pending claims", () => {
    it("should prevent delete with pending claims (409 conflict)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childMemberId = family.members[0].memberId;

      // Grant karma to child by creating and completing a task
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/tasks`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test Task",
          assignment: { type: "member", memberId: childMemberId },
          metadata: { karma: 100 },
        });

      if (taskResponse.status === 201) {
        await request(baseUrl)
          .patch(
            `/v1/families/${family.familyId}/tasks/${taskResponse.body._id}`,
          )
          .set("Authorization", `Bearer ${childToken}`)
          .send({ completedAt: new Date().toISOString() });
      }

      // Create reward
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Reward",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Create a pending claim (child claims reward)
      const claimResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
        .set("Authorization", `Bearer ${childToken}`);

      // Verify claim was created successfully
      expect(claimResponse.status).toBe(201);
      expect(claimResponse.body).toHaveProperty("status", "pending");

      // Attempt to delete reward with pending claim
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(deleteResponse.status).toBe(409);
      expect(deleteResponse.body).toHaveProperty("error");
      expect(deleteResponse.body.error).toContain("pending claims");
    });
  });

  describe("Authorization", () => {
    it("should prevent child from creating reward (403 forbidden)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Unauthorized Reward",
          karmaCost: 50,
        });

      expect(response.status).toBe(403);
    });

    it("should prevent child from updating reward (403 forbidden)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // Create reward as parent
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test Reward",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Try to update as child
      const updateResponse = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({
          name: "Hacked Name",
        });

      expect(updateResponse.status).toBe(403);
    });

    it("should prevent child from deleting reward (403 forbidden)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;

      // Create reward as parent
      const createResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test Reward",
          karmaCost: 50,
        });

      const rewardId = createResponse.body._id;

      // Try to delete as child
      const deleteResponse = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(deleteResponse.status).toBe(403);
    });

    it("should reject unauthenticated requests (401)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .send({
          name: "Unauthorized",
          karmaCost: 50,
        });

      expect(response.status).toBe(401);
    });
  });

  describe("Validation", () => {
    it("should reject reward with missing name (400)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          karmaCost: 50,
        });

      expect(response.status).toBe(400);
    });

    it("should reject reward with missing karmaCost (400)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test",
        });

      expect(response.status).toBe(400);
    });

    it("should reject reward with negative karmaCost (400)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test",
          karmaCost: -10,
        });

      expect(response.status).toBe(400);
    });

    it("should reject reward with invalid imageUrl (400)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test",
          karmaCost: 50,
          imageUrl: "not-a-valid-url",
        });

      expect(response.status).toBe(400);
    });

    it("should reject reward with name exceeding max length (400)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const tooLongName = "a".repeat(101);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: tooLongName,
          karmaCost: 50,
        });

      expect(response.status).toBe(400);
    });

    it("should reject reward with description exceeding max length (400)", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const tooLongDescription = "a".repeat(501);

      const response = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Test",
          karmaCost: 50,
          description: tooLongDescription,
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Not found cases", () => {
    it("should return 404 for non-existent reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const fakeRewardId = new ObjectId().toString();

      const response = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${fakeRewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 404 when updating non-existent reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const fakeRewardId = new ObjectId().toString();

      const response = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/rewards/${fakeRewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`)
        .send({
          name: "Updated",
        });

      expect(response.status).toBe(404);
    });

    it("should return 404 when deleting non-existent reward", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Test Family")
        .build();

      const fakeRewardId = new ObjectId().toString();

      const response = await request(baseUrl)
        .delete(`/v1/families/${family.familyId}/rewards/${fakeRewardId}`)
        .set("Authorization", `Bearer ${family.parentToken}`);

      expect(response.status).toBe(404);
    });
  });
});
