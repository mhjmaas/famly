import { isTaskAssignedToUser, sortTasksByPriority } from "@/lib/task-utils";
import type { Task } from "@/types/api.types";

describe("task-utils", () => {
  describe("isTaskAssignedToUser", () => {
    const userId = "user-123";
    const userRole = "parent";

    const createTask = (assignment: Task["assignment"]): Task => ({
      _id: "task-1",
      familyId: "family-1",
      name: "Test Task",
      assignment,
      createdBy: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    it("should return true for task assigned to specific member", () => {
      const task = createTask({ type: "member", memberId: userId });
      expect(isTaskAssignedToUser(task, userId, userRole)).toBe(true);
    });

    it("should return false for task assigned to different member", () => {
      const task = createTask({ type: "member", memberId: "other-user" });
      expect(isTaskAssignedToUser(task, userId, userRole)).toBe(false);
    });

    it("should return true for task assigned to matching role", () => {
      const task = createTask({ type: "role", role: "parent" });
      expect(isTaskAssignedToUser(task, userId, "parent")).toBe(true);
    });

    it("should return false for task assigned to different role", () => {
      const task = createTask({ type: "role", role: "child" });
      expect(isTaskAssignedToUser(task, userId, "parent")).toBe(false);
    });

    it("should be case-insensitive for role matching", () => {
      const task = createTask({ type: "role", role: "parent" });
      expect(isTaskAssignedToUser(task, userId, "Parent")).toBe(true);
      expect(isTaskAssignedToUser(task, userId, "PARENT")).toBe(true);
    });

    it("should return false for unassigned task", () => {
      const task = createTask({ type: "unassigned" });
      expect(isTaskAssignedToUser(task, userId, userRole)).toBe(false);
    });

    it("should return false for task with no assignment", () => {
      const task = {
        _id: "task-1",
        familyId: "family-1",
        name: "Test Task",
        assignment: null,
        createdBy: "user-1",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      } as unknown as Task;
      expect(isTaskAssignedToUser(task, userId, userRole)).toBe(false);
    });

    it("should return false for task with invalid assignment type", () => {
      const task = createTask({
        type: "invalid",
      } as unknown as Task["assignment"]);
      expect(isTaskAssignedToUser(task, userId, userRole)).toBe(false);
    });
  });

  describe("sortTasksByPriority", () => {
    const createTask = (
      id: string,
      dueDate?: string,
      createdAt?: string,
    ): Task => ({
      _id: id,
      familyId: "family-1",
      name: `Task ${id}`,
      assignment: { type: "unassigned" },
      dueDate,
      createdBy: "user-1",
      createdAt: createdAt || "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    it("should sort tasks with due dates before tasks without due dates", () => {
      const tasks = [
        createTask("1", undefined),
        createTask("2", "2024-01-15T00:00:00Z"),
        createTask("3", undefined),
      ];

      const sorted = sortTasksByPriority(tasks);

      expect(sorted[0]._id).toBe("2"); // Has due date
      expect(sorted[1]._id).toBe("1"); // No due date
      expect(sorted[2]._id).toBe("3"); // No due date
    });

    it("should sort tasks by due date (soonest first)", () => {
      const tasks = [
        createTask("1", "2024-01-20T00:00:00Z"),
        createTask("2", "2024-01-10T00:00:00Z"),
        createTask("3", "2024-01-15T00:00:00Z"),
      ];

      const sorted = sortTasksByPriority(tasks);

      expect(sorted[0]._id).toBe("2"); // Jan 10
      expect(sorted[1]._id).toBe("3"); // Jan 15
      expect(sorted[2]._id).toBe("1"); // Jan 20
    });

    it("should sort tasks without due dates by creation date (newest first)", () => {
      const tasks = [
        createTask("1", undefined, "2024-01-01T00:00:00Z"),
        createTask("2", undefined, "2024-01-03T00:00:00Z"),
        createTask("3", undefined, "2024-01-02T00:00:00Z"),
      ];

      const sorted = sortTasksByPriority(tasks);

      expect(sorted[0]._id).toBe("2"); // Jan 3 (newest)
      expect(sorted[1]._id).toBe("3"); // Jan 2
      expect(sorted[2]._id).toBe("1"); // Jan 1 (oldest)
    });

    it("should sort tasks with same due date by creation date (newest first)", () => {
      const tasks = [
        createTask("1", "2024-01-15T00:00:00Z", "2024-01-01T00:00:00Z"),
        createTask("2", "2024-01-15T00:00:00Z", "2024-01-03T00:00:00Z"),
        createTask("3", "2024-01-15T00:00:00Z", "2024-01-02T00:00:00Z"),
      ];

      const sorted = sortTasksByPriority(tasks);

      expect(sorted[0]._id).toBe("2"); // Same due date, newest creation
      expect(sorted[1]._id).toBe("3");
      expect(sorted[2]._id).toBe("1");
    });

    it("should not mutate the original array", () => {
      const tasks = [
        createTask("1", "2024-01-20T00:00:00Z"),
        createTask("2", "2024-01-10T00:00:00Z"),
      ];

      const original = [...tasks];
      sortTasksByPriority(tasks);

      expect(tasks).toEqual(original);
    });

    it("should handle empty array", () => {
      const sorted = sortTasksByPriority([]);
      expect(sorted).toEqual([]);
    });

    it("should handle single task", () => {
      const tasks = [createTask("1", "2024-01-15T00:00:00Z")];
      const sorted = sortTasksByPriority(tasks);
      expect(sorted).toEqual(tasks);
    });

    it("should handle complex mixed scenario", () => {
      const tasks = [
        createTask("1", undefined, "2024-01-01T00:00:00Z"), // No due date, old
        createTask("2", "2024-01-20T00:00:00Z", "2024-01-02T00:00:00Z"), // Due late
        createTask("3", "2024-01-10T00:00:00Z", "2024-01-01T00:00:00Z"), // Due soon, old
        createTask("4", undefined, "2024-01-05T00:00:00Z"), // No due date, newer
        createTask("5", "2024-01-10T00:00:00Z", "2024-01-03T00:00:00Z"), // Due soon, new
      ];

      const sorted = sortTasksByPriority(tasks);

      // Tasks with due dates first (sorted by due date, then creation date)
      expect(sorted[0]._id).toBe("5"); // Due Jan 10, created Jan 3
      expect(sorted[1]._id).toBe("3"); // Due Jan 10, created Jan 1
      expect(sorted[2]._id).toBe("2"); // Due Jan 20
      // Then tasks without due dates (sorted by creation date, newest first)
      expect(sorted[3]._id).toBe("4"); // Created Jan 5
      expect(sorted[4]._id).toBe("1"); // Created Jan 1
    });
  });
});
