import { ObjectId } from "mongodb";
import type { ActivityEvent } from "@/modules/activity-events/domain/activity-event";
import type { ActivityEventRepository } from "@/modules/activity-events/repositories/activity-event.repository";
import { FamilyRole } from "@/modules/family/domain/family";
import type { FamilyMembershipRepository } from "@/modules/family/repositories/family-membership.repository";

// Mock logger to avoid environment variable requirements
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock realtime module to avoid better-auth dependency
jest.mock("@modules/realtime", () => ({
  emitToUserRooms: jest.fn(),
}));

// Mock activity events to avoid realtime dependencies
jest.mock("@modules/activity-events/events/activity-events", () => ({
  emitActivityCreated: jest.fn(),
}));

// Must be imported after mocking dependencies
import { ActivityEventService } from "@/modules/activity-events/services/activity-event.service";

describe("ActivityEventService", () => {
  let service: ActivityEventService;
  let mockActivityRepository: jest.Mocked<ActivityEventRepository>;
  let mockMembershipRepository: jest.Mocked<FamilyMembershipRepository>;

  beforeEach(() => {
    mockActivityRepository = {
      recordEvent: jest.fn(),
      findByUserInDateRange: jest.fn(),
    } as unknown as jest.Mocked<ActivityEventRepository>;

    mockMembershipRepository = {
      findByFamilyAndUser: jest.fn(),
      findByUser: jest.fn(),
      findByFamily: jest.fn(),
      findByFamilyIds: jest.fn(),
      insertMembership: jest.fn(),
      updateMemberRole: jest.fn(),
      deleteMembership: jest.fn(),
      ensureIndexes: jest.fn(),
    } as unknown as jest.Mocked<FamilyMembershipRepository>;

    service = new ActivityEventService(
      mockActivityRepository,
      mockMembershipRepository,
    );
  });

  describe("getEventsForFamilyMember", () => {
    const requestingUserId = "507f1f77bcf86cd799439001";
    const familyId = "507f1f77bcf86cd799439002";
    const memberId = "507f1f77bcf86cd799439003";
    const startDate = "2025-01-01";
    const endDate = "2025-01-31";

    const mockActivityEvents: ActivityEvent[] = [
      {
        _id: new ObjectId("507f1f77bcf86cd799439010"),
        userId: new ObjectId(memberId),
        type: "TASK",
        title: "Complete homework",
        description: "Completed Complete homework",
        metadata: { karma: 10 },
        createdAt: new Date("2025-01-15T10:00:00Z"),
      },
      {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        userId: new ObjectId(memberId),
        type: "TASK",
        title: "Do chores",
        description: "Created Do chores",
        createdAt: new Date("2025-01-10T14:00:00Z"),
      },
    ];

    it("should return activity events for family member when authorized", async () => {
      // Mock both users as members of the same family
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(requestingUserId),
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(memberId),
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockActivityRepository.findByUserInDateRange.mockResolvedValue(
        mockActivityEvents,
      );

      const result = await service.getEventsForFamilyMember(
        requestingUserId,
        familyId,
        memberId,
        startDate,
        endDate,
      );

      expect(result).toEqual(mockActivityEvents);
      expect(mockMembershipRepository.findByFamilyAndUser).toHaveBeenCalledWith(
        familyId,
        requestingUserId,
      );
      expect(mockMembershipRepository.findByFamilyAndUser).toHaveBeenCalledWith(
        familyId,
        memberId,
      );
      expect(mockActivityRepository.findByUserInDateRange).toHaveBeenCalledWith(
        expect.any(Object),
        startDate,
        endDate,
      );
    });

    it("should throw forbidden error when requesting user is not a family member", async () => {
      mockMembershipRepository.findByFamilyAndUser.mockResolvedValueOnce(null);

      await expect(
        service.getEventsForFamilyMember(
          requestingUserId,
          familyId,
          memberId,
          startDate,
          endDate,
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "You are not a member of this family",
          statusCode: 403,
        }),
      );
    });

    it("should throw not found error when target member is not in family", async () => {
      // Requesting user is a member
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(requestingUserId),
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // Target member is not a member
        .mockResolvedValueOnce(null);

      await expect(
        service.getEventsForFamilyMember(
          requestingUserId,
          familyId,
          memberId,
          startDate,
          endDate,
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Family member not found",
          statusCode: 404,
        }),
      );
    });

    it("should throw internal error when membership repository is not available", async () => {
      const serviceWithoutRepo = new ActivityEventService(
        mockActivityRepository,
      );

      await expect(
        serviceWithoutRepo.getEventsForFamilyMember(
          requestingUserId,
          familyId,
          memberId,
          startDate,
          endDate,
        ),
      ).rejects.toThrow(
        expect.objectContaining({
          message: "Family membership repository not configured",
          statusCode: 500,
        }),
      );
    });

    it("should validate all object IDs", async () => {
      const invalidUserId = "not-an-id";

      await expect(
        service.getEventsForFamilyMember(
          invalidUserId,
          familyId,
          memberId,
          startDate,
          endDate,
        ),
      ).rejects.toThrow();
    });

    it("should handle empty event results", async () => {
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(requestingUserId),
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(memberId),
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockActivityRepository.findByUserInDateRange.mockResolvedValue([]);

      const result = await service.getEventsForFamilyMember(
        requestingUserId,
        familyId,
        memberId,
        startDate,
        endDate,
      );

      expect(result).toEqual([]);
    });

    it("should pass date filters correctly to repository", async () => {
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(requestingUserId),
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(memberId),
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockActivityRepository.findByUserInDateRange.mockResolvedValue([]);

      await service.getEventsForFamilyMember(
        requestingUserId,
        familyId,
        memberId,
        startDate,
        endDate,
      );

      const callArgs =
        mockActivityRepository.findByUserInDateRange.mock.calls[0];
      expect(callArgs[1]).toBe(startDate);
      expect(callArgs[2]).toBe(endDate);
    });

    it("should work with child role as well", async () => {
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(requestingUserId),
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(memberId),
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockActivityRepository.findByUserInDateRange.mockResolvedValue(
        mockActivityEvents,
      );

      const result = await service.getEventsForFamilyMember(
        requestingUserId,
        familyId,
        memberId,
      );

      expect(result).toEqual(mockActivityEvents);
    });
  });
});
