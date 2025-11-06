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

  describe("generateMissedTasksOnStartup with cleanup", () => {
    it("should delete incomplete tasks when generating missed tasks", async () => {
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
      await taskGeneratorService.generateMissedTasksOnStartup();

      // Verify cleanup was called
      expect(
        mockTaskRepository.findIncompleteTasksBySchedule,
      ).toHaveBeenCalledWith(scheduleId);
      expect(mockTaskRepository.deleteTasksByIds).toHaveBeenCalledWith([
        incompleteTasks[0]._id,
      ]);

      // Verify new task was created
      expect(mockTaskRepository.createTask).toHaveBeenCalledTimes(1);
    });
  });
});
