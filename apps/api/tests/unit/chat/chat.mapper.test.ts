import type { Chat } from "@modules/chat/domain/chat";
import { toChatDTO } from "@modules/chat/lib/chat.mapper";
import { ObjectId } from "mongodb";

describe("Chat Mapper", () => {
  describe("toChatDTO", () => {
    it("should convert Chat entity to ChatDTO with all fields", () => {
      const chatId = new ObjectId();
      const creatorId = new ObjectId();
      const memberId1 = new ObjectId();
      const memberId2 = new ObjectId();
      const now = new Date();

      const chat: Chat = {
        _id: chatId,
        type: "group",
        title: "Family Planning",
        createdBy: creatorId,
        memberIds: [creatorId, memberId1, memberId2],
        createdAt: now,
        updatedAt: now,
      };

      const dto = toChatDTO(chat);

      expect(dto._id).toBe(chatId.toString());
      expect(dto.type).toBe("group");
      expect(dto.title).toBe("Family Planning");
      expect(dto.createdBy).toBe(creatorId.toString());
      expect(dto.memberIds).toEqual([
        creatorId.toString(),
        memberId1.toString(),
        memberId2.toString(),
      ]);
      expect(dto.createdAt).toBe(now.toISOString());
      expect(dto.updatedAt).toBe(now.toISOString());
    });

    it("should handle DM chats with null title", () => {
      const chatId = new ObjectId();
      const user1Id = new ObjectId();
      const user2Id = new ObjectId();
      const now = new Date();

      const chat: Chat = {
        _id: chatId,
        type: "dm",
        title: null,
        createdBy: user1Id,
        memberIds: [user1Id, user2Id],
        createdAt: now,
        updatedAt: now,
      };

      const dto = toChatDTO(chat);

      expect(dto.type).toBe("dm");
      expect(dto.title).toBeNull();
      expect(dto.memberIds).toHaveLength(2);
    });

    it("should convert all ObjectIds to strings", () => {
      const chatId = new ObjectId();
      const creatorId = new ObjectId();
      const memberId = new ObjectId();

      const chat: Chat = {
        _id: chatId,
        type: "dm",
        title: null,
        createdBy: creatorId,
        memberIds: [creatorId, memberId],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toChatDTO(chat);

      expect(typeof dto._id).toBe("string");
      expect(typeof dto.createdBy).toBe("string");
      expect(dto.memberIds.every((id) => typeof id === "string")).toBe(true);
    });

    it("should convert Date objects to ISO8601 strings", () => {
      const now = new Date("2025-01-15T10:30:00.000Z");

      const chat: Chat = {
        _id: new ObjectId(),
        type: "group",
        title: "Test",
        createdBy: new ObjectId(),
        memberIds: [new ObjectId()],
        createdAt: now,
        updatedAt: now,
      };

      const dto = toChatDTO(chat);

      expect(dto.createdAt).toBe("2025-01-15T10:30:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-15T10:30:00.000Z");
    });

    it("should handle chats with multiple members", () => {
      const memberIds = [
        new ObjectId(),
        new ObjectId(),
        new ObjectId(),
        new ObjectId(),
      ];
      const chat: Chat = {
        _id: new ObjectId(),
        type: "group",
        title: "Large Group",
        createdBy: memberIds[0],
        memberIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toChatDTO(chat);

      expect(dto.memberIds).toHaveLength(4);
      expect(dto.memberIds.every((id) => typeof id === "string")).toBe(true);
    });
  });
});
