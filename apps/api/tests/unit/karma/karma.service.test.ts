import { ObjectId } from "mongodb";
import { HttpError } from "../../../src/lib/http-error";
import { fromObjectId } from "../../../src/lib/objectid-utils";
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

// Mock karma events to avoid realtime dependencies
jest.mock("../../../src/modules/karma/events/karma-events", () => ({
  emitKarmaAwarded: jest.fn(),
  emitKarmaDeducted: jest.fn(),
}));

// Mock user-utils to avoid mongo client initialization
jest.mock("../../../src/lib/user-utils", () => ({
  getUserName: jest.fn().mockResolvedValue("Test User"),
}));

// Mock notifications module
jest.mock("../../../src/modules/notifications", () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendNotification: jest.fn().mockResolvedValue({ success: true }),
    isVapidConfigured: jest.fn().mockReturnValue(false),
  })),
  createKarmaGrantNotification: jest.fn().mockReturnValue({
    title: "Karma Received!",
    body: "You received karma",
  }),
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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const userObjectId = new ObjectId(userId);
      const karmaEvent: KarmaEvent = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
        amount: 25,
        source: "task_completion",
        description: "Completed task",
        metadata: { taskId: "123" },
        createdAt: new Date(),
      };

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
        role: FamilyRole.Child,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockKarmaRepository.createKarmaEvent.mockResolvedValue(karmaEvent);
      mockKarmaRepository.upsertMemberKarma.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
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
      const createArgs = mockKarmaRepository.createKarmaEvent.mock.calls[0][0];
      expect(createArgs.amount).toBe(25);
      expect(createArgs.source).toBe("task_completion");
      expect(createArgs.description).toBe("Completed task");
      expect(createArgs.metadata).toEqual({ taskId: "123" });
      expect(createArgs.familyId.toHexString()).toBe(familyId);
      expect(createArgs.userId.toHexString()).toBe(userId);

      const upsertArgs = mockKarmaRepository.upsertMemberKarma.mock.calls[0];
      expect(upsertArgs[0].toHexString()).toBe(familyId);
      expect(upsertArgs[1].toHexString()).toBe(userId);
      expect(upsertArgs[2]).toBe(25);
      expect(result).toEqual(karmaEvent);
    });

    it("should throw forbidden error if user is not a family member", async () => {
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());

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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const requestingUserId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const userObjectId = new ObjectId(userId);
      const requestingObjectId = new ObjectId(requestingUserId);
      const memberKarma: MemberKarma = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
        totalKarma: 150,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: requestingObjectId,
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
      const [familArg, userArg] =
        mockKarmaRepository.findMemberKarma.mock.calls[0];
      expect(familArg.toHexString()).toBe(familyId);
      expect(userArg.toHexString()).toBe(userId);
      expect(result).toEqual(memberKarma);
    });

    it("should return zero karma for new member", async () => {
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const requestingUserId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const requestingObjectId = new ObjectId(requestingUserId);

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: requestingObjectId,
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

      expect(result.familyId.toHexString()).toEqual(familyId);
      expect(result.userId.toHexString()).toEqual(userId);
      expect(result.totalKarma).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it("should throw forbidden error if requesting user is not a family member", async () => {
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const requestingUserId = fromObjectId(new ObjectId());

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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const requestingUserId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const userObjectId = new ObjectId(userId);
      const requestingObjectId = new ObjectId(requestingUserId);
      const events: KarmaEvent[] = [
        {
          _id: new ObjectId(),
          familyId: familyObjectId,
          userId: userObjectId,
          amount: 25,
          source: "task_completion",
          description: "Event 1",
          createdAt: new Date("2024-01-15"),
        },
        {
          _id: new ObjectId(),
          familyId: familyObjectId,
          userId: userObjectId,
          amount: 50,
          source: "manual_grant",
          description: "Event 2",
          createdAt: new Date("2024-01-14"),
        },
      ];

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: requestingObjectId,
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
      const findCalls = mockKarmaRepository.findKarmaEvents.mock.calls[0];
      expect(findCalls[0].toHexString()).toBe(familyId);
      expect(findCalls[1].toHexString()).toBe(userId);
      expect(findCalls[2]).toBe(11);
      expect(findCalls[3]).toBeUndefined();
      expect(result.events).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeUndefined();
    });

    it("should detect when there are more events", async () => {
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const requestingUserId = fromObjectId(new ObjectId());
      const events: KarmaEvent[] = Array.from({ length: 11 }, (_, i) => ({
        _id: new ObjectId(),
        familyId: new ObjectId(familyId),
        userId: new ObjectId(userId),
        amount: 10,
        source: "task_completion" as const,
        description: `Event ${i}`,
        createdAt: new Date(),
      }));

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId: new ObjectId(familyId),
        userId: new ObjectId(requestingUserId),
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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const requestingUserId = fromObjectId(new ObjectId());
      const cursor = new ObjectId().toString();

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId: new ObjectId(familyId),
        userId: new ObjectId(requestingUserId),
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

      const cursorCall = mockKarmaRepository.findKarmaEvents.mock.calls[0];
      expect(cursorCall[0].toHexString()).toBe(familyId);
      expect(cursorCall[1].toHexString()).toBe(userId);
      expect(cursorCall[3]).toBe(cursor);
    });

    it("should throw forbidden error if requesting user is not a family member", async () => {
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const requestingUserId = fromObjectId(new ObjectId());

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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const grantedBy = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const userObjectId = new ObjectId(userId);
      const grantedByObjectId = new ObjectId(grantedBy);
      const karmaEvent: KarmaEvent = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
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
          familyId: familyObjectId,
          userId: grantedByObjectId,
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // Recipient is a family member
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: familyObjectId,
          userId: userObjectId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        // For awardKarma call
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: familyObjectId,
          userId: userObjectId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockKarmaRepository.createKarmaEvent.mockResolvedValue(karmaEvent);
      mockKarmaRepository.upsertMemberKarma.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const grantedBy = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const userObjectId = new ObjectId(userId);
      const grantedByObjectId = new ObjectId(grantedBy);

      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: familyObjectId,
          userId: grantedByObjectId,
          role: FamilyRole.Parent,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: familyObjectId,
          userId: userObjectId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: familyObjectId,
          userId: userObjectId,
          role: FamilyRole.Child,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockKarmaRepository.createKarmaEvent.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
        amount: 50,
        source: "manual_grant",
        description: "Manual karma grant",
        metadata: { grantedBy: grantedBy.toString() },
        createdAt: new Date(),
      });

      mockKarmaRepository.upsertMemberKarma.mockResolvedValue({
        _id: new ObjectId(),
        familyId: familyObjectId,
        userId: userObjectId,
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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const grantedBy = fromObjectId(new ObjectId());

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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const grantedBy = fromObjectId(new ObjectId());

      mockMembershipRepository.findByFamilyAndUser.mockResolvedValue({
        _id: new ObjectId(),
        familyId: new ObjectId(familyId),
        userId: new ObjectId(grantedBy),
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
      const familyId = fromObjectId(new ObjectId());
      const userId = fromObjectId(new ObjectId());
      const grantedBy = fromObjectId(new ObjectId());

      // First call: check granter is a parent (success)
      // Second call: check recipient is a member (failure)
      mockMembershipRepository.findByFamilyAndUser
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          familyId: new ObjectId(familyId),
          userId: new ObjectId(grantedBy),
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
