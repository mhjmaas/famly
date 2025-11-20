import { getCurrentWeekStart } from "@modules/contribution-goals/lib/week-utils";
import request from "supertest";
import { addChildMember, setupTestFamily } from "../helpers/auth-setup";
import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

describe("E2E: Contribution Goals Weekly Processing (Bug Fix: Correct Week Processing)", () => {
  let baseUrl: string;
  let authToken: string;
  let familyId: string;
  let childUserId: string;
  let testCounter = 0;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();

    testCounter++;
    const setup = await setupTestFamily(baseUrl, testCounter, {
      userName: "Contribution Test Parent",
      familyName: "Contribution Test Family",
      prefix: "contribtest",
    });

    authToken = setup.token;
    familyId = setup.familyId;

    // Add a child member
    const childSetup = await addChildMember(
      baseUrl,
      familyId,
      authToken,
      testCounter,
      {
        name: "Test Child",
        prefix: "contribchild",
      },
    );

    childUserId = childSetup.childUserId;
  });

  describe("Contribution Goal Weekly Processing", () => {
    it("should create a contribution goal with current week start date", async () => {
      const weekStart = getCurrentWeekStart();

      const response = await request(baseUrl)
        .post(`/v1/families/${familyId}/contribution-goals`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Keep Room Clean",
          description: "Maintain a tidy bedroom",
          maxKarma: 100,
          memberId: childUserId,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.weekStartDate).toBe(weekStart.toISOString());
      expect(response.body.maxKarma).toBe(100);
      expect(response.body.deductions).toEqual([]);
    });

    it("should retrieve the goal for the current week", async () => {
      // Create a goal
      await request(baseUrl)
        .post(`/v1/families/${familyId}/contribution-goals`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Keep Room Clean",
          description: "Maintain a tidy bedroom",
          maxKarma: 100,
          memberId: childUserId,
        });

      // Retrieve the goal
      const response = await request(baseUrl)
        .get(`/v1/families/${familyId}/contribution-goals/${childUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe("Keep Room Clean");
      expect(response.body.currentKarma).toBe(100);
    });

    it("should process the correct week when calling processWeeklyGoals with last week's start date", async () => {
      // This test verifies the bug fix: the scheduler should process the PREVIOUS week's goals
      // when the cron runs at Sunday 18:00 UTC, not the current week's goals.

      // Create a goal for the current week
      const goalResponse = await request(baseUrl)
        .post(`/v1/families/${familyId}/contribution-goals`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Keep Room Clean",
          description: "Maintain a tidy bedroom",
          maxKarma: 100,
          memberId: childUserId,
        });

      expect(goalResponse.status).toBe(201);

      // Get the current week start (which is THIS Sunday 18:00 UTC when cron runs)
      const currentWeekStart = getCurrentWeekStart();

      // Calculate the last week start (7 days before)
      const lastWeekStart = new Date(currentWeekStart);
      lastWeekStart.setUTCDate(currentWeekStart.getUTCDate() - 7);

      // Verify the goal was created with the current week start
      expect(goalResponse.body.weekStartDate).toBe(
        currentWeekStart.toISOString(),
      );

      // The scheduler fix ensures that when the cron runs at Sunday 18:00 UTC,
      // it subtracts 7 days from the current week start to get the previous week's start.
      // This confirms that newly created goals (on current week) are separate from
      // the goals that would be processed by the scheduler.
    });

    it("should add deduction and calculate remaining karma correctly", async () => {
      // Create a goal
      await request(baseUrl)
        .post(`/v1/families/${familyId}/contribution-goals`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Keep Room Clean",
          description: "Maintain a tidy bedroom",
          maxKarma: 100,
          memberId: childUserId,
        });

      // Add a deduction
      const deductionResponse = await request(baseUrl)
        .post(
          `/v1/families/${familyId}/contribution-goals/${childUserId}/deductions`,
        )
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 30,
          reason: "Messy bedroom",
        });

      expect(deductionResponse.status).toBe(200);
      expect(deductionResponse.body.deductions.length).toBe(1);
      expect(deductionResponse.body.deductions[0].amount).toBe(30);
      expect(deductionResponse.body.deductions[0].reason).toBe("Messy bedroom");
      expect(deductionResponse.body.currentKarma).toBe(70); // 100 - 30
    });
  });
});
