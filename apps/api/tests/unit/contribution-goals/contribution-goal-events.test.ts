// Mock dependencies first (before imports)
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@lib/objectid-utils", () => ({
  toObjectId: jest.fn((id) => {
    // Mock implementation that validates the ObjectId conversion
    if (!id || typeof id !== "string") {
      throw new Error("toObjectId requires a string");
    }
    // In the mock, we return a marker object that proves conversion happened
    return { _bsontype: "ObjectId", id };
  }),
}));

jest.mock("@infra/mongo/client", () => ({
  getDb: jest.fn(),
}));

jest.mock("@modules/realtime", () => ({
  emitToUserRooms: jest.fn(),
}));

jest.mock("@modules/contribution-goals/lib/contribution-goal.mapper", () => ({
  toContributionGoalDTO: jest.fn((goal) => ({ ...goal })),
  toDeductionDTO: jest.fn((deduction) => ({ ...deduction })),
}));

import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId } from "@lib/objectid-utils";
import type {
  ContributionGoal,
  Deduction,
} from "@modules/contribution-goals/domain/contribution-goal";
import {
  emitContributionGoalAwarded,
  emitContributionGoalDeducted,
  emitContributionGoalUpdated,
} from "@modules/contribution-goals/events/contribution-goal-events";
import { emitToUserRooms } from "@modules/realtime";
import { ObjectId } from "mongodb";

describe("Contribution Goal Realtime Events (Bug Fix: ObjectId Conversion)", () => {
  let mockDb: any;
  let mockCollection: any;
  const mockFamilyId = new ObjectId();
  const mockMemberId = new ObjectId();
  const mockUserId1 = new ObjectId();
  const mockUserId2 = new ObjectId();
  const mockGoalId = new ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock collection with find and toArray
    mockCollection = {
      find: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
    };

    // Setup mock database
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    (getDb as jest.Mock).mockReturnValue(mockDb);
  });

  describe("getFamilyMemberIds helper - ObjectId conversion", () => {
    it("should convert familyId string to ObjectId before querying family_memberships", async () => {
      const familyMemberships = [
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId1,
          role: "Parent",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId2,
          role: "Child",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(familyMemberships);

      // Create a goal with ObjectId familyId
      const goal: ContributionGoal = {
        _id: mockGoalId,
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: new Date(),
        title: "Test Goal",
        description: "Test",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const deduction: Deduction = {
        _id: new ObjectId(),
        amount: 10,
        reason: "Test deduction",
        deductedBy: mockUserId1,
        createdAt: new Date(),
      };

      // Emit a deduction event (this will trigger getFamilyMemberIds)
      await emitContributionGoalDeducted(goal, deduction);

      // Verify toObjectId was called with the string familyId
      expect(toObjectId).toHaveBeenCalledWith(
        mockFamilyId.toString(),
        "familyId",
      );

      // Verify the collection.find was called (which indicates the query was executed)
      expect(mockCollection.find).toHaveBeenCalled();

      // Verify that the find was called with the converted ObjectId, not a string
      const findCall = (mockCollection.find as jest.Mock).mock.calls[0][0];
      // The mock toObjectId returns { _bsontype: "ObjectId", id: ... }
      expect(findCall.familyId).toEqual({
        _bsontype: "ObjectId",
        id: mockFamilyId.toString(),
      });

      // Verify both family members are emitted to
      expect(emitToUserRooms).toHaveBeenCalledWith(
        "contribution_goal.deducted",
        [mockUserId1.toString(), mockUserId2.toString()],
        expect.any(Object),
      );
    });

    it("should emit to all family members when deduction is added", async () => {
      const familyMemberships = [
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId1,
          role: "Parent",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId2,
          role: "Child",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(familyMemberships);

      const goal: ContributionGoal = {
        _id: mockGoalId,
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: new Date(),
        title: "Keep Room Clean",
        description: "Test",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const deduction: Deduction = {
        _id: new ObjectId(),
        amount: 20,
        reason: "Messy bedroom",
        deductedBy: mockUserId1,
        createdAt: new Date(),
      };

      await emitContributionGoalDeducted(goal, deduction);

      // Verify emitToUserRooms was called with both family member IDs
      expect(emitToUserRooms).toHaveBeenCalledWith(
        "contribution_goal.deducted",
        [mockUserId1.toString(), mockUserId2.toString()],
        expect.objectContaining({
          goalId: mockGoalId.toString(),
          familyId: mockFamilyId.toString(),
          deduction: expect.objectContaining({
            amount: 20,
            reason: "Messy bedroom",
          }),
        }),
      );
    });

    it("should emit to all family members when karma is awarded", async () => {
      const familyMemberships = [
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId1,
          role: "Parent",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId2,
          role: "Child",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(familyMemberships);

      const goal: ContributionGoal = {
        _id: mockGoalId,
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: new Date(),
        title: "Keep Room Clean",
        description: "Test",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emitContributionGoalAwarded(goal, 80);

      // Verify both family members are notified
      expect(emitToUserRooms).toHaveBeenCalledWith(
        "contribution_goal.awarded",
        [mockUserId1.toString(), mockUserId2.toString()],
        expect.objectContaining({
          goalId: mockGoalId.toString(),
          karmaAwarded: 80,
        }),
      );
    });

    it("should emit to all family members when goal is updated", async () => {
      const familyMemberships = [
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId1,
          role: "Parent",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          familyId: mockFamilyId,
          userId: mockUserId2,
          role: "Child",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(familyMemberships);

      const goal: ContributionGoal = {
        _id: mockGoalId,
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: new Date(),
        title: "Keep Room Clean",
        description: "Test",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await emitContributionGoalUpdated(goal, "CREATED");

      // Verify both family members are notified
      expect(emitToUserRooms).toHaveBeenCalledWith(
        "contribution_goal.updated",
        [mockUserId1.toString(), mockUserId2.toString()],
        expect.objectContaining({
          goalId: mockGoalId.toString(),
          action: "CREATED",
        }),
      );
    });

    it("should handle empty family member list gracefully", async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const goal: ContributionGoal = {
        _id: mockGoalId,
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: new Date(),
        title: "Test Goal",
        description: "Test",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const deduction: Deduction = {
        _id: new ObjectId(),
        amount: 10,
        reason: "Test",
        deductedBy: mockUserId1,
        createdAt: new Date(),
      };

      await emitContributionGoalDeducted(goal, deduction);

      // Should log debug message about no members to notify
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining("no family members to notify"),
      );

      // Should NOT emit to user rooms if no members found
      expect(emitToUserRooms).not.toHaveBeenCalled();
    });

    it("should handle errors in event emission gracefully", async () => {
      const error = new Error("Database error");
      mockCollection.toArray.mockRejectedValue(error);

      const goal: ContributionGoal = {
        _id: mockGoalId,
        familyId: mockFamilyId,
        memberId: mockMemberId,
        weekStartDate: new Date(),
        title: "Test Goal",
        description: "Test",
        maxKarma: 100,
        deductions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const deduction: Deduction = {
        _id: new ObjectId(),
        amount: 10,
        reason: "Test",
        deductedBy: mockUserId1,
        createdAt: new Date(),
      };

      // Should not throw
      await emitContributionGoalDeducted(goal, deduction);

      // Should log error
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to emit"),
        expect.any(String),
      );
    });
  });
});
