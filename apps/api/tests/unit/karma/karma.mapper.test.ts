import { ObjectId } from "mongodb";
import type {
  KarmaEvent,
  MemberKarma,
} from "../../../src/modules/karma/domain/karma";
import {
  toKarmaEventDTO,
  toMemberKarmaDTO,
} from "../../../src/modules/karma/lib/karma.mapper";

describe("Karma Mapper", () => {
  describe("toMemberKarmaDTO", () => {
    it("should map MemberKarma to MemberKarmaDTO", () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-15T12:30:00Z");

      const memberKarma: MemberKarma = {
        _id: new ObjectId(),
        familyId,
        userId,
        totalKarma: 150,
        createdAt,
        updatedAt,
      };

      const dto = toMemberKarmaDTO(memberKarma);

      expect(dto).toEqual({
        familyId: familyId.toString(),
        userId: userId.toString(),
        totalKarma: 150,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
    });

    it("should handle zero karma", () => {
      const memberKarma: MemberKarma = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        userId: new ObjectId(),
        totalKarma: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toMemberKarmaDTO(memberKarma);

      expect(dto.totalKarma).toBe(0);
    });
  });

  describe("toKarmaEventDTO", () => {
    it("should map KarmaEvent to KarmaEventDTO with task_completion source", () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const eventId = new ObjectId();
      const createdAt = new Date("2024-01-15T14:00:00Z");

      const karmaEvent: KarmaEvent = {
        _id: eventId,
        familyId,
        userId,
        amount: 25,
        source: "task_completion",
        description: 'Completed task "Clean room"',
        metadata: {
          taskId: "507f1f77bcf86cd799439011",
        },
        createdAt,
      };

      const dto = toKarmaEventDTO(karmaEvent);

      expect(dto).toEqual({
        id: eventId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        amount: 25,
        source: "task_completion",
        description: 'Completed task "Clean room"',
        metadata: {
          taskId: "507f1f77bcf86cd799439011",
        },
        createdAt: createdAt.toISOString(),
      });
    });

    it("should map KarmaEvent to KarmaEventDTO with manual_grant source", () => {
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const eventId = new ObjectId();
      const grantedBy = new ObjectId();
      const createdAt = new Date("2024-01-15T14:00:00Z");

      const karmaEvent: KarmaEvent = {
        _id: eventId,
        familyId,
        userId,
        amount: 50,
        source: "manual_grant",
        description: "Manual karma grant",
        metadata: {
          grantedBy: grantedBy.toString(),
        },
        createdAt,
      };

      const dto = toKarmaEventDTO(karmaEvent);

      expect(dto).toEqual({
        id: eventId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        amount: 50,
        source: "manual_grant",
        description: "Manual karma grant",
        metadata: {
          grantedBy: grantedBy.toString(),
        },
        createdAt: createdAt.toISOString(),
      });
    });

    it("should handle events without metadata", () => {
      const karmaEvent: KarmaEvent = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        userId: new ObjectId(),
        amount: 10,
        source: "task_completion",
        description: "Test event",
        createdAt: new Date(),
      };

      const dto = toKarmaEventDTO(karmaEvent);

      expect(dto.metadata).toBeUndefined();
    });

    it("should handle events with empty metadata", () => {
      const karmaEvent: KarmaEvent = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        userId: new ObjectId(),
        amount: 10,
        source: "manual_grant",
        description: "Test event",
        metadata: {},
        createdAt: new Date(),
      };

      const dto = toKarmaEventDTO(karmaEvent);

      expect(dto.metadata).toEqual({});
    });
  });
});
