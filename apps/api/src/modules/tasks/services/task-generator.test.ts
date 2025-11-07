import { ObjectId } from "mongodb";
import type { TaskSchedule } from "../domain/task-schedule";
import type { ScheduleRepository } from "../repositories/schedule.repository";
import type { TaskRepository } from "../repositories/task.repository";
import { TaskGeneratorService } from "./task-generator.service";

describe("TaskGeneratorService", () => {
  let taskGenerator: TaskGeneratorService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  let mockScheduleRepository: jest.Mocked<ScheduleRepository>;

  beforeEach(() => {
    mockTaskRepository = {
      findTaskByScheduleAndDate: jest.fn(),
      findIncompleteTasksBySchedule: jest.fn(),
      deleteTasksByIds: jest.fn(),
      createTask: jest.fn(),
    } as any;

    mockScheduleRepository = {
      findActiveSchedules: jest.fn(),
      updateLastGeneratedDate: jest.fn(),
    } as any;

    taskGenerator = new TaskGeneratorService(
      mockTaskRepository,
      mockScheduleRepository,
    );
  });

  describe("generateMissedTasksOnStartup", () => {
    it("should generate tasks for missed days on startup", async () => {
      // Mock schedule with start date 3 days ago
      const mockSchedule: TaskSchedule = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        familyId: new ObjectId("507f1f77bcf86cd799439012"),
        name: "Daily Chores",
        description: "Complete daily chores",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
          weeklyInterval: 1, // Every week
          startDate: new Date("2025-11-03"), // 3 days ago
        },
        timeOfDay: "09:00",
        lastGeneratedDate: new Date("2025-11-04"), // Last generated 2 days ago
        createdBy: new ObjectId("507f1f77bcf86cd799439013"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        mockSchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue(null); // No existing tasks
      mockTaskRepository.createTask.mockResolvedValue({
        _id: new ObjectId("507f1f77bcf86cd799439014"),
        familyId: new ObjectId("507f1f77bcf86cd799439012"),
        name: "Daily Chores",
        assignment: { type: "unassigned" as const },
        dueDate: new Date("2025-11-05T09:00:00.000Z"),
        createdBy: new ObjectId("507f1f77bcf86cd799439013"),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await taskGenerator.generateMissedTasksOnStartup();

      // Should check for tasks on the missed day (2025-11-05)
      expect(mockTaskRepository.findTaskByScheduleAndDate).toHaveBeenCalledWith(
        expect.any(ObjectId),
        expect.any(Date),
      );

      // Should create a missed task
      expect(mockTaskRepository.createTask).toHaveBeenCalled();

      // Should update last generated date to today
      expect(
        mockScheduleRepository.updateLastGeneratedDate,
      ).toHaveBeenCalledWith(expect.any(ObjectId), expect.any(Date));
    });

    it("should handle case where no schedules exist", async () => {
      mockScheduleRepository.findActiveSchedules.mockResolvedValue([]);

      await taskGenerator.generateMissedTasksOnStartup();

      expect(mockTaskRepository.createTask).not.toHaveBeenCalled();
      expect(
        mockScheduleRepository.updateLastGeneratedDate,
      ).not.toHaveBeenCalled();
    });

    it("should skip schedules that already have tasks for missed days", async () => {
      const mockSchedule: TaskSchedule = {
        _id: new ObjectId("507f1f77bcf86cd799439011"),
        familyId: new ObjectId("507f1f77bcf86cd799439012"),
        name: "Daily Chores",
        description: "Complete daily chores",
        assignment: { type: "unassigned" as const },
        schedule: {
          daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
          weeklyInterval: 1, // Every week
          startDate: new Date("2025-11-03"),
        },
        timeOfDay: "09:00",
        lastGeneratedDate: new Date("2025-11-04"),
        createdBy: new ObjectId("507f1f77bcf86cd799439013"),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        mockSchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue({
        _id: "existingTask",
        name: "Daily Chores",
      } as any); // Task already exists

      await taskGenerator.generateMissedTasksOnStartup();

      // Should not create a new task since one already exists
      expect(mockTaskRepository.createTask).not.toHaveBeenCalled();

      // Should still update last generated date
      expect(
        mockScheduleRepository.updateLastGeneratedDate,
      ).toHaveBeenCalledWith(expect.any(ObjectId), expect.any(Date));
    });
  });
});
