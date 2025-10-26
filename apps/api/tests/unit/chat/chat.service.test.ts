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
  const creatorId = new ObjectId();
  const otherUserId = new ObjectId();
  const userId3 = new ObjectId();
  const chatId = new ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService(mockChatRepository as any, mockMembershipRepository as any);
  });

  describe("createDM", () => {
    it("should create a new DM and memberships when one doesn't exist", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "dm",
        title: null,
        createdBy: creatorId,
        memberIds: [creatorId, otherUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.findByMemberIds.mockResolvedValue(null);
      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([
        {
          _id: new ObjectId(),
          chatId,
          userId: creatorId,
          role: "member",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          chatId,
          userId: otherUserId,
          role: "member",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.createDM(creatorId, otherUserId);

      expect(result.chat).toEqual(mockChat);
      expect(result.isNew).toBe(true);
      // Verify sorted IDs are used for finding
      const findCall = mockChatRepository.findByMemberIds.mock.calls[0][0] as ObjectId[];
      const findIdStrings = findCall.map(id => id.toString());
      const sortedFind = [...findIdStrings].sort();
      expect(findIdStrings).toEqual(sortedFind);
      // Verify sorted IDs are used for creation
      const callArgs = mockChatRepository.create.mock.calls[0];
      expect(callArgs[0]).toBe("dm");
      expect(callArgs[1]).toEqual(creatorId);
      expect(callArgs[3]).toBeNull();
      // Check that memberIds are sorted
      const memberIds = callArgs[2] as ObjectId[];
      expect(memberIds).toHaveLength(2);
      const idStrings = memberIds.map(id => id.toString());
      const sorted = [...idStrings].sort();
      expect(idStrings).toEqual(sorted);
      expect(mockMembershipRepository.createBulk).toHaveBeenCalledWith(
        chatId,
        [
          { userId: creatorId, role: "member" },
          { userId: otherUserId, role: "member" },
        ]
      );
    });

    it("should return existing DM without creating new one", async () => {
      const existingChat: Chat = {
        _id: chatId,
        type: "dm",
        title: null,
        createdBy: creatorId,
        memberIds: [creatorId, otherUserId],
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
        new Error("Database error")
      );

      await expect(service.createDM(creatorId, otherUserId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("createGroup", () => {
    it("should create a group with creator as admin and others as members", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: "Family Planning",
        createdBy: creatorId,
        memberIds: [creatorId, otherUserId, userId3],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      const result = await service.createGroup(
        creatorId,
        [otherUserId, userId3],
        "Family Planning"
      );

      expect(result).toEqual(mockChat);
      expect(mockChatRepository.create).toHaveBeenCalledWith(
        "group",
        creatorId,
        [creatorId, otherUserId, userId3],
        "Family Planning"
      );
      expect(mockMembershipRepository.createBulk).toHaveBeenCalledWith(
        chatId,
        [
          { userId: creatorId, role: "admin" },
          { userId: otherUserId, role: "member" },
          { userId: userId3, role: "member" },
        ]
      );
    });

    it("should create a group without title", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: null,
        createdBy: creatorId,
        memberIds: [creatorId, otherUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      const result = await service.createGroup(creatorId, [otherUserId]);

      expect(result).toEqual(mockChat);
      expect(mockChatRepository.create).toHaveBeenCalledWith(
        "group",
        creatorId,
        [creatorId, otherUserId],
        null
      );
    });

    it("should handle null title by converting to null", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: null,
        createdBy: creatorId,
        memberIds: [creatorId, otherUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      await service.createGroup(creatorId, [otherUserId], null);

      expect(mockChatRepository.create).toHaveBeenCalledWith(
        "group",
        creatorId,
        [creatorId, otherUserId],
        null
      );
    });

    it("should create group with single additional member", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: "Pair Group",
        createdBy: creatorId,
        memberIds: [creatorId, otherUserId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      const result = await service.createGroup(
        creatorId,
        [otherUserId],
        "Pair Group"
      );

      expect(result).toEqual(mockChat);
      expect(mockChatRepository.create).toHaveBeenCalledWith(
        "group",
        creatorId,
        [creatorId, otherUserId],
        "Pair Group"
      );
    });

    it("should handle repository errors during creation", async () => {
      mockChatRepository.create.mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        service.createGroup(creatorId, [otherUserId], "Test Group")
      ).rejects.toThrow("Database error");
    });

    it("should include all members in correct order", async () => {
      const mockChat: Chat = {
        _id: chatId,
        type: "group",
        title: "Multi Group",
        createdBy: creatorId,
        memberIds: [creatorId, otherUserId, userId3],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockChatRepository.create.mockResolvedValue(mockChat);
      mockMembershipRepository.createBulk.mockResolvedValue([]);

      await service.createGroup(
        creatorId,
        [otherUserId, userId3],
        "Multi Group"
      );

      // Verify members were passed in correct order: creator first, then others
      const callArgs = mockChatRepository.create.mock.calls[0];
      expect(callArgs[2]).toEqual([creatorId, otherUserId, userId3]);
    });
  });
});
