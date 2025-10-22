import { ObjectId } from "mongodb";
import type { TaskSchedule } from "@/modules/tasks/domain/task-schedule";
import { toTaskScheduleDTO } from "@/modules/tasks/lib/task-schedule.mapper";

describe("Task Schedule Mapper", () => {
  describe("toTaskScheduleDTO", () => {
    it("should convert TaskSchedule entity to DTO with all fields", () => {
      const schedule: TaskSchedule = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        familyId: new ObjectId("507f1f77bcf86cd799439012"),
        name: "Weekly cleaning",
        description: "Clean the house",
        assignment: {
          type: "role",
          role: "child",
        },
        schedule: {
          daysOfWeek: [1, 3, 5],
          weeklyInterval: 2,
          startDate: new Date("2025-01-01T00:00:00Z"),
          endDate: new Date("2025-12-31T00:00:00Z"),
        },
        timeOfDay: "09:00",
        createdBy: new ObjectId("507f1f77bcf86cd799439015"),
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
        lastGeneratedDate: new Date("2025-01-15T00:00:00Z"),
      };

      const dto = toTaskScheduleDTO(schedule);

      expect(dto._id).toBe("507f1f77bcf86cd799439011");
      expect(dto.familyId).toBe("507f1f77bcf86cd799439012");
      expect(dto.name).toBe("Weekly cleaning");
      expect(dto.description).toBe("Clean the house");
      expect(dto.assignment).toEqual({
        type: "role",
        role: "child",
      });
      expect(dto.schedule).toEqual({
        daysOfWeek: [1, 3, 5],
        weeklyInterval: 2,
        startDate: new Date("2025-01-01T00:00:00Z"),
        endDate: new Date("2025-12-31T00:00:00Z"),
      });
      expect(dto.timeOfDay).toBe("09:00");
      expect(dto.createdBy).toBe("507f1f77bcf86cd799439015");
      expect(dto.createdAt).toBe("2025-01-01T00:00:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-01T00:00:00.000Z");
      expect(dto.lastGeneratedDate).toBe("2025-01-15T00:00:00.000Z");
    });

    it("should convert TaskSchedule with minimal fields", () => {
      const schedule: TaskSchedule = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        familyId: new ObjectId("507f1f77bcf86cd799439012"),
        name: "Simple schedule",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0],
          weeklyInterval: 1,
          startDate: new Date("2025-01-01T00:00:00Z"),
        },
        createdBy: new ObjectId("507f1f77bcf86cd799439015"),
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };

      const dto = toTaskScheduleDTO(schedule);

      expect(dto.name).toBe("Simple schedule");
      expect(dto.description).toBeUndefined();
      expect(dto.schedule.endDate).toBeUndefined();
      expect(dto.timeOfDay).toBeUndefined();
      expect(dto.lastGeneratedDate).toBeUndefined();
    });

    it("should handle member assignment", () => {
      const schedule: TaskSchedule = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Schedule",
        assignment: {
          type: "member",
          memberId: new ObjectId("507f1f77bcf86cd799439013"),
        },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date(),
        },
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toTaskScheduleDTO(schedule);

      expect(dto.assignment).toEqual({
        type: "member",
        memberId: new ObjectId("507f1f77bcf86cd799439013"),
      });
    });

    it("should convert dates to ISO strings", () => {
      const now = new Date("2025-01-15T12:30:45.123Z");
      const schedule: TaskSchedule = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Schedule",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: now,
        },
        createdBy: new ObjectId(),
        createdAt: now,
        updatedAt: now,
        lastGeneratedDate: now,
      };

      const dto = toTaskScheduleDTO(schedule);

      expect(dto.createdAt).toBe("2025-01-15T12:30:45.123Z");
      expect(dto.updatedAt).toBe("2025-01-15T12:30:45.123Z");
      expect(dto.lastGeneratedDate).toBe("2025-01-15T12:30:45.123Z");
    });

    it("should handle undefined optional fields", () => {
      const schedule: TaskSchedule = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Schedule",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: new Date(),
        },
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toTaskScheduleDTO(schedule);

      expect(dto.description).toBeUndefined();
      expect(dto.schedule.endDate).toBeUndefined();
      expect(dto.timeOfDay).toBeUndefined();
      expect(dto.lastGeneratedDate).toBeUndefined();
    });
  });
});
