// Mock dependencies first (before imports)
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("cron");

jest.mock("@modules/activity-events", () => ({
  ActivityEventRepository: jest.fn(),
  ActivityEventService: jest.fn(),
}));

jest.mock("@modules/family/repositories/family-membership.repository", () => ({
  FamilyMembershipRepository: jest.fn(),
}));

jest.mock("@modules/karma", () => ({
  KarmaRepository: jest.fn(),
  KarmaService: jest.fn(),
}));

jest.mock(
  "@modules/contribution-goals/repositories/contribution-goal.repository",
  () => ({
    ContributionGoalRepository: jest.fn(),
  }),
);

jest.mock(
  "@modules/contribution-goals/services/contribution-goal-processor.service",
  () => ({
    ContributionGoalProcessorService: jest.fn(),
  }),
);

jest.mock("@modules/notifications", () => ({
  sendToUser: jest.fn(),
  createContributionGoalAwardedNotification: jest.fn(),
  createContributionGoalZeroKarmaNotification: jest.fn(),
}));

jest.mock(
  "@modules/contribution-goals/events/contribution-goal-events",
  () => ({
    emitContributionGoalAwarded: jest.fn(),
  }),
);

import { logger } from "@lib/logger";
import {
  getContributionGoalSchedulerStatus,
  startContributionGoalScheduler,
  stopContributionGoalScheduler,
} from "@modules/contribution-goals/lib/contribution-goal-scheduler";
import { CronJob } from "cron";

describe("Contribution Goal Scheduler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    stopContributionGoalScheduler();
  });

  describe("startContributionGoalScheduler", () => {
    it("should start the scheduler successfully", () => {
      startContributionGoalScheduler();

      expect(getContributionGoalSchedulerStatus().running).toBe(true);
      expect(logger.info).toHaveBeenCalledWith(
        "Contribution goal scheduler started successfully",
        {
          schedule: "18:00 UTC every Sunday",
          timezone: "UTC",
        },
      );
    });

    it("should not start scheduler twice", () => {
      startContributionGoalScheduler();
      startContributionGoalScheduler();

      expect(logger.warn).toHaveBeenCalledWith(
        "Contribution goal scheduler already running",
      );
      expect(getContributionGoalSchedulerStatus().running).toBe(true);
    });

    it("should create cron job with correct schedule for Sunday 18:00 UTC", () => {
      startContributionGoalScheduler();

      // Verify CronJob was called with the correct cron expression
      // 0 0 18 * * 0 = 18:00:00 UTC every Sunday (day 0)
      expect(CronJob).toHaveBeenCalledWith(
        "0 0 18 * * 0",
        expect.any(Function),
        null, // onComplete
        true, // start immediately
        "UTC", // timezone
      );
    });
  });

  describe("stopContributionGoalScheduler", () => {
    it("should stop the scheduler successfully", () => {
      startContributionGoalScheduler();
      stopContributionGoalScheduler();

      expect(getContributionGoalSchedulerStatus().running).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(
        "Contribution goal scheduler stopped",
      );
    });

    it("should handle stopping when no scheduler is running", () => {
      // This should not throw
      expect(() => {
        stopContributionGoalScheduler();
      }).not.toThrow();
    });
  });

  describe("getContributionGoalSchedulerStatus", () => {
    it("should return running: false when scheduler is not started", () => {
      const status = getContributionGoalSchedulerStatus();

      expect(status).toEqual({ running: false });
    });

    it("should return running: true when scheduler is started", () => {
      startContributionGoalScheduler();
      const status = getContributionGoalSchedulerStatus();

      expect(status).toEqual({ running: true });
    });
  });
});
