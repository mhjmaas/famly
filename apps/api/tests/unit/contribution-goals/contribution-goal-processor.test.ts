// Mock dependencies first (before imports)
jest.mock("@config/env", () => ({
  getEnv: () => ({
    NODE_ENV: "test",
    PORT: "3001",
    CLIENT_URL: "http://localhost:3000",
    MONGODB_URI: "mongodb://localhost:27017/test",
    BETTER_AUTH_SECRET: "12345678901234567890123456789012",
    BETTER_AUTH_URL: "http://localhost:3001",
    VAPID_PRIVATE_KEY: "test",
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test",
    VAPID_EMAIL: "test@example.com",
    MINIO_ENDPOINT: "localhost",
    MINIO_ROOT_USER: "minio",
    MINIO_ROOT_PASSWORD: "miniopass",
    MINIO_BUCKET: "test",
  }),
}));

jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the entire notifications module to avoid environment variable requirements
jest.mock("@modules/notifications", () => ({
  sendToUser: jest.fn(),
  createContributionGoalAwardedNotification: jest.fn(),
  createContributionGoalZeroKarmaNotification: jest.fn(),
}));

jest.mock(
  "@modules/contribution-goals/events/contribution-goal-events",
  () => ({
    emitContributionGoalAwarded: jest.fn(),
    emitContributionGoalDeducted: jest.fn(),
    emitContributionGoalUpdated: jest.fn(),
  }),
);

import { logger } from "@lib/logger";
import type { ActivityEventService } from "@modules/activity-events";
import type { ContributionGoal } from "@modules/contribution-goals/domain/contribution-goal";
import type { ContributionGoalRepository } from "@modules/contribution-goals/repositories/contribution-goal.repository";
import { ContributionGoalProcessorService } from "@modules/contribution-goals/services/contribution-goal-processor.service";
import type { KarmaService } from "@modules/karma";
import * as notifications from "@modules/notifications";
import { ObjectId } from "mongodb";

describe("ContributionGoalProcessorService", () => {
  let processorService: ContributionGoalProcessorService;
  let mockContributionGoalRepository: jest.Mocked<ContributionGoalRepository>;
  let mockKarmaService: jest.Mocked<KarmaService>;
  let mockActivityEventService: jest.Mocked<ActivityEventService>;

  const mockWeekStartDate = new Date("2025-11-23T18:00:00.000Z");
  const mockFamilyId = new ObjectId();
  const mockMemberId = new ObjectId();

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repository
    mockContributionGoalRepository = {
      findActiveGoalsForWeek: jest.fn(),
      deleteById: jest.fn(),
      ensureIndexes: jest.fn(),
      create: jest.fn(),
      findByMemberAndWeek: jest.fn(),
      updateById: jest.fn(),
      addDeduction: jest.fn(),
    } as unknown as jest.Mocked<ContributionGoalRepository>;

    // Create mock karma service
    mockKarmaService = {
      awardKarma: jest.fn(),
    } as unknown as jest.Mocked<KarmaService>;

    // Create mock activity event service
    mockActivityEventService = {
      recordEvent: jest.fn(),
    } as unknown as jest.Mocked<ActivityEventService>;

    // Create processor service
    processorService = new ContributionGoalProcessorService(
      mockContributionGoalRepository,
      mockKarmaService,
      mockActivityEventService,
    );
  });

  describe("processWeeklyGoals", () => {
    it("should process goals with remaining karma successfully", async () => {
      const mockGoal: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: mockWeekStartDate,
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 100,
        deductions: [
          {
            _id: new ObjectId(),
            amount: 20,
            reason: "Forgot to do dishes",
            deductedBy: mockMemberId,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContributionGoalRepository.findActiveGoalsForWeek.mockResolvedValue([
        mockGoal,
      ]);
      mockKarmaService.awardKarma.mockResolvedValue({} as any);
      mockActivityEventService.recordEvent.mockResolvedValue({} as any);
      mockContributionGoalRepository.deleteById.mockResolvedValue(true);

      const mockNotification = {
        title: "Weekly Goal Completed! 🎯",
        body: 'You earned 80 karma from "Complete 5 chores"',
        icon: expect.any(String),
        badge: expect.any(String),
        data: { type: "contribution_goal_awarded", url: expect.any(String) },
      };

      jest
        .spyOn(notifications, "createContributionGoalAwardedNotification")
        .mockReturnValue(mockNotification);
      jest.spyOn(notifications, "sendToUser").mockResolvedValue(true);

      await processorService.processWeeklyGoals(mockWeekStartDate);

      // Verify karma was awarded with correct amount (100 - 20 = 80)
      expect(mockKarmaService.awardKarma).toHaveBeenCalledWith(
        {
          familyId: mockFamilyId.toString(),
          userId: mockMemberId.toString(),
          amount: 80,
          source: "contribution_goal_weekly",
          description: `Weekly contribution goal achieved: ${mockGoal.title}`,
          metadata: {},
        },
        false,
      );

      // Verify activity event was recorded
      expect(mockActivityEventService.recordEvent).toHaveBeenCalledWith({
        userId: mockMemberId.toString(),
        type: "CONTRIBUTION_GOAL",
        detail: "AWARDED",
        title: `Weekly goal completed: ${mockGoal.title}`,
        description: "Earned 80 karma from contribution goal",
        metadata: {
          karma: 80,
        },
      });

      // Verify notification was sent
      expect(notifications.sendToUser).toHaveBeenCalledWith(
        mockMemberId.toString(),
        mockNotification,
      );

      // Verify goal was deleted
      expect(mockContributionGoalRepository.deleteById).toHaveBeenCalledWith(
        mockGoal._id.toString(),
      );

      // Verify logger was called
      expect(logger.info).toHaveBeenCalledWith(
        "Weekly contribution goal processing completed",
        {
          totalGoals: 1,
          successCount: 1,
          errorCount: 0,
        },
      );
    });

    it("should process goals with zero karma successfully", async () => {
      const mockGoal: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: mockWeekStartDate,
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 100,
        deductions: [
          {
            _id: new ObjectId(),
            amount: 100,
            reason: "Did not complete any chores",
            deductedBy: mockMemberId,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContributionGoalRepository.findActiveGoalsForWeek.mockResolvedValue([
        mockGoal,
      ]);
      mockActivityEventService.recordEvent.mockResolvedValue({} as any);
      mockContributionGoalRepository.deleteById.mockResolvedValue(true);

      const mockNotification = {
        title: "Weekly Goal Ended",
        body: `Goal ${mockGoal.title} completed with no karma earned`,
        icon: expect.any(String),
        badge: expect.any(String),
        data: { type: "contribution_goal_zero_karma", url: expect.any(String) },
      };

      jest
        .spyOn(notifications, "createContributionGoalZeroKarmaNotification")
        .mockReturnValue(mockNotification);
      jest.spyOn(notifications, "sendToUser").mockResolvedValue(true);

      await processorService.processWeeklyGoals(mockWeekStartDate);

      // Verify karma service was NOT called
      expect(mockKarmaService.awardKarma).not.toHaveBeenCalled();

      // Verify activity event was recorded with zero karma
      expect(mockActivityEventService.recordEvent).toHaveBeenCalledWith({
        userId: mockMemberId.toString(),
        type: "CONTRIBUTION_GOAL",
        detail: "AWARDED",
        title: `Weekly goal completed: ${mockGoal.title}`,
        description: "No karma earned - all potential karma was deducted",
        metadata: {
          karma: 0,
        },
      });

      // Verify zero karma notification was sent
      expect(notifications.sendToUser).toHaveBeenCalledWith(
        mockMemberId.toString(),
        mockNotification,
      );

      // Verify goal was deleted
      expect(mockContributionGoalRepository.deleteById).toHaveBeenCalledWith(
        mockGoal._id.toString(),
      );
    });

    it("should handle multiple goals successfully", async () => {
      const mockGoal1: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: mockWeekStartDate,
        title: "Goal 1",
        description: "Description 1",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal2: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: new ObjectId(),
        weekStartDate: mockWeekStartDate,
        title: "Goal 2",
        description: "Description 2",
        maxKarma: 200,
        deductions: [
          {
            _id: new ObjectId(),
            amount: 50,
            reason: "Deduction",
            deductedBy: mockMemberId,
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContributionGoalRepository.findActiveGoalsForWeek.mockResolvedValue([
        mockGoal1,
        mockGoal2,
      ]);
      mockKarmaService.awardKarma.mockResolvedValue({} as any);
      mockActivityEventService.recordEvent.mockResolvedValue({} as any);
      mockContributionGoalRepository.deleteById.mockResolvedValue(true);

      const mockNotification = {
        title: "Weekly Goal Completed! 🎯",
        body: "You earned karma",
        icon: expect.any(String),
        badge: expect.any(String),
        data: { type: "contribution_goal_awarded", url: expect.any(String) },
      };

      jest
        .spyOn(notifications, "createContributionGoalAwardedNotification")
        .mockReturnValue(mockNotification);
      jest.spyOn(notifications, "sendToUser").mockResolvedValue(true);

      await processorService.processWeeklyGoals(mockWeekStartDate);

      // Verify both goals were processed
      expect(mockKarmaService.awardKarma).toHaveBeenCalledTimes(2);
      expect(mockActivityEventService.recordEvent).toHaveBeenCalledTimes(2);
      expect(mockContributionGoalRepository.deleteById).toHaveBeenCalledTimes(
        2,
      );

      // Verify logger was called with correct counts
      expect(logger.info).toHaveBeenCalledWith(
        "Weekly contribution goal processing completed",
        {
          totalGoals: 2,
          successCount: 2,
          errorCount: 0,
        },
      );
    });

    it("should continue processing if one goal fails", async () => {
      const mockGoal1: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: mockWeekStartDate,
        title: "Goal 1",
        description: "Description 1",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockGoal2: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: new ObjectId(),
        weekStartDate: mockWeekStartDate,
        title: "Goal 2",
        description: "Description 2",
        maxKarma: 200,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContributionGoalRepository.findActiveGoalsForWeek.mockResolvedValue([
        mockGoal1,
        mockGoal2,
      ]);

      // First goal succeeds
      mockKarmaService.awardKarma
        .mockResolvedValueOnce({} as any)
        // Second goal fails
        .mockRejectedValueOnce(new Error("Karma service error"));

      mockActivityEventService.recordEvent.mockResolvedValue({} as any);
      mockContributionGoalRepository.deleteById.mockResolvedValue(true);

      const mockNotification = {
        title: "Weekly Goal Completed! 🎯",
        body: "You earned karma",
        icon: expect.any(String),
        badge: expect.any(String),
        data: { type: "contribution_goal_awarded", url: expect.any(String) },
      };

      jest
        .spyOn(notifications, "createContributionGoalAwardedNotification")
        .mockReturnValue(mockNotification);
      jest.spyOn(notifications, "sendToUser").mockResolvedValue(true);

      await processorService.processWeeklyGoals(mockWeekStartDate);

      // Verify both goals were attempted
      expect(mockKarmaService.awardKarma).toHaveBeenCalledTimes(2);

      // Verify logger was called with correct counts (1 success, 1 error)
      expect(logger.info).toHaveBeenCalledWith(
        "Weekly contribution goal processing completed",
        {
          totalGoals: 2,
          successCount: 1,
          errorCount: 1,
        },
      );

      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to process contribution goal",
        expect.objectContaining({
          goalId: mockGoal2._id.toString(),
          memberId: mockGoal2.memberId.toString(),
        }),
      );
    });

    it("should continue processing if notification fails", async () => {
      const mockGoal: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: mockWeekStartDate,
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContributionGoalRepository.findActiveGoalsForWeek.mockResolvedValue([
        mockGoal,
      ]);
      mockKarmaService.awardKarma.mockResolvedValue({} as any);
      mockActivityEventService.recordEvent.mockResolvedValue({} as any);
      mockContributionGoalRepository.deleteById.mockResolvedValue(true);

      const mockNotification = {
        title: "Weekly Goal Completed! 🎯",
        body: "You earned karma",
        icon: expect.any(String),
        badge: expect.any(String),
        data: { type: "contribution_goal_awarded", url: expect.any(String) },
      };

      jest
        .spyOn(notifications, "createContributionGoalAwardedNotification")
        .mockReturnValue(mockNotification);
      jest
        .spyOn(notifications, "sendToUser")
        .mockRejectedValue(new Error("Notification service error"));

      await processorService.processWeeklyGoals(mockWeekStartDate);

      // Verify processing continued despite notification failure
      expect(mockKarmaService.awardKarma).toHaveBeenCalled();
      expect(mockActivityEventService.recordEvent).toHaveBeenCalled();
      expect(mockContributionGoalRepository.deleteById).toHaveBeenCalled();

      // Verify notification error was logged
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to send contribution goal notification",
        expect.objectContaining({
          goalId: mockGoal._id.toString(),
          memberId: mockGoal.memberId.toString(),
        }),
      );

      // Verify overall processing succeeded
      expect(logger.info).toHaveBeenCalledWith(
        "Weekly contribution goal processing completed",
        {
          totalGoals: 1,
          successCount: 1,
          errorCount: 0,
        },
      );
    });

    it("should return early if no goals found", async () => {
      mockContributionGoalRepository.findActiveGoalsForWeek.mockResolvedValue(
        [],
      );

      await processorService.processWeeklyGoals(mockWeekStartDate);

      // Verify no processing occurred
      expect(mockKarmaService.awardKarma).not.toHaveBeenCalled();
      expect(mockActivityEventService.recordEvent).not.toHaveBeenCalled();
      expect(mockContributionGoalRepository.deleteById).not.toHaveBeenCalled();

      // Verify logger was called
      expect(logger.info).toHaveBeenCalledWith(
        "No active contribution goals to process for this week",
      );
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockContributionGoalRepository.findActiveGoalsForWeek.mockRejectedValue(
        repositoryError,
      );

      await expect(
        processorService.processWeeklyGoals(mockWeekStartDate),
      ).rejects.toThrow("Database connection failed");

      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        "Failed to process weekly contribution goals",
        { error: repositoryError },
      );
    });

    it("should work without activity event service", async () => {
      const mockGoal: ContributionGoal = {
        _id: new ObjectId(),
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: mockWeekStartDate,
        title: "Complete 5 chores",
        description: "Help around the house",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockContributionGoalRepository.findActiveGoalsForWeek.mockResolvedValue([
        mockGoal,
      ]);
      mockKarmaService.awardKarma.mockResolvedValue({} as any);
      mockContributionGoalRepository.deleteById.mockResolvedValue(true);

      const mockNotification = {
        title: "Weekly Goal Completed! 🎯",
        body: "You earned karma",
        icon: expect.any(String),
        badge: expect.any(String),
        data: { type: "contribution_goal_awarded", url: expect.any(String) },
      };

      jest
        .spyOn(notifications, "createContributionGoalAwardedNotification")
        .mockReturnValue(mockNotification);
      jest.spyOn(notifications, "sendToUser").mockResolvedValue(true);

      // Create processor without activity event service
      const processorWithoutActivityEvents =
        new ContributionGoalProcessorService(
          mockContributionGoalRepository,
          mockKarmaService,
          undefined,
        );

      await processorWithoutActivityEvents.processWeeklyGoals(
        mockWeekStartDate,
      );

      // Verify karma was awarded
      expect(mockKarmaService.awardKarma).toHaveBeenCalled();

      // Verify activity event was NOT recorded
      expect(mockActivityEventService.recordEvent).not.toHaveBeenCalled();

      // Verify goal was deleted
      expect(mockContributionGoalRepository.deleteById).toHaveBeenCalled();
    });
  });
});
