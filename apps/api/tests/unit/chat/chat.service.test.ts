import { fromObjectId } from "@lib/objectid-utils";
import type { Chat } from "@modules/chat/domain/chat";
import { ObjectId } from "mongodb";

// Mock logger to avoid loading env variables
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

import { ChatService } from "@modules/chat/services/chat.service";

// Mock repositories - use partial mocks for private properties
const mockChatRepository = {
  ensureIndexes: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByMemberIds: jest.fn(),
  updateMembers: jest.fn(),
  updateTimestamp: jest.fn(),
};

const mockMembershipRepository = {
  ensureIndexes: jest.fn(),
  create: jest.fn(),
  createBulk: jest.fn(),
  findByUserAndChat: jest.fn(),
  findByChat: jest.fn(),
  findByUser: jest.fn(),
  updateReadCursor: jest.fn(),
  updateRole: jest.fn(),
  delete: jest.fn(),
};

describe("Unit: ChatService", () => {
  let service: ChatService;
  const creatorObjectId = new ObjectId();
  const otherUserObjectId = new ObjectId();
  const user3ObjectId = new ObjectId();
  const chatId = new ObjectId();
  const creatorId = fromObjectId(creatorObjectId);
  const otherUserId = fromObjectId(otherUserObjectId);
  const userId3 = fromObjectId(user3ObjectId);

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService(
      mockChatRepository as any,
      mockMembershipRepository as any,
    );
  });

  describe("createDM", () => {
    it("should create a new DM and memberships when one doesn't exist", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "dm",
        title: null,
        createdBy: creatorObjectId,
        memberIds: [creatorObjectId, otherUserObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.findByMemberIds.mockResolvedValue(null);
      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([
        {
          _id: new ObjectId(),
          chatId,
          userId: creatorObjectId,
          role: "member",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          chatId,
          userId: otherUserObjectId,
          role: "member",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.createDM(creatorId, otherUserId);

      expect(result.chat).toEqual(mockChat);
      expect(result.isNew).toBe(true);
      // Verify sorted IDs are used for finding
      const findCall = mockChatRepository.findByMemberIds.mock
        .calls[0][0] as ObjectId[];
      const findIdStrings = findCall.map((id) => id.toString());
      const sortedFind = [...findIdStrings].sort();
      expect(findIdStrings).toEqual(sortedFind);
      // Verify sorted IDs are used for creation
      const callArgs = mockChatRepository.create.mock.calls[0];
      expect(callArgs[0]).toBe("dm");
      expect(callArgs[1]).toBeInstanceOf(ObjectId);
      expect(callArgs[1].toHexString()).toEqual(creatorId);
      expect(callArgs[3]).toBeNull();
      // Check that memberIds are sorted
      const memberIds = callArgs[2] as ObjectId[];
      expect(memberIds).toHaveLength(2);
      const idStrings = memberIds.map((id) => id.toString());
      const sorted = [...idStrings].sort();
      expect(idStrings).toEqual(sorted);
      expect(mockMembershipRepository.createBulk).toHaveBeenCalledWith(chatId, [
        expect.objectContaining({
          userId: expect.any(ObjectId),
          role: "member",
        }),
        expect.objectContaining({
          userId: expect.any(ObjectId),
          role: "member",
        }),
      ]);
      const bulkArgs = mockMembershipRepository.createBulk.mock.calls[0][1];
      expect(bulkArgs[0].userId.toHexString()).toBe(creatorId);
      expect(bulkArgs[1].userId.toHexString()).toBe(otherUserId);
    });

    it("should return existing DM without creating new one", async () => {
      const existingChat: Chat = {
        _id: chatId,
        type: "dm",
        title: null,
        createdBy: creatorObjectId,
        memberIds: [creatorObjectId, otherUserObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.findByMemberIds.mockResolvedValue(existingChat);

      const result = await service.createDM(creatorId, otherUserId);

      expect(result.chat).toEqual(existingChat);
      expect(result.isNew).toBe(false);
      expect(mockChatRepository.create).not.toHaveBeenCalled();
      expect(mockMembershipRepository.createBulk).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      mockChatRepository.findByMemberIds.mockRejectedValue(
        new Error("Database error"),
      );

      await expect(service.createDM(creatorId, otherUserId)).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("createGroup", () => {
    it("should create a group with creator as admin and others as members", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: "Family Planning",
        createdBy: creatorObjectId,
        memberIds: [creatorObjectId, otherUserObjectId, user3ObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      const result = await service.createGroup(
        creatorId,
        [otherUserId, userId3],
        "Family Planning",
      );

      expect(result).toEqual(mockChat);
      const createArgs = mockChatRepository.create.mock.calls[0];
      expect(createArgs[0]).toBe("group");
      expect(createArgs[1].toHexString()).toBe(creatorId);
      const memberArg = createArgs[2] as ObjectId[];
      expect(memberArg.map((id) => id.toHexString())).toEqual([
        creatorId,
        otherUserId,
        userId3,
      ]);
      expect(createArgs[3]).toBe("Family Planning");
      const bulkArgs = mockMembershipRepository.createBulk.mock.calls[0];
      expect(bulkArgs[0]).toBe(chatId);
      const bulkMembers = bulkArgs[1];
      expect(bulkMembers.map((m: any) => m.userId.toHexString())).toEqual([
        creatorId,
        otherUserId,
        userId3,
      ]);
    });

    it("should create a group without title", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: null,
        createdBy: creatorObjectId,
        memberIds: [creatorObjectId, otherUserObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      const result = await service.createGroup(creatorId, [otherUserId]);

      expect(result).toEqual(mockChat);
      const callArgs = mockChatRepository.create.mock.calls[0];
      expect(callArgs[1].toHexString()).toBe(creatorId);
      expect((callArgs[2] as ObjectId[]).map((id) => id.toHexString())).toEqual(
        [creatorId, otherUserId],
      );
      expect(callArgs[3]).toBeNull();
    });

    it("should handle null title by converting to null", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: null,
        createdBy: creatorObjectId,
        memberIds: [creatorObjectId, otherUserObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      await service.createGroup(creatorId, [otherUserId], null);

      const callArgs = mockChatRepository.create.mock.calls[0];
      expect(callArgs[1].toHexString()).toBe(creatorId);
      expect((callArgs[2] as ObjectId[]).map((id) => id.toHexString())).toEqual(
        [creatorId, otherUserId],
      );
      expect(callArgs[3]).toBeNull();
    });

    it("should create group with single additional member", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: "Pair Group",
        createdBy: creatorObjectId,
        memberIds: [creatorObjectId, otherUserObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      const result = await service.createGroup(
        creatorId,
        [otherUserId],
        "Pair Group",
      );

      expect(result).toEqual(mockChat);
      const callArgs = mockChatRepository.create.mock.calls[0];
      expect(callArgs[1].toHexString()).toBe(creatorId);
      expect((callArgs[2] as ObjectId[]).map((id) => id.toHexString())).toEqual(
        [creatorId, otherUserId],
      );
      expect(callArgs[3]).toBe("Pair Group");
    });

    it("should handle repository errors during creation", async () => {
      mockChatRepository.create.mockRejectedValue(new Error("Database error"));

      await expect(
        service.createGroup(creatorId, [otherUserId], "Test Group"),
      ).rejects.toThrow("Database error");
    });

    it("should include all members in correct order", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: "Multi Group",
        createdBy: creatorObjectId,
        memberIds: [creatorObjectId, otherUserObjectId, user3ObjectId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      await service.createGroup(
        creatorId,
        [otherUserId, userId3],
        "Multi Group",
      );

      // Verify members were passed in correct order: creator first, then others
      const callArgs = mockChatRepository.create.mock.calls[0];
      expect((callArgs[2] as ObjectId[]).map((id) => id.toHexString())).toEqual(
        [creatorId, otherUserId, userId3],
      );
    });
  });
});
