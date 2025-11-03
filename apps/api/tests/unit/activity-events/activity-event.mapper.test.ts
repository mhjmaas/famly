import { ObjectId } from "mongodb";
import type { ActivityEvent } from "../../../src/modules/activity-events/domain/activity-event";
import { toActivityEventDTO } from "../../../src/modules/activity-events/lib/activity-event.mapper";

describe("ActivityEvent Mapper", () => {
  describe("toActivityEventDTO", () => {
    it("should convert ActivityEvent to ActivityEventDTO with all fields", () => {
      const eventId = new ObjectId();
      const userId = new ObjectId();
      const createdAt = new Date("2024-01-15T10:30:00.000Z");

      const event: ActivityEvent = {
        _id: eventId,
        userId,
        type: "TASK",
        title: "Take out the trash",
        description: "Completed take out the trash",
        metadata: {
          karma: 10,
        },
        createdAt,
      };

      const dto = toActivityEventDTO(event);

      expect(dto.id).toBe(eventId.toString());
      expect(dto.userId).toBe(userId.toString());
      expect(dto.type).toBe("TASK");
      expect(dto.title).toBe("Take out the trash");
      expect(dto.description).toBe("Completed take out the trash");
      expect(dto.metadata).toEqual({ karma: 10 });
      expect(dto.createdAt).toBe("2024-01-15T10:30:00.000Z");
    });

    it("should handle missing optional description", () => {
      const eventId = new ObjectId();
      const userId = new ObjectId();
      const createdAt = new Date("2024-01-15T10:30:00.000Z");

      const event: ActivityEvent = {
        _id: eventId,
        userId,
        type: "RECIPE",
        title: "Created new recipe",
        createdAt,
      };

      const dto = toActivityEventDTO(event);

      expect(dto.description).toBeNull();
    });

    it("should handle missing optional metadata", () => {
      const eventId = new ObjectId();
      const userId = new ObjectId();
      const createdAt = new Date("2024-01-15T10:30:00.000Z");

      const event: ActivityEvent = {
        _id: eventId,
        userId,
        type: "DIARY",
        title: "Added diary entry",
        createdAt,
      };

      const dto = toActivityEventDTO(event);

      expect(dto.metadata).toBeNull();
    });

    it("should convert all event types correctly", () => {
      const eventTypes: Array<ActivityEvent["type"]> = [
        "TASK",
        "SHOPPING_LIST",
        "KARMA",
        "RECIPE",
        "DIARY",
        "FAMILY_DIARY",
        "REWARD",
      ];

      for (const type of eventTypes) {
        const event: ActivityEvent = {
          _id: new ObjectId(),
          userId: new ObjectId(),
          type,
          title: `Test ${type}`,
          createdAt: new Date(),
        };

        const dto = toActivityEventDTO(event);
        expect(dto.type).toBe(type);
      }
    });

    it("should convert ObjectIds to strings", () => {
      const eventId = new ObjectId("507f1f77bcf86cd799439011");
      const userId = new ObjectId("507f1f77bcf86cd799439012");

      const event: ActivityEvent = {
        _id: eventId,
        userId,
        type: "TASK",
        title: "Test task",
        createdAt: new Date(),
      };

      const dto = toActivityEventDTO(event);

      expect(dto.id).toBe("507f1f77bcf86cd799439011");
      expect(dto.userId).toBe("507f1f77bcf86cd799439012");
      expect(typeof dto.id).toBe("string");
      expect(typeof dto.userId).toBe("string");
    });

    it("should convert createdAt Date to ISO string", () => {
      const createdAt = new Date("2024-01-15T14:45:30.123Z");

      const event: ActivityEvent = {
        _id: new ObjectId(),
        userId: new ObjectId(),
        type: "TASK",
        title: "Test task",
        createdAt,
      };

      const dto = toActivityEventDTO(event);

      expect(dto.createdAt).toBe("2024-01-15T14:45:30.123Z");
      expect(typeof dto.createdAt).toBe("string");
    });

    it("should not modify original event object", () => {
      const event: ActivityEvent = {
        _id: new ObjectId(),
        userId: new ObjectId(),
        type: "TASK",
        title: "Original title",
        description: "Original description",
        createdAt: new Date("2024-01-15T10:00:00Z"),
      };

      const originalId = event._id.toHexString();
      const originalTitle = event.title;

      toActivityEventDTO(event);

      expect(event._id.toHexString()).toBe(originalId);
      expect(event.title).toBe(originalTitle);
    });
  });
});
