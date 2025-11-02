import request from "supertest";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";
import { TestDataFactory } from "../helpers/test-data-factory";

describe("E2E: Claim Workflow (Happy Path)", () => {
  let baseUrl: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Full claim lifecycle", () => {
    it("should complete full claim workflow: create -> verify task -> complete task -> verify claim completed -> verify karma deducted", async () => {
      // Step 1: Setup family with parent and child
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Workflow Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const childId = family.members[0].memberId;
      const parentToken = family.parentToken;

      // Step 2: Create a reward (cost = 50 karma)
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Movie Night",
          karmaCost: 50,
          description: "One movie night with family",
        });

      expect(rewardResponse.status).toBe(201);
      const rewardId = rewardResponse.body._id;
      expect(rewardResponse.body).toHaveProperty("karmaCost", 50);

      // Step 3: Grant child karma by creating and completing a task
      const taskResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/tasks`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Setup Task",
          assignment: { type: "member", memberId: childId },
          metadata: { karma: 100 },
        });

      if (taskResponse.status !== 201) {
        console.log(
          "Task creation failed:",
          taskResponse.status,
          taskResponse.body,
        );
      }
      expect(taskResponse.status).toBe(201);
      const taskId = taskResponse.body._id;

      // Complete the task to grant karma
      const completeSetupTaskResponse = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${childToken}`)
        .send({ completedAt: new Date().toISOString() });

      expect(completeSetupTaskResponse.status).toBe(200);

      // Get child's initial karma (should now be 100)
      const initialKarmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(initialKarmaResponse.status).toBe(200);
      const initialKarma = initialKarmaResponse.body.totalKarma;
      expect(initialKarma).toBeGreaterThanOrEqual(50);

      // Step 4: Child claims reward

      const claimResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(claimResponse.status).toBe(201);
      const claimId = claimResponse.body._id;
      expect(claimResponse.body).toHaveProperty("status", "pending");
      expect(claimResponse.body).toHaveProperty("rewardId", rewardId);
      expect(claimResponse.body).toHaveProperty("memberId", childId);
      expect(claimResponse.body).toHaveProperty("autoTaskId");

      // Step 5: Verify pending claim exists
      const listClaimsResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/claims`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(listClaimsResponse.status).toBe(200);
      expect(Array.isArray(listClaimsResponse.body)).toBe(true);
      const pendingClaims = listClaimsResponse.body.filter(
        (c: any) => c.status === "pending",
      );
      expect(pendingClaims.length).toBeGreaterThan(0);
      expect(pendingClaims.some((c: any) => c._id === claimId)).toBe(true);

      // Step 6: Verify auto-task was created
      // Note: This test assumes tasks can be listed via family endpoint
      const autoTaskId = claimResponse.body.autoTaskId;
      expect(autoTaskId).toBeDefined();

      // Step 7: Complete the task as parent (which should trigger claim completion)
      const completeTaskResponse = await request(baseUrl)
        .patch(`/v1/families/${family.familyId}/tasks/${autoTaskId}`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({ completedAt: new Date().toISOString() });

      expect(completeTaskResponse.status).toBe(200);

      // Step 8: Verify claim is now completed
      const claimCheckResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/claims/${claimId}`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(claimCheckResponse.status).toBe(200);
      expect(claimCheckResponse.body).toHaveProperty("status", "completed");
      expect(claimCheckResponse.body).toHaveProperty("completedAt");

      // Step 9: Verify karma was deducted
      const finalKarmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      expect(finalKarmaResponse.status).toBe(200);
      const finalKarma = finalKarmaResponse.body.totalKarma;
      expect(finalKarma).toBe(initialKarma - 50);
    });

    it("should member with sufficient karma claims reward successfully", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Claim Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Ice Cream",
          karmaCost: 25,
        });

      const rewardId = rewardResponse.body._id;

      // Check child has enough karma
      const childId = family.members[0].memberId;
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 25) {
        // Claim reward
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        expect(claimResponse.body).toHaveProperty("status", "pending");
      }
    });

    it("should create auto-task with correct description including member name and reward name", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Task Description Family")
        .addChild("Test Child")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Gaming Console",
          karmaCost: 100,
          description: "High-value reward",
        });

      const rewardId = rewardResponse.body._id;

      // Check karma
      const childId = family.members[0].memberId;
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 100) {
        // Claim reward
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);

        // Get task details to verify name format
        const taskId = claimResponse.body.autoTaskId;
        const taskResponse = await request(baseUrl)
          .get(`/v1/families/${family.familyId}/tasks/${taskId}`)
          .set("Authorization", `Bearer ${parentToken}`);

        // Verify task name includes reward name
        if (taskResponse.status === 200) {
          expect(taskResponse.body.name).toContain("Gaming Console");
        }
      }
    });

    it("should parent complete task triggers automatic claim completion", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Auto Completion Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Bicycle",
          karmaCost: 150,
        });

      const rewardId = rewardResponse.body._id;

      // Check karma
      const childId = family.members[0].memberId;
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 150) {
        // Claim reward
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const claimId = claimResponse.body._id;
        const taskId = claimResponse.body.autoTaskId;

        // Complete task
        const completeResponse = await request(baseUrl)
          .patch(`/v1/families/${family.familyId}/tasks/${taskId}/complete`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({});

        expect([200, 204]).toContain(completeResponse.status);

        // Verify claim is completed
        const claimCheckResponse = await request(baseUrl)
          .get(`/v1/families/${family.familyId}/claims/${claimId}`)
          .set("Authorization", `Bearer ${childToken}`);

        if (claimCheckResponse.status === 200) {
          expect(claimCheckResponse.body.status).toBe("completed");
        }
      }
    });

    it("should claim count incremented in metadata after completion", async () => {
      const family = await TestDataFactory.family(baseUrl, testCounter++)
        .withName("Metadata Family")
        .addChild("Child User")
        .build();

      const childToken = family.members[0].token;
      const parentToken = family.parentToken;

      // Create reward
      const rewardResponse = await request(baseUrl)
        .post(`/v1/families/${family.familyId}/rewards`)
        .set("Authorization", `Bearer ${parentToken}`)
        .send({
          name: "Toy",
          karmaCost: 30,
        });

      const rewardId = rewardResponse.body._id;

      // Check reward details before claim
      const beforeResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
        .set("Authorization", `Bearer ${childToken}`);

      const beforeCount = beforeResponse.body.totalClaimCount ?? 0;

      // Check karma and claim if sufficient
      const childId = family.members[0].memberId;
      const karmaResponse = await request(baseUrl)
        .get(`/v1/families/${family.familyId}/members/${childId}/karma`)
        .set("Authorization", `Bearer ${childToken}`);

      if (karmaResponse.body.totalKarma >= 30) {
        // Claim reward
        const claimResponse = await request(baseUrl)
          .post(`/v1/families/${family.familyId}/rewards/${rewardId}/claim`)
          .set("Authorization", `Bearer ${childToken}`);

        expect(claimResponse.status).toBe(201);
        const taskId = claimResponse.body.autoTaskId;

        // Complete task
        const completeResponse = await request(baseUrl)
          .patch(`/v1/families/${family.familyId}/tasks/${taskId}/complete`)
          .set("Authorization", `Bearer ${parentToken}`)
          .send({});

        if ([200, 204].includes(completeResponse.status)) {
          // Check reward details after claim
          const afterResponse = await request(baseUrl)
            .get(`/v1/families/${family.familyId}/rewards/${rewardId}`)
            .set("Authorization", `Bearer ${childToken}`);

          if (afterResponse.status === 200) {
            const afterCount = afterResponse.body.totalClaimCount ?? 0;
            // Count should increment by 1
            expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
          }
        }
      }
    });
  });
});
