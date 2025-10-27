import { ObjectId } from "mongodb";
import { HttpError } from "../../../src/lib/http-error";
import { FamilyRole } from "../../../src/modules/family/domain/family";
import type { FamilyMembershipRepository } from "../../../src/modules/family/repositories/family-membership.repository";
import type {
  KarmaEvent,
  MemberKarma,
} from "../../../src/modules/karma/domain/karma";
import type { KarmaRepository } from "../../../src/modules/karma/repositories/karma.repository";

// Mock logger
jest.mock("../../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

import { KarmaService } from "../../../src/modules/karma/services/karma.service";

describe("KarmaService", () => {
  let karmaService: KarmaService;
  let mockKarmaRepository: jest.Mocked<KarmaRepository>;
  let mockMembershipRepository: jest.Mocked<FamilyMembershipRepository>;

  beforeEach(() => {
    mockKarmaRepository = {
      ensureIndexes: jest.fn(),
      createKarmaEvent: jest.fn(),
      upsertMemberKarma: jest.fn(),
      findMemberKarma: jest.fn(),
      findKarmaEvents: jest.fn(),
    } as unknown as jest.Mocked<KarmaRepository>;

    mockMembershipRepository = {
      findByFamilyAndUser: jest.fn(),
    } as unknown as jest.Mocked<FamilyMembershipRepository>;

    karmaService = new KarmaService(
      mockKarmaRepository,
      mockMembershipRepository,
    );
  });

  describe("awardKarma", () => {
    it("should award karma to a family member", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const karmaEvent: KarmaEvent = {
        _id: new ObjectId(),
        familyId,
        userId,
        amount: 25,
        source: "task_completion",
        description: "Completed task",
        metadata: { taskId: "123" },
        createdAt: new Date(),
      };

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        role: FamilyRole.Child,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKarmaRepository.createKarmaEvent.mockResolvedValue(karmaEvent);
      mockKarmaRepository.upsertMemberKarma.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 25,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await karmaService.awardKarma({
        familyId,
        userId,
        amount: 25,
        source: "task_completion",
        description: "Completed task",
        metadata: { taskId: "123" },
      });

      expect(mockMembershipRepository.findByFamilyAndUser).toHaveBeenCalledWith(
        familyId,
        userId,
      );
      expect(mockKarmaRepository.createKarmaEvent).toHaveBeenCalledWith({
        familyId,
        userId,
        amount: 25,
        source: "task_completion",
        description: "Completed task",
        metadata: { taskId: "123" },
      });
      expect(mockKarmaRepository.upsertMemberKarma).toHaveBeenCalledWith(
        familyId,
        userId,
        25,
      );
      expect(result).toEqual(karmaEvent);
    });

    it("should throw forbidden error if user is not a family member", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue(null);

      await expect(
        karmaService.awardKarma({
          familyId,
          userId,
          amount: 25,
          source: "task_completion",
          description: "Completed task",
        }),
      ).rejects.toThrow(HttpError);

      await expect(
        karmaService.awardKarma({
          familyId,
          userId,
          amount: 25,
          source: "task_completion",
          description: "Completed task",
        }),
      ).rejects.toThrow("User is not a member of this family");

      expect(mockKarmaRepository.createKarmaEvent).not.toHaveBeenCalled();
      expect(mockKarmaRepository.upsertMemberKarma).not.toHaveBeenCalled();
    });
  });

  describe("getMemberKarma", () => {
    it("should return member karma for authorized user", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const requestingUserId = new ObjectId();
      const memberKarma: MemberKarma = {
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId: requestingUserId,
        role: FamilyRole.Parent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKarmaRepository.findMemberKarma.mockResolvedValue(memberKarma);

      const result = await karmaService.getMemberKarma(
        familyId,
        userId,
        requestingUserId,
      );

      expect(mockMembershipRepository.findByFamilyAndUser).toHaveBeenCalledWith(
        familyId,
        requestingUserId,
      );
      expect(mockKarmaRepository.findMemberKarma).toHaveBeenCalledWith(
        familyId,
        userId,
      );
      expect(result).toEqual(memberKarma);
    });

    it("should return zero karma for new member", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const requestingUserId = new ObjectId();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId: requestingUserId,
        role: FamilyRole.Parent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKarmaRepository.findMemberKarma.mockResolvedValue(null);

      const result = await karmaService.getMemberKarma(
        familyId,
        userId,
        requestingUserId,
      );

      expect(result.familyId).toEqual(familyId);
      expect(result.userId).toEqual(userId);
      expect(result.totalKarma).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should throw forbidden error if requesting user is not a family member", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const requestingUserId = new ObjectId();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue(null);

      await expect(
        karmaService.getMemberKarma(familyId, userId, requestingUserId),
      ).rejects.toThrow(HttpError);

      await expect(
        karmaService.getMemberKarma(familyId, userId, requestingUserId),
      ).rejects.toThrow("User is not a member of this family");

      expect(mockKarmaRepository.findMemberKarma).not.toHaveBeenCalled();
    });
  });

  describe("getKarmaHistory", () => {
    it("should return paginated karma history for authorized user", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const requestingUserId = new ObjectId();
      const events: KarmaEvent[] = [
        {
          _id: new ObjectId(),
          familyId,
          userId,
          amount: 25,
          source: "task_completion",
          description: "Event 1",
          createdAt: new Date("2024-01-15"),
        },
        {
          _id: new ObjectId(),
          familyId,
          userId,
          amount: 50,
          source: "manual_grant",
          description: "Event 2",
          createdAt: new Date("2024-01-14"),
        },
      ];

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId: requestingUserId,
        role: FamilyRole.Parent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKarmaRepository.findKarmaEvents.mockResolvedValue(events);

      const result = await karmaService.getKarmaHistory(
        familyId,
        userId,
        requestingUserId,
        10,
      );

      expect(mockMembershipRepository.findByFamilyAndUser).toHaveBeenCalledWith(
        familyId,
        requestingUserId,
      );
      expect(mockKarmaRepository.findKarmaEvents).toHaveBeenCalledWith(
        familyId,
        userId,
        11, // limit + 1 to check for more
        undefined,
      );
      expect(result.events).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeUndefined();
    });

    it("should detect when there are more events", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const requestingUserId = new ObjectId();
      const events: KarmaEvent[] = Array.from({ length: 11 }, (_, i) => ({
        _id: new ObjectId(),
        familyId,
        userId,
        amount: 10,
        source: "task_completion" as const,
        description: `Event ${i}`,
        createdAt: new Date(),
      }));

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId: requestingUserId,
        role: FamilyRole.Parent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKarmaRepository.findKarmaEvents.mockResolvedValue(events);

      const result = await karmaService.getKarmaHistory(
        familyId,
        userId,
        requestingUserId,
        10,
      );

      expect(result.events).toHaveLength(10);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBe(events[9]._id.toString());
    });

    it("should support cursor-based pagination", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const requestingUserId = new ObjectId();
      const cursor = new ObjectId().toString();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId: requestingUserId,
        role: FamilyRole.Parent,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKarmaRepository.findKarmaEvents.mockResolvedValue([]);

      await karmaService.getKarmaHistory(
        familyId,
        userId,
        requestingUserId,
        10,
        cursor,
      );

      expect(mockKarmaRepository.findKarmaEvents).toHaveBeenCalledWith(
        familyId,
        userId,
        11,
        cursor,
      );
    });

    it("should throw forbidden error if requesting user is not a family member", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const requestingUserId = new ObjectId();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue(null);

      await expect(
        karmaService.getKarmaHistory(familyId, userId, requestingUserId, 10),
      ).rejects.toThrow(HttpError);

      await expect(
        karmaService.getKarmaHistory(familyId, userId, requestingUserId, 10),
      ).rejects.toThrow("User is not a member of this family");

      expect(mockKarmaRepository.findKarmaEvents).not.toHaveBeenCalled();
    });
  });

  describe("grantKarma", () => {
    it("should grant karma when granter is a parent", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const grantedBy = new ObjectId();
      const karmaEvent: KarmaEvent = {
        _id: new ObjectId(),
        familyId,
        userId,
        amount: 50,
        source: "manual_grant",
        description: "Manual karma grant",
        metadata: { grantedBy: grantedBy.toString() },
        createdAt: new Date(),
      };

      // Granter is a parent
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId,
          userId: grantedBy,
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // Recipient is a family member
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId,
          userId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // For awardKarma call
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId,
          userId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockKarmaRepository.createKarmaEvent.mockResolvedValue(karmaEvent);
      mockKarmaRepository.upsertMemberKarma.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await karmaService.grantKarma(
        familyId,
        userId,
        50,
        "Great job!",
        grantedBy,
      );

      expect(result.source).toBe("manual_grant");
      expect(result.amount).toBe(50);
      expect(result.metadata?.grantedBy).toBe(grantedBy.toString());
    });

    it("should use default description if not provided", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const grantedBy = new ObjectId();

      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId,
          userId: grantedBy,
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId,
          userId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId,
          userId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockKarmaRepository.createKarmaEvent.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        amount: 50,
        source: "manual_grant",
        description: "Manual karma grant",
        metadata: { grantedBy: grantedBy.toString() },
        createdAt: new Date(),
      });

      mockKarmaRepository.upsertMemberKarma.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await karmaService.grantKarma(
        familyId,
        userId,
        50,
        undefined,
        grantedBy,
      );

      expect(result.description).toBe("Manual karma grant");
    });

    it("should throw forbidden error if granter is not a family member", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const grantedBy = new ObjectId();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue(null);

      await expect(
        karmaService.grantKarma(familyId, userId, 50, "Great!", grantedBy),
      ).rejects.toThrow(HttpError);

      await expect(
        karmaService.grantKarma(familyId, userId, 50, "Great!", grantedBy),
      ).rejects.toThrow("User is not a member of this family");

      expect(mockKarmaRepository.createKarmaEvent).not.toHaveBeenCalled();
    });

    it("should throw forbidden error if granter is not a parent", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const grantedBy = new ObjectId();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        userId: grantedBy,
        role: FamilyRole.Child, // Not a parent
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        karmaService.grantKarma(familyId, userId, 50, "Great!", grantedBy),
      ).rejects.toThrow(HttpError);

      await expect(
        karmaService.grantKarma(familyId, userId, 50, "Great!", grantedBy),
      ).rejects.toThrow("Only parents can grant karma");

      expect(mockKarmaRepository.createKarmaEvent).not.toHaveBeenCalled();
    });

    it("should throw bad request if recipient is not a family member", async () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const grantedBy = new ObjectId();

      // First call: check granter is a parent (success)
      // Second call: check recipient is a member (failure)
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId,
          userId: grantedBy,
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce(null); // Recipient not found

      await expect(
        karmaService.grantKarma(familyId, userId, 50, "Great!", grantedBy),
      ).rejects.toThrow(HttpError);

      // Note: The test now expects correct behavior from the code
      // The error thrown will be "Recipient is not a member of this family"
      expect(mockKarmaRepository.createKarmaEvent).not.toHaveBeenCalled();
    });
  });
});
