import { configureStore } from "@reduxjs/toolkit";
import * as apiClient from "@/lib/api-client";
import tasksReducer, {
  completeTask,
  createSchedule,
  createTask,
  deleteSchedule,
  deleteTask,
  fetchSchedules,
  fetchTasks,
  selectSchedules,
  selectTaskById,
  selectTasks,
  selectTasksError,
  selectTasksLoading,
  updateTask,
} from "@/store/slices/tasks.slice";
import type { Task, TaskSchedule } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client");

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("tasks slice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tasks: tasksReducer,
        karma: (state = { balances: {}, isLoading: false, error: null }) =>
          state,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().tasks;
      expect(state).toEqual({
        tasks: [],
        schedules: [],
        isLoading: false,
        error: null,
        lastFetch: null,
      });
    });
  });

  describe("fetchTasks thunk", () => {
    it("should fetch tasks successfully", async () => {
      const mockTasks: Task[] = [
        {
          _id: "task-1",
          familyId: "family-1",
          name: "Test Task",
          assignment: { type: "unassigned" },
          createdBy: "user-1",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ];

      mockApiClient.getTasks.mockResolvedValueOnce(mockTasks);

      await store.dispatch(fetchTasks("family-1"));

      const state = store.getState().tasks;
      expect(state.tasks).toEqual(mockTasks);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastFetch).toBeGreaterThan(0);
    });

    it("should handle fetch error", async () => {
      mockApiClient.getTasks.mockRejectedValueOnce(new Error("Network error"));

      await store.dispatch(fetchTasks("family-1"));

      const state = store.getState().tasks;
      expect(state.tasks).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Network error");
    });

    it("should set loading state during fetch", () => {
      mockApiClient.getTasks.mockReturnValueOnce(new Promise(() => {})); // Never resolves

      store.dispatch(fetchTasks("family-1"));

      const state = store.getState().tasks;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe("createTask thunk", () => {
    it("should create task with optimistic update", async () => {
      const newTask: Task = {
        _id: "task-2",
        familyId: "family-1",
        name: "New Task",
        assignment: { type: "unassigned" },
        createdBy: "user-1",
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.createTask.mockResolvedValueOnce(newTask);

      await store.dispatch(
        createTask({
          familyId: "family-1",
          data: { name: "New Task", assignment: { type: "unassigned" } },
        }),
      );

      const state = store.getState().tasks;
      expect(state.tasks).toContainEqual(newTask);
      expect(state.error).toBe(null);
    });

    it("should rollback on create error", async () => {
      mockApiClient.createTask.mockRejectedValueOnce(
        new Error("Creation failed"),
      );

      const initialTasks = store.getState().tasks.tasks;

      await store.dispatch(
        createTask({
          familyId: "family-1",
          data: { name: "Failed Task", assignment: { type: "unassigned" } },
        }),
      );

      const state = store.getState().tasks;
      expect(state.tasks).toEqual(initialTasks);
      expect(state.error).toBe("Creation failed");
    });
  });

  describe("updateTask thunk", () => {
    beforeEach(async () => {
      const existingTask: Task = {
        _id: "task-1",
        familyId: "family-1",
        name: "Original Name",
        assignment: { type: "unassigned" },
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getTasks.mockResolvedValueOnce([existingTask]);
      await store.dispatch(fetchTasks("family-1"));
    });

    it("should update task optimistically", async () => {
      const updatedTask: Task = {
        _id: "task-1",
        familyId: "family-1",
        name: "Updated Name",
        assignment: { type: "unassigned" },
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.updateTask.mockResolvedValueOnce(updatedTask);

      await store.dispatch(
        updateTask({
          familyId: "family-1",
          taskId: "task-1",
          data: { name: "Updated Name" },
        }),
      );

      const state = store.getState().tasks;
      const task = state.tasks.find((t) => t._id === "task-1");
      expect(task?.name).toBe("Updated Name");
    });

    it("should rollback on update error", async () => {
      mockApiClient.updateTask.mockRejectedValueOnce(
        new Error("Update failed"),
      );

      const originalName = store.getState().tasks.tasks[0].name;

      await store.dispatch(
        updateTask({
          familyId: "family-1",
          taskId: "task-1",
          data: { name: "Failed Update" },
        }),
      );

      const state = store.getState().tasks;
      const task = state.tasks.find((t) => t._id === "task-1");
      expect(task?.name).toBe(originalName);
      expect(state.error).toBe("Update failed");
    });
  });

  describe("completeTask thunk", () => {
    it("should complete task without karma", async () => {
      const task: Task = {
        _id: "task-1",
        familyId: "family-1",
        name: "Task",
        assignment: { type: "member", memberId: "user-1" },
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getTasks.mockResolvedValueOnce([task]);
      await store.dispatch(fetchTasks("family-1"));

      const completedTask = { ...task, completedAt: "2025-01-15T10:00:00Z" };
      mockApiClient.updateTask.mockResolvedValueOnce(completedTask);

      await store.dispatch(
        completeTask({
          familyId: "family-1",
          taskId: "task-1",
          userId: "user-1",
        }),
      );

      const state = store.getState().tasks;
      const updatedTask = state.tasks.find((t) => t._id === "task-1");
      expect(updatedTask?.completedAt).toBeTruthy();
    });

    it("should complete task with karma and update balance", async () => {
      const task: Task = {
        _id: "task-1",
        familyId: "family-1",
        name: "Task with Karma",
        assignment: { type: "member", memberId: "user-1" },
        metadata: { karma: 10 },
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getTasks.mockResolvedValueOnce([task]);
      await store.dispatch(fetchTasks("family-1"));

      const completedTask = { ...task, completedAt: "2025-01-15T10:00:00Z" };
      mockApiClient.updateTask.mockResolvedValueOnce(completedTask);

      await store.dispatch(
        completeTask({
          familyId: "family-1",
          taskId: "task-1",
          userId: "user-1",
          karma: 10,
        }),
      );

      const state = store.getState().tasks;
      const updatedTask = state.tasks.find((t) => t._id === "task-1");
      expect(updatedTask?.completedAt).toBeTruthy();
    });
  });

  describe("deleteTask thunk", () => {
    it("should delete task optimistically", async () => {
      const task: Task = {
        _id: "task-1",
        familyId: "family-1",
        name: "Task to Delete",
        assignment: { type: "unassigned" },
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getTasks.mockResolvedValueOnce([task]);
      await store.dispatch(fetchTasks("family-1"));

      mockApiClient.deleteTask.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteTask({ familyId: "family-1", taskId: "task-1" }),
      );

      const state = store.getState().tasks;
      expect(state.tasks.find((t) => t._id === "task-1")).toBeUndefined();
    });
  });

  describe("schedule thunks", () => {
    it("should fetch schedules successfully", async () => {
      const mockSchedules: TaskSchedule[] = [
        {
          _id: "schedule-1",
          familyId: "family-1",
          name: "Weekly Chore",
          assignment: { type: "role", role: "child" },
          schedule: {
            daysOfWeek: [1, 3],
            weeklyInterval: 1,
            startDate: "2025-01-01",
          },
          createdBy: "user-1",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ];

      mockApiClient.getSchedules.mockResolvedValueOnce(mockSchedules);

      await store.dispatch(fetchSchedules("family-1"));

      const state = store.getState().tasks;
      expect(state.schedules).toEqual(mockSchedules);
    });

    it("should create schedule", async () => {
      const newSchedule: TaskSchedule = {
        _id: "schedule-2",
        familyId: "family-1",
        name: "New Schedule",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [0, 6],
          weeklyInterval: 2,
          startDate: "2025-01-01",
        },
        createdBy: "user-1",
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.createSchedule.mockResolvedValueOnce(newSchedule);

      await store.dispatch(
        createSchedule({
          familyId: "family-1",
          data: {
            name: "New Schedule",
            assignment: { type: "unassigned" },
            schedule: {
              daysOfWeek: [0, 6],
              weeklyInterval: 2,
              startDate: "2025-01-01",
            },
          },
        }),
      );

      const state = store.getState().tasks;
      expect(state.schedules).toContainEqual(newSchedule);
    });

    it("should delete schedule", async () => {
      const schedule: TaskSchedule = {
        _id: "schedule-1",
        familyId: "family-1",
        name: "Schedule to Delete",
        assignment: { type: "unassigned" },
        schedule: {
          daysOfWeek: [1],
          weeklyInterval: 1,
          startDate: "2025-01-01",
        },
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getSchedules.mockResolvedValueOnce([schedule]);
      await store.dispatch(fetchSchedules("family-1"));

      mockApiClient.deleteSchedule.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteSchedule({ familyId: "family-1", scheduleId: "schedule-1" }),
      );

      const state = store.getState().tasks;
      expect(
        state.schedules.find((s) => s._id === "schedule-1"),
      ).toBeUndefined();
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      const mockTasks: Task[] = [
        {
          _id: "task-1",
          familyId: "family-1",
          name: "Task 1",
          assignment: { type: "unassigned" },
          createdBy: "user-1",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          _id: "task-2",
          familyId: "family-1",
          name: "Task 2",
          assignment: { type: "member", memberId: "user-2" },
          createdBy: "user-1",
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockApiClient.getTasks.mockResolvedValueOnce(mockTasks);
      await store.dispatch(fetchTasks("family-1"));
    });

    it("selectTasks should return all tasks", () => {
      const state = store.getState();
      const tasks = selectTasks(state);
      expect(tasks).toHaveLength(2);
    });

    it("selectTaskById should return specific task", () => {
      const state = store.getState();
      const task = selectTaskById("task-1")(state);
      expect(task?.name).toBe("Task 1");
    });

    it("selectTaskById should return undefined for non-existent task", () => {
      const state = store.getState();
      const task = selectTaskById("non-existent")(state);
      expect(task).toBeUndefined();
    });

    it("selectTasksLoading should return loading state", () => {
      const state = store.getState();
      const isLoading = selectTasksLoading(state);
      expect(typeof isLoading).toBe("boolean");
    });

    it("selectTasksError should return error state", () => {
      const state = store.getState();
      const error = selectTasksError(state);
      expect(error).toBe(null);
    });

    it("selectSchedules should return all schedules", () => {
      const state = store.getState();
      const schedules = selectSchedules(state);
      expect(Array.isArray(schedules)).toBe(true);
    });
  });
});
