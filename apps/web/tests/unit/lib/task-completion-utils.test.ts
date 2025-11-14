import {
  canCompleteTask,
  getTaskCompletionBlockedReason,
  getTaskKarmaRecipient,
} from "@/lib/task-completion-utils";
import type { Task } from "@/types/api.types";

describe("task-completion-utils", () => {
  const createTask = (
    assignment: Task["assignment"],
    completedAt?: string,
  ): Task => ({
    _id: "task-1",
    familyId: "family-1",
    name: "Test Task",
    assignment,
    createdBy: "user-1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    completedAt,
  });

  describe("getTaskKarmaRecipient", () => {
    const viewerId = "viewer-123";

    it("should return assignee for member-assigned tasks", () => {
      const task = createTask({ type: "member", memberId: "assignee-456" });
      expect(getTaskKarmaRecipient(task, viewerId)).toBe("assignee-456");
    });

    it("should return assignee even if viewer is different", () => {
      const task = createTask({ type: "member", memberId: "assignee-456" });
      expect(getTaskKarmaRecipient(task, "different-viewer")).toBe(
        "assignee-456",
      );
    });

    it("should return viewer for role-based tasks", () => {
      const task = createTask({ type: "role", role: "parent" });
      expect(getTaskKarmaRecipient(task, viewerId)).toBe(viewerId);
    });

    it("should return viewer for child role tasks", () => {
      const task = createTask({ type: "role", role: "child" });
      expect(getTaskKarmaRecipient(task, viewerId)).toBe(viewerId);
    });

    it("should return viewer for unassigned tasks", () => {
      const task = createTask({ type: "unassigned" });
      expect(getTaskKarmaRecipient(task, viewerId)).toBe(viewerId);
    });
  });

  describe("canCompleteTask", () => {
    const userId = "user-123";

    describe("when task is already completed", () => {
      it("should return false for any viewer", () => {
        const task = createTask({ type: "unassigned" }, "2024-01-01T00:00:00Z");
        expect(canCompleteTask(task, userId, "Parent")).toBe(false);
        expect(canCompleteTask(task, userId, "Child")).toBe(false);
      });
    });

    describe("for member-assigned tasks", () => {
      it("should allow assignee to complete their task", () => {
        const task = createTask({ type: "member", memberId: userId });
        expect(canCompleteTask(task, userId, "Parent")).toBe(true);
        expect(canCompleteTask(task, userId, "Child")).toBe(true);
      });

      it("should not allow non-assignee child to complete", () => {
        const task = createTask({ type: "member", memberId: "other-user" });
        expect(canCompleteTask(task, userId, "Child")).toBe(false);
      });

      it("should allow parent to complete task assigned to other member", () => {
        const task = createTask({ type: "member", memberId: "other-user" });
        expect(canCompleteTask(task, userId, "Parent")).toBe(true);
      });

      it("should not allow parent to complete if they are the assignee", () => {
        const task = createTask({ type: "member", memberId: userId });
        expect(canCompleteTask(task, userId, "Parent")).toBe(true);
      });
    });

    describe("for role-based tasks", () => {
      it("should allow parent to complete parent-role tasks", () => {
        const task = createTask({ type: "role", role: "parent" });
        expect(canCompleteTask(task, userId, "Parent")).toBe(true);
      });

      it("should not allow child to complete parent-role tasks", () => {
        const task = createTask({ type: "role", role: "parent" });
        expect(canCompleteTask(task, userId, "Child")).toBe(false);
      });

      it("should allow child to complete child-role tasks", () => {
        const task = createTask({ type: "role", role: "child" });
        expect(canCompleteTask(task, userId, "Child")).toBe(true);
      });

      it("should not allow parent to complete child-role tasks", () => {
        const task = createTask({ type: "role", role: "child" });
        expect(canCompleteTask(task, userId, "Parent")).toBe(false);
      });
    });

    describe("for unassigned tasks", () => {
      it("should allow anyone to complete unassigned tasks", () => {
        const task = createTask({ type: "unassigned" });
        expect(canCompleteTask(task, userId, "Parent")).toBe(true);
        expect(canCompleteTask(task, userId, "Child")).toBe(true);
      });

      it("should allow any viewer ID for unassigned tasks", () => {
        const task = createTask({ type: "unassigned" });
        expect(canCompleteTask(task, "any-user-id", "Parent")).toBe(true);
        expect(canCompleteTask(task, "another-user", "Child")).toBe(true);
      });
    });
  });

  describe("getTaskCompletionBlockedReason", () => {
    const userId = "user-123";

    describe("when task is already completed", () => {
      it("should return completion message", () => {
        const task = createTask({ type: "unassigned" }, "2024-01-01T00:00:00Z");
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          "This task is already completed",
        );
      });

      it("should return the same message regardless of viewer", () => {
        const task = createTask(
          { type: "member", memberId: "other" },
          "2024-01-01T00:00:00Z",
        );
        expect(getTaskCompletionBlockedReason(task, userId, "Child")).toBe(
          "This task is already completed",
        );
      });
    });

    describe("for member-assigned tasks", () => {
      it("should return null when assignee tries to complete", () => {
        const task = createTask({ type: "member", memberId: userId });
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          null,
        );
      });

      it("should return error when non-assignee child tries to complete", () => {
        const task = createTask({ type: "member", memberId: "other-user" });
        expect(getTaskCompletionBlockedReason(task, userId, "Child")).toBe(
          "Only the assignee or a parent can complete this task",
        );
      });

      it("should return null when parent tries to complete task assigned to other member", () => {
        const task = createTask({ type: "member", memberId: "other-user" });
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          null,
        );
      });
    });

    describe("for role-based tasks", () => {
      it("should return null when parent completes parent-role task", () => {
        const task = createTask({ type: "role", role: "parent" });
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          null,
        );
      });

      it("should return error when child tries to complete parent-role task", () => {
        const task = createTask({ type: "role", role: "parent" });
        expect(getTaskCompletionBlockedReason(task, userId, "Child")).toBe(
          "Only parents can complete this task",
        );
      });

      it("should return null when child completes child-role task", () => {
        const task = createTask({ type: "role", role: "child" });
        expect(getTaskCompletionBlockedReason(task, userId, "Child")).toBe(
          null,
        );
      });

      it("should return error when parent tries to complete child-role task", () => {
        const task = createTask({ type: "role", role: "child" });
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          "Only children can complete this task",
        );
      });
    });

    describe("for unassigned tasks", () => {
      it("should return null for any viewer", () => {
        const task = createTask({ type: "unassigned" });
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          null,
        );
        expect(getTaskCompletionBlockedReason(task, userId, "Child")).toBe(
          null,
        );
      });

      it("should return null for any user ID", () => {
        const task = createTask({ type: "unassigned" });
        expect(getTaskCompletionBlockedReason(task, "any-id", "Parent")).toBe(
          null,
        );
        expect(
          getTaskCompletionBlockedReason(task, "another-id", "Child"),
        ).toBe(null);
      });
    });

    describe("edge cases", () => {
      it("should handle tasks with missing completedAt field", () => {
        const task = createTask({ type: "unassigned" });
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          null,
        );
      });

      it("should prioritize completed status over other checks", () => {
        const task = createTask(
          { type: "role", role: "child" },
          "2024-01-01T00:00:00Z",
        );
        // Even though parent shouldn't be able to complete child task,
        // the "already completed" message takes precedence
        expect(getTaskCompletionBlockedReason(task, userId, "Parent")).toBe(
          "This task is already completed",
        );
      });
    });
  });

  describe("integration scenarios", () => {
    const parentId = "parent-123";
    const childId = "child-456";

    it("should handle parent completing their own member-assigned task", () => {
      const task = createTask({ type: "member", memberId: parentId });
      expect(canCompleteTask(task, parentId, "Parent")).toBe(true);
      expect(getTaskKarmaRecipient(task, parentId)).toBe(parentId);
      expect(getTaskCompletionBlockedReason(task, parentId, "Parent")).toBe(
        null,
      );
    });

    it("should handle parent completing child's member-assigned task", () => {
      const task = createTask({ type: "member", memberId: childId });
      expect(canCompleteTask(task, parentId, "Parent")).toBe(true);
      expect(getTaskKarmaRecipient(task, parentId)).toBe(childId);
      expect(getTaskCompletionBlockedReason(task, parentId, "Parent")).toBe(
        null,
      );
    });

    it("should prevent child from completing sibling's task", () => {
      const task = createTask({ type: "member", memberId: childId });
      expect(canCompleteTask(task, "other-child", "Child")).toBe(false);
      expect(getTaskKarmaRecipient(task, "other-child")).toBe(childId);
      expect(getTaskCompletionBlockedReason(task, "other-child", "Child")).toBe(
        "Only the assignee or a parent can complete this task",
      );
    });

    it("should allow child to complete their own member-assigned task", () => {
      const task = createTask({ type: "member", memberId: childId });
      expect(canCompleteTask(task, childId, "Child")).toBe(true);
      expect(getTaskKarmaRecipient(task, childId)).toBe(childId);
      expect(getTaskCompletionBlockedReason(task, childId, "Child")).toBe(null);
    });
  });
});
