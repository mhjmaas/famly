import { ObjectId } from "mongodb";
import { fromObjectId } from "../../../src/lib/objectid-utils";
import type { ActivityEvent } from "../../../src/modules/activity-events/domain/activity-event";
import type { ActivityEventRepository } from "../../../src/modules/activity-events/repositories/activity-event.repository";

// Mock logger to avoid environment variable dependencies
jest.mock("../../../src/lib/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock activity events to avoid realtime dependencies
jest.mock(
  "../../../src/modules/activity-events/events/activity-events",
  () => ({
    emitActivityCreated: jest.fn(),
  }),
);

import { ActivityEventService } from "../../../src/modules/activity-events/services/activity-event.service";

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
    it("records an activity event with all fields", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);
      const eventId = new ObjectId();
      const createdAt = new Date();

      const input = {
        userId: userIdString,
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

      expect(mockRepository.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(ObjectId),
          type: "TASK",
          title: "Take out the trash",
          description: "Completed take out the trash",
          metadata: { karma: 10 },
        }),
      );
      const repoInput = mockRepository.recordEvent.mock.calls[0][0];
      expect(repoInput.userId.toHexString()).toBe(userIdString);
      expect(result).toEqual(expectedEvent);
    });

    it("records an event without optional fields", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);
      const eventId = new ObjectId();

      const input = {
        userId: userIdString,
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

      expect(mockRepository.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(ObjectId),
          type: "RECIPE",
          title: "Created new recipe",
        }),
      );
      const repoInput = mockRepository.recordEvent.mock.calls[0][0];
      expect(repoInput.userId.toHexString()).toBe(userIdString);
      expect(result).toEqual(expectedEvent);
    });

    it("propagates repository errors", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);
      const input = {
        userId: userIdString,
        type: "TASK" as const,
        title: "Test task",
      };

      const error = new Error("Database error");
      mockRepository.recordEvent.mockRejectedValue(error);

      await expect(service.recordEvent(input)).rejects.toThrow(
        "Database error",
      );
      expect(mockRepository.recordEvent).toHaveBeenCalledWith(
        expect.objectContaining({ userId: expect.any(ObjectId) }),
      );
      const repoInput = mockRepository.recordEvent.mock.calls[0][0];
      expect(repoInput.userId.toHexString()).toBe(userIdString);
    });
  });

  describe("getEventsForUser", () => {
    it("fetches events without date filters", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);
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

      const result = await service.getEventsForUser(userIdString);

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        expect.any(ObjectId),
        undefined,
        undefined,
      );
      const repoArg = mockRepository.findByUserInDateRange.mock.calls[0][0];
      expect(repoArg.toHexString()).toBe(userIdString);
      expect(result).toEqual(events);
    });

    it("fetches events with a start date", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);
      const events: ActivityEvent[] = [];

      mockRepository.findByUserInDateRange.mockResolvedValue(events);

      const result = await service.getEventsForUser(userIdString, "2024-01-15");

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        expect.any(ObjectId),
        "2024-01-15",
        undefined,
      );
      const repoArg = mockRepository.findByUserInDateRange.mock.calls[0][0];
      expect(repoArg.toHexString()).toBe(userIdString);
      expect(result).toEqual(events);
    });

    it("fetches events with an end date", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);

      mockRepository.findByUserInDateRange.mockResolvedValue([]);

      await service.getEventsForUser(userIdString, undefined, "2024-01-31");

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        expect.any(ObjectId),
        undefined,
        "2024-01-31",
      );
      const repoArg = mockRepository.findByUserInDateRange.mock.calls[0][0];
      expect(repoArg.toHexString()).toBe(userIdString);
    });

    it("fetches events within a date range", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);
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
        userIdString,
        "2024-01-01",
        "2024-01-31",
      );

      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        expect.any(ObjectId),
        "2024-01-01",
        "2024-01-31",
      );
      const repoArg = mockRepository.findByUserInDateRange.mock.calls[0][0];
      expect(repoArg.toHexString()).toBe(userIdString);
      expect(result).toEqual(events);
    });

    it("propagates repository errors", async () => {
      const userId = new ObjectId();
      const userIdString = fromObjectId(userId);
      const error = new Error("Database error");

      mockRepository.findByUserInDateRange.mockRejectedValue(error);

      await expect(service.getEventsForUser(userIdString)).rejects.toThrow(
        "Database error",
      );
      expect(mockRepository.findByUserInDateRange).toHaveBeenCalledWith(
        expect.any(ObjectId),
        undefined,
        undefined,
      );
      const repoArg = mockRepository.findByUserInDateRange.mock.calls[0][0];
      expect(repoArg.toHexString()).toBe(userIdString);
    });
  });
});
