import { configureStore } from "@reduxjs/toolkit";
import type { UserProfile } from "@/lib/api-client";
import {
  selectPendingTasksCount,
  selectPendingTasksForUser,
  selectPotentialKarma,
} from "@/store/selectors/dashboard.selectors";
import tasksReducer from "@/store/slices/tasks.slice";
import userReducer from "@/store/slices/user.slice";
import type { RootState } from "@/store/store";
import type { Task } from "@/types/api.types";

describe("dashboard.selectors", () => {
  const mockUser: UserProfile = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    families: [
      {
        familyId: "family-123",
        name: "Test Family",
        role: "parent",
        linkedAt: "2024-01-01T00:00:00Z",
      },
    ],
  };

  const createTask = (
    id: string,
    assignment: Task["assignment"],
    completedAt?: string,
    karma?: number,
    dueDate?: string,
    createdAt?: string,
  ): Task => ({
    _id: id,
    familyId: "family-123",
    name: `Task ${id}`,
    assignment,
    completedAt,
    metadata: karma ? { karma } : undefined,
    dueDate,
    createdBy: "user-1",
    createdAt: createdAt || "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  });

  const createStore = (tasks: Task[], user: UserProfile | null) => {
    return configureStore({
      reducer: {
        tasks: tasksReducer,
        user: userReducer,
      },
      preloadedState: {
        tasks: {
          tasks,
          schedules: [],
          isLoading: false,
          error: null,
          lastFetch: Date.now(),
        },
        user: {
          profile: user,
          isLoading: false,
          error: null,
        },
      },
    });
  };

  describe("selectPendingTasksForUser", () => {
    it("should return empty array when user is null", () => {
      const store = createStore([], null);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
      );
      expect(result).toEqual([]);
    });

    it("should return only pending tasks assigned to user", () => {
      const tasks = [
        createTask("1", { type: "member", memberId: "user-123" }), // Pending, assigned
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
        ), // Completed
        createTask("3", { type: "member", memberId: "other-user" }), // Pending, other user
        createTask("4", { type: "role", role: "parent" }), // Pending, role-based
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
      );

      expect(result).toHaveLength(2);
      expect(result.map((t) => t._id)).toEqual(["1", "4"]);
    });

    it("should not return unassigned tasks", () => {
      const tasks = [
        createTask("1", { type: "unassigned" }),
        createTask("2", { type: "member", memberId: "user-123" }),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
      );

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe("2");
    });

    it("should limit results to 3 tasks", () => {
      const tasks = [
        createTask("1", { type: "member", memberId: "user-123" }),
        createTask("2", { type: "member", memberId: "user-123" }),
        createTask("3", { type: "member", memberId: "user-123" }),
        createTask("4", { type: "member", memberId: "user-123" }),
        createTask("5", { type: "member", memberId: "user-123" }),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
      );

      expect(result).toHaveLength(3);
    });

    it("should sort tasks by due date (soonest first)", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          "2024-01-20T00:00:00Z",
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          "2024-01-10T00:00:00Z",
        ),
        createTask(
          "3",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          "2024-01-15T00:00:00Z",
        ),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
      );

      expect(result.map((t) => t._id)).toEqual(["2", "3", "1"]);
    });

    it("should sort tasks without due dates by creation date (newest first)", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          undefined,
          "2024-01-01T00:00:00Z",
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          undefined,
          "2024-01-03T00:00:00Z",
        ),
        createTask(
          "3",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          undefined,
          "2024-01-02T00:00:00Z",
        ),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
      );

      expect(result.map((t) => t._id)).toEqual(["2", "3", "1"]);
    });

    it("should prioritize tasks with due dates over tasks without", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          undefined,
          "2024-01-05T00:00:00Z",
        ), // No due date, newest
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
          "2024-01-20T00:00:00Z",
        ), // Has due date
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
      );

      expect(result.map((t) => t._id)).toEqual(["2", "1"]);
    });

    it("should include recently completed tasks when IDs are provided", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
        ), // Completed
        createTask(
          "3",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
        ),
      ];

      const store = createStore(tasks, mockUser);
      const recentlyCompletedIds = new Set(["2"]);
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
        recentlyCompletedIds,
      );

      expect(result).toHaveLength(3);
      expect(result.map((t) => t._id)).toContain("2");
    });

    it("should not include completed tasks not in recently completed set", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
        ), // Completed
        createTask(
          "3",
          { type: "member", memberId: "user-123" },
          "2024-01-16T00:00:00Z",
        ), // Completed
      ];

      const store = createStore(tasks, mockUser);
      const recentlyCompletedIds = new Set(["2"]); // Only include task 2
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
        recentlyCompletedIds,
      );

      expect(result).toHaveLength(2);
      expect(result.map((t) => t._id)).toEqual(["1", "2"]);
      expect(result.map((t) => t._id)).not.toContain("3");
    });

    it("should handle empty recently completed set", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          undefined,
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
        ), // Completed
      ];

      const store = createStore(tasks, mockUser);
      const recentlyCompletedIds = new Set<string>();
      const result = selectPendingTasksForUser(
        store.getState() as unknown as RootState,
        recentlyCompletedIds,
      );

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe("1");
    });
  });

  describe("selectPotentialKarma", () => {
    it("should return 0 when user is null", () => {
      const store = createStore([], null);
      const result = selectPotentialKarma(
        store.getState() as unknown as RootState,
      );
      expect(result).toBe(0);
    });

    it("should sum karma from pending tasks assigned to user", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          10,
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          undefined,
          20,
        ),
        createTask("3", { type: "role", role: "parent" }, undefined, 15),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPotentialKarma(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(45); // 10 + 20 + 15
    });

    it("should not include karma from completed tasks", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          10,
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
          20,
        ), // Completed
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPotentialKarma(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(10);
    });

    it("should not include karma from tasks assigned to others", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          10,
        ),
        createTask(
          "2",
          { type: "member", memberId: "other-user" },
          undefined,
          20,
        ),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPotentialKarma(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(10);
    });

    it("should handle tasks without karma metadata", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          undefined,
          10,
        ),
        createTask("2", { type: "member", memberId: "user-123" }, undefined), // No karma
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPotentialKarma(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(10);
    });

    it("should return 0 when no pending tasks", () => {
      const store = createStore([], mockUser);
      const result = selectPotentialKarma(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(0);
    });

    it("should return 0 when all tasks are completed", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
          10,
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          "2024-01-16T00:00:00Z",
          20,
        ),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPotentialKarma(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(0);
    });
  });

  describe("selectPendingTasksCount", () => {
    it("should return 0 when user is null", () => {
      const store = createStore([], null);
      const result = selectPendingTasksCount(
        store.getState() as unknown as RootState,
      );
      expect(result).toBe(0);
    });

    it("should count pending tasks assigned to user", () => {
      const tasks = [
        createTask("1", { type: "member", memberId: "user-123" }),
        createTask("2", { type: "role", role: "parent" }),
        createTask(
          "3",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
        ), // Completed
        createTask("4", { type: "member", memberId: "other-user" }),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksCount(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(2); // Task 1 and Task 2
    });

    it("should return 0 when no pending tasks", () => {
      const store = createStore([], mockUser);
      const result = selectPendingTasksCount(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(0);
    });

    it("should not count completed tasks", () => {
      const tasks = [
        createTask(
          "1",
          { type: "member", memberId: "user-123" },
          "2024-01-15T00:00:00Z",
        ),
        createTask(
          "2",
          { type: "member", memberId: "user-123" },
          "2024-01-16T00:00:00Z",
        ),
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksCount(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(0);
    });

    it("should not count tasks assigned to others", () => {
      const tasks = [
        createTask("1", { type: "member", memberId: "other-user" }),
        createTask("2", { type: "role", role: "child" }), // User is parent
      ];

      const store = createStore(tasks, mockUser);
      const result = selectPendingTasksCount(
        store.getState() as unknown as RootState,
      );

      expect(result).toBe(0);
    });
  });
});
