import { ObjectId } from "mongodb";
import type { ActivityEvent } from "../../../src/modules/activity-events/domain/activity-event";
import type { ActivityEventRepository } from "../../../src/modules/activity-events/repositories/activity-event.repository";
import { ActivityEventService } from "../../../src/modules/activity-events/services/activity-event.service";

// Mock logger to avoid environment variable dependencies
jest.mock("../../../src/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("ActivityEventService", () => {
  let service: ActivityEventService;
  let mockRepository: jest.Mocked<ActivityEventRepository>;

  beforeEach(() => {
    mockRepository = {
      recordEvent: jest.fn(),
      findByUserInDateRange: jest.fn(),
      ensureIndexes: jest.fn(),
    } as unknown as jest.Mocked<ActivityEventRepository>;

    service = new ActivityEventService(mockRepository);
  });

  describe("recordEvent", () => {
    it("should record an activity event with all fields", async () => {
      const userId = new ObjectId();
      const eventId = new ObjectId();
      const createdAt = new Date();

      const input = {
        userId,
        type: "TASK" as const,
        title: "Take out the trash",
        description: "Completed take out the trash",
        metadata: { karma: 10 },
      };

      const expectedEvent: ActivityEvent = {
        _id: eventId,
        userId,
        type: "TASK",
        title: "Take out the trash",
        description: "Completed take out the trash",
        metadata: { karma: 10 },
        createdAt,
      };

      mockRepository.recordEvent.mockResolvedValue(expectedEvent);

      const result = await service.recordEvent(input);

      expect(mockRepository.recordEvent).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedEvent);
    });

    it("should record an event without optional fields", async () => {
      const userId = new ObjectId();
      const eventId = new ObjectId();

      const input = {
        userId,
        type: "RECIPE" as const,
        title: "Created new recipe",
      };

      const expectedEvent: ActivityEvent = {
        _id: eventId,
        userId,
        type: "RECIPE",
        title: "Created new recipe",
        createdAt: new Date(),
      };

      mockRepository.recordEvent.mockResolvedValue(expectedEvent);

      const result = await service.recordEvent(input);

      expect(mockRepository.recordEvent).toHaveBeenCalledWith(input);
      expect(result).toEqual(expectedEvent);
    });

    it("should handle repository errors", async () => {
      const userId = new ObjectId();
      const input = {
        userId,
        type: "TASK" as const,
        title: "Test task",
      };

      const error = new Error("Database error");
      mockRepository.recordEvent.mockRejectedValue(error);

      await expect(service.recordEvent(input)).rejects.toThrow(
        "Database error",
      );
      expect(mockRepository.recordEvent).toHaveBeenCalledWith(input);
    });
  });

  describe("getEventsForUser", () => {
    it("should fetch events for a user without date filters", async () => {
      const userId = new ObjectId();
      const events: ActivityEvent[] = [
        {
          _id: new ObjectId(),
          userId,
          type: "TASK",
          title: "Task 1",
          createdAt: new Date("2024-01-15T10:00:00Z"),
        },
        {
          _id: new ObjectId(),
          userId,
          type: "RECIPE",
          title: "Recipe 1",
          createdAt: new Date("2024-01-14T10:00:00Z"),
        },
      ];

      mockRepository.findByUserInDateRange.mockResolvedValue(events);

      const result = await service.getEventsForUser(userId);

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
      );
      expect(result).toEqual(events);
    });

    it("should fetch events with start date filter", async () => {
      const userId = new ObjectId();
      const events: ActivityEvent[] = [
        {
          _id: new ObjectId(),
          userId,
          type: "TASK",
          title: "Task 1",
          createdAt: new Date("2024-01-15T10:00:00Z"),
        },
      ];

      mockRepository.findByUserInDateRange.mockResolvedValue(events);

      const result = await service.getEventsForUser(userId, "2024-01-15");

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        userId,
        "2024-01-15",
        undefined,
      );
      expect(result).toEqual(events);
    });

    it("should fetch events with end date filter", async () => {
      const userId = new ObjectId();
      const events: ActivityEvent[] = [];

      mockRepository.findByUserInDateRange.mockResolvedValue(events);

      const result = await service.getEventsForUser(
        userId,
        undefined,
        "2024-01-31",
      );

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        userId,
        undefined,
        "2024-01-31",
      );
      expect(result).toEqual(events);
    });

    it("should fetch events with date range filter", async () => {
      const userId = new ObjectId();
      const events: ActivityEvent[] = [
        {
          _id: new ObjectId(),
          userId,
          type: "DIARY",
          title: "Diary entry",
          createdAt: new Date("2024-01-20T10:00:00Z"),
        },
      ];

      mockRepository.findByUserInDateRange.mockResolvedValue(events);

      const result = await service.getEventsForUser(
        userId,
        "2024-01-01",
        "2024-01-31",
      );

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        userId,
        "2024-01-01",
        "2024-01-31",
      );
      expect(result).toEqual(events);
    });

    it("should handle repository errors", async () => {
      const userId = new ObjectId();
      const error = new Error("Database error");

      mockRepository.findByUserInDateRange.mockRejectedValue(error);

      await expect(service.getEventsForUser(userId)).rejects.toThrow(
        "Database error",
      );
      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        userId,
        undefined,
        undefined,
      );
    });
  });
});
