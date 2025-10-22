import { ObjectId } from "mongodb";
import type { Task } from "@/modules/tasks/domain/task";
import { toTaskDTO } from "@/modules/tasks/lib/task.mapper";

describe("Task Mapper", () => {
  describe("toTaskDTO", () => {
    it("should convert Task entity to DTO with all fields", () => {
      const task: Task = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        familyId: new ObjectId("507f1f77bcf86cd799439012"),
        name: "Clean kitchen",
        description: "Wipe counters and do dishes",
        dueDate: new Date("2025-01-15T10:00:00Z"),
        assignment: {
          type: "member",
          memberId: new ObjectId("507f1f77bcf86cd799439013"),
        },
        scheduleId: new ObjectId("507f1f77bcf86cd799439014"),
        completedAt: new Date("2025-01-15T11:00:00Z"),
        createdBy: new ObjectId("507f1f77bcf86cd799439015"),
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-15T11:00:00Z"),
      };

      const dto = toTaskDTO(task);

      expect(dto._id).toBe("507f1f77bcf86cd799439011");
      expect(dto.familyId).toBe("507f1f77bcf86cd799439012");
      expect(dto.name).toBe("Clean kitchen");
      expect(dto.description).toBe("Wipe counters and do dishes");
      expect(dto.dueDate).toBe("2025-01-15T10:00:00.000Z");
      expect(dto.assignment).toEqual({
        type: "member",
        memberId: new ObjectId("507f1f77bcf86cd799439013"),
      });
      expect(dto.scheduleId).toBe("507f1f77bcf86cd799439014");
      expect(dto.completedAt).toBe("2025-01-15T11:00:00.000Z");
      expect(dto.createdBy).toBe("507f1f77bcf86cd799439015");
      expect(dto.createdAt).toBe("2025-01-01T00:00:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-15T11:00:00.000Z");
    });

    it("should convert Task with minimal fields", () => {
      const task: Task = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        familyId: new ObjectId("507f1f77bcf86cd799439012"),
        name: "Simple task",
        assignment: {
          type: "unassigned",
        },
        createdBy: new ObjectId("507f1f77bcf86cd799439015"),
        createdAt: new Date("2025-01-01T00:00:00Z"),
        updatedAt: new Date("2025-01-01T00:00:00Z"),
      };

      const dto = toTaskDTO(task);

      expect(dto._id).toBe("507f1f77bcf86cd799439011");
      expect(dto.name).toBe("Simple task");
      expect(dto.description).toBeUndefined();
      expect(dto.dueDate).toBeUndefined();
      expect(dto.scheduleId).toBeUndefined();
      expect(dto.completedAt).toBeUndefined();
    });

    it("should handle role assignment", () => {
      const task: Task = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Task",
        assignment: {
          type: "role",
          role: "parent",
        },
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toTaskDTO(task);

      expect(dto.assignment).toEqual({
        type: "role",
        role: "parent",
      });
    });

    it("should convert dates to ISO strings", () => {
      const now = new Date("2025-01-15T12:30:45.123Z");
      const task: Task = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Task",
        assignment: { type: "unassigned" },
        dueDate: now,
        completedAt: now,
        createdBy: new ObjectId(),
        createdAt: now,
        updatedAt: now,
      };

      const dto = toTaskDTO(task);

      expect(dto.dueDate).toBe("2025-01-15T12:30:45.123Z");
      expect(dto.completedAt).toBe("2025-01-15T12:30:45.123Z");
      expect(dto.createdAt).toBe("2025-01-15T12:30:45.123Z");
      expect(dto.updatedAt).toBe("2025-01-15T12:30:45.123Z");
    });

    it("should handle undefined optional fields", () => {
      const task: Task = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Task",
        assignment: { type: "unassigned" },
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toTaskDTO(task);

      expect(dto.description).toBeUndefined();
      expect(dto.dueDate).toBeUndefined();
      expect(dto.scheduleId).toBeUndefined();
      expect(dto.completedAt).toBeUndefined();
    });
  });
});
