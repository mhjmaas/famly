import { ObjectId } from "mongodb";
import { toMembershipDTO } from "@modules/chat/lib/membership.mapper";
import type { Membership } from "@modules/chat/domain/membership";

describe("Membership Mapper", () => {
  describe("toMembershipDTO", () => {
    it("should convert Membership entity to MembershipDTO with all fields", () => {
      const membershipId = new ObjectId();
      const chatId = new ObjectId();
      const userId = new ObjectId();
      const now = new Date();

      const membership: Membership = {
        _id: membershipId,
        chatId,
        userId,
        role: "admin",
        createdAt: now,
        updatedAt: now,
      };

      const dto = toMembershipDTO(membership);

      expect(dto._id).toBe(membershipId.toString());
      expect(dto.chatId).toBe(chatId.toString());
      expect(dto.userId).toBe(userId.toString());
      expect(dto.role).toBe("admin");
      expect(dto.createdAt).toBe(now.toISOString());
      expect(dto.updatedAt).toBe(now.toISOString());
    });

    it("should include optional lastReadMessageId field when present", () => {
      const lastReadMessageId = new ObjectId();

      const membership: Membership = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        userId: new ObjectId(),
        role: "member",
        lastReadMessageId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toMembershipDTO(membership);

      expect(dto.lastReadMessageId).toBe(lastReadMessageId.toString());
    });

    it("should not include optional lastReadMessageId field when undefined", () => {
      const membership: Membership = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        userId: new ObjectId(),
        role: "member",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toMembershipDTO(membership);

      expect(dto.lastReadMessageId).toBeUndefined();
    });

    it("should convert all ObjectIds to strings", () => {
      const membershipId = new ObjectId();
      const chatId = new ObjectId();
      const userId = new ObjectId();

      const membership: Membership = {
        _id: membershipId,
        chatId,
        userId,
        role: "member",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toMembershipDTO(membership);

      expect(typeof dto._id).toBe("string");
      expect(typeof dto.chatId).toBe("string");
      expect(typeof dto.userId).toBe("string");
    });

    it("should convert Date objects to ISO8601 strings", () => {
      const createdAt = new Date("2025-01-15T10:30:00.000Z");
      const updatedAt = new Date("2025-01-15T11:00:00.000Z");

      const membership: Membership = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        userId: new ObjectId(),
        role: "admin",
        createdAt,
        updatedAt,
      };

      const dto = toMembershipDTO(membership);

      expect(dto.createdAt).toBe("2025-01-15T10:30:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-15T11:00:00.000Z");
    });

    it("should handle both admin and member roles", () => {
      const adminMembership: Membership = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        userId: new ObjectId(),
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const memberMembership: Membership = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        userId: new ObjectId(),
        role: "member",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const adminDTO = toMembershipDTO(adminMembership);
      const memberDTO = toMembershipDTO(memberMembership);

      expect(adminDTO.role).toBe("admin");
      expect(memberDTO.role).toBe("member");
    });

    it("should handle membership with lastReadMessageId", () => {
      const lastReadMessageId = new ObjectId();

      const membership: Membership = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        userId: new ObjectId(),
        role: "member",
        lastReadMessageId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toMembershipDTO(membership);

      expect(typeof dto.lastReadMessageId).toBe("string");
      expect(dto.lastReadMessageId).toBe(lastReadMessageId.toString());
    });
  });
});
