import { ObjectId } from "mongodb";
import type { Task, TaskSchedule } from "@/modules/tasks/domain/task";
import { ScheduleRepository } from "@/modules/tasks/repositories/schedule.repository";
import { TaskRepository } from "@/modules/tasks/repositories/task.repository";
import { TaskGeneratorService } from "@/modules/tasks/services/task-generator.service";

// Mock the logger to avoid environment config issues
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock mongo client to avoid environment config issues
jest.mock("@/infra/mongo/client", () => ({
  getDb: jest.fn(),
}));

// Mock the repositories
jest.mock("@/modules/tasks/repositories/task.repository");
jest.mock("@/modules/tasks/repositories/schedule.repository");

describe("TaskGeneratorService - Cleanup Functionality", () => {
  let taskGeneratorService: TaskGeneratorService;
  let mockTaskRepository: jest.Mocked<TaskRepository>;
  let mockScheduleRepository: jest.Mocked<ScheduleRepository>;

  beforeEach(() => {
    // Create mock instances
    mockTaskRepository = new TaskRepository() as jest.Mocked<TaskRepository>;
    mockScheduleRepository =
      new ScheduleRepository() as jest.Mocked<ScheduleRepository>;

    // Create service with mocks
    taskGeneratorService = new TaskGeneratorService(
      mockTaskRepository,
      mockScheduleRepository,
    );

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe("generateTasksForDate with cleanup", () => {
    it("should delete incomplete tasks before generating a new task", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const scheduleId = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();

      // Mock schedule
      const mockSchedule: TaskSchedule = {
        _id: scheduleId,
        familyId,
        name: "Daily Task",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          weeklyInterval: 1,
          startDate: today,
        },
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock incomplete tasks
      const incompleteTasks: Task[] = [
        {
          _id: new ObjectId(),
          familyId,
          name: "Daily Task",
          dueDate: new Date(today.getTime() - 86400000), // Yesterday
          assignment: { type: "unassigned" },
          scheduleId,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          familyId,
          name: "Daily Task",
          dueDate: new Date(today.getTime() - 2 * 86400000), // 2 days ago
          assignment: { type: "unassigned" },
          scheduleId,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Setup mocks
      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        mockSchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue(null);
      mockTaskRepository.findIncompleteTasksBySchedule.mockResolvedValue(
        incompleteTasks,
      );
      mockTaskRepository.deleteTasksByIds.mockResolvedValue(2);
      mockTaskRepository.createTask.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        name: "Daily Task",

        dueDate: new Date(
          Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            23,
            0,
          ),
        ),
        assignment: { type: "unassigned" },
        scheduleId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockScheduleRepository.updateLastGeneratedDate.mockResolvedValue();

      // Execute
      await taskGeneratorService.generateTasksForDate(today);

      // Verify findIncompleteTasksBySchedule was called
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).toHaveBeenCalledWith(scheduleId);

      // Verify deleteTasksByIds was called with the incomplete task IDs
      expect(mockTaskRepository.deleteTasksByIds).toHaveBeenCalledWith([
        incompleteTasks[0]._id,
        incompleteTasks[1]._id,
      ]);

      // Verify new task was created
      expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(1);
    });

    it("should NOT call delete if there are no incomplete tasks", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const scheduleId = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();

      const mockSchedule: TaskSchedule = {
        _id: scheduleId,
        familyId,
        name: "Daily Task",

        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          weeklyInterval: 1,
          startDate: today,
        },

        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks - no incomplete tasks
      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        mockSchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue(null);
      mockTaskRepository.findIncompleteTasksBySchedule.mockResolvedValue([]);
      mockTaskRepository.createTask.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        name: "Daily Task",

        dueDate: new Date(
          Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            23,
            0,
          ),
        ),
        assignment: { type: "unassigned" },
        scheduleId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockScheduleRepository.updateLastGeneratedDate.mockResolvedValue();

      // Execute
      await taskGeneratorService.generateTasksForDate(today);

      // Verify findIncompleteTasksBySchedule was called
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).toHaveBeenCalledWith(scheduleId);

      // Verify deleteTasksByIds was NOT called
      expect(mockTaskRepository.deleteTasksByIds).not.toHaveBeenCalled();

      // Verify new task was still created
      expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(1);
    });

    it("should skip generation if task already exists for the date", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const scheduleId = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();

      const mockSchedule: TaskSchedule = {
        _id: scheduleId,
        familyId,
        name: "Daily Task",

        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          weeklyInterval: 1,
          startDate: today,
        },

        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock existing task for today
      const existingTask: Task = {
        _id: new ObjectId(),
        familyId,
        name: "Daily Task",

        dueDate: today,
        assignment: { type: "unassigned" },
        scheduleId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        mockSchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue(
        existingTask,
      );

      // Execute
      await taskGeneratorService.generateTasksForDate(today);

      // Verify cleanup was NOT attempted since task already exists
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).not.toHaveBeenCalled();
      expect(mockTaskRepository.deleteTasksByIds).not.toHaveBeenCalled();

      // Verify new task was NOT created
      expect(mockTaskRepository.createTask).not.toHaveBeenCalled();
    });
  });

  describe("generateMissedTasksOnStartup - one active task per schedule", () => {
    it("should only generate today's task, maintaining one active task per schedule", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const scheduleId = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();

      const mockSchedule: TaskSchedule = {
        _id: scheduleId,
        familyId,
        name: "Daily Task",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          weeklyInterval: 1,
          startDate: today,
        },
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const incompleteTasks: Task[] = [
        {
          _id: new ObjectId(),
          familyId,
          name: "Daily Task",
          dueDate: new Date(today.getTime() - 86400000),
          assignment: { type: "unassigned" },
          scheduleId,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Setup mocks
      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        mockSchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue(null);
      mockTaskRepository.findIncompleteTasksBySchedule.mockResolvedValue(
        incompleteTasks,
      );
      mockTaskRepository.deleteTasksByIds.mockResolvedValue(1);
      mockTaskRepository.createTask.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        name: "Daily Task",
        dueDate: new Date(
          Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            21,
            0,
          ),
        ),
        assignment: { type: "unassigned" },
        scheduleId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockScheduleRepository.updateLastGeneratedDate.mockResolvedValue();

      // Execute
      await taskGeneratorService.generateMissedTasksOnStartup();

      // Verify old incomplete task was deleted
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).toHaveBeenCalledWith(scheduleId);
      expect(mockTaskRepository.deleteTasksByIds).toHaveBeenCalledWith([
        incompleteTasks[0]._id,
      ]);

      // Verify only ONE task was created (for today)
      expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(1);

      // Verify lastGeneratedDate was updated
      expect(
        mockScheduleRepository.updateLastGeneratedDate,
      ).toHaveBeenCalledWith(scheduleId, today);
    });

    it("should not backfill missed days when system was offline", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const eightDaysAgo = new Date(today);
      eightDaysAgo.setUTCDate(eightDaysAgo.getUTCDate() - 8);

      const scheduleId = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();

      const mockSchedule: TaskSchedule = {
        _id: scheduleId,
        familyId,
        name: "Weekly Task",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
          weeklyInterval: 1, // But only once per week
          startDate: eightDaysAgo,
        },
        lastGeneratedDate: eightDaysAgo, // Last generated 8 days ago (more than 1 week)
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        mockSchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue(null);
      mockTaskRepository.findIncompleteTasksBySchedule.mockResolvedValue([]);
      mockTaskRepository.createTask.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        name: "Weekly Task",
        dueDate: new Date(),
        assignment: { type: "unassigned" },
        scheduleId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockScheduleRepository.updateLastGeneratedDate.mockResolvedValue();

      // Execute
      await taskGeneratorService.generateMissedTasksOnStartup();

      // Verify only ONE task was created (for today), NOT multiple tasks for the missed days
      // Even though 8 days have passed, we only generate for today
      expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(1);

      // Verify lastGeneratedDate was updated to today
      expect(
        mockScheduleRepository.updateLastGeneratedDate,
      ).toHaveBeenCalledWith(scheduleId, today);
    });

    it("should maintain one active task per schedule for multiple schedules", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const schedule1Id = new ObjectId();
      const schedule2Id = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();

      // Daily schedule - will generate today
      const dailySchedule: TaskSchedule = {
        _id: schedule1Id,
        familyId,
        name: "Daily Task",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day
          weeklyInterval: 1,
          startDate: today,
        },
        lastGeneratedDate: undefined, // First time
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Weekly schedule - also will generate today since it's the first time
      const weeklySchedule: TaskSchedule = {
        _id: schedule2Id,
        familyId,
        name: "Weekly Task",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Every day of week
          weeklyInterval: 1,
          startDate: today,
        },
        lastGeneratedDate: undefined, // First time
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Setup mocks
      mockScheduleRepository.findActiveSchedules.mockResolvedValue([
        dailySchedule,
        weeklySchedule,
      ]);
      mockTaskRepository.findTaskByScheduleAndDate.mockResolvedValue(null);
      mockTaskRepository.findIncompleteTasksBySchedule.mockResolvedValue([]);
      mockTaskRepository.createTask.mockResolvedValue({
        _id: new ObjectId(),
        familyId,
        name: "Task",
        dueDate: new Date(),
        assignment: { type: "unassigned" },
        scheduleId: new ObjectId(),
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockScheduleRepository.updateLastGeneratedDate.mockResolvedValue();

      // Execute
      await taskGeneratorService.generateMissedTasksOnStartup();

      // Each schedule should have cleanup checked
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).toHaveBeenCalledWith(schedule1Id);
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).toHaveBeenCalledWith(schedule2Id);

      // Both schedules should generate ONE task each for today
      expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(2);

      // Both should have lastGeneratedDate updated
      expect(
        mockScheduleRepository.updateLastGeneratedDate,
      ).toHaveBeenCalledWith(schedule1Id, today);
      expect(
        mockScheduleRepository.updateLastGeneratedDate,
      ).toHaveBeenCalledWith(schedule2Id, today);
    });
  });
});
