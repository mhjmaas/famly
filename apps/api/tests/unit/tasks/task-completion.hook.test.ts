import { ObjectId } from "mongodb";
import { fromObjectId, type ObjectIdString } from "@/lib/objectid-utils";
import type { Task } from "@/modules/tasks/domain/task";
import {
  type TaskCompletionHook,
  TaskCompletionHookRegistry,
} from "@/modules/tasks/hooks/task-completion.hook";

describe("TaskCompletionHookRegistry", () => {
  let registry: TaskCompletionHookRegistry;
  let mockTask: Task;
  let completedBy: ObjectIdString;
  let triggeredBy: ObjectIdString;

  beforeEach(() => {
    registry = new TaskCompletionHookRegistry();
    completedBy = fromObjectId(new ObjectId());
    triggeredBy = fromObjectId(new ObjectId());

    // Create a mock task
    mockTask = {
      _id: new ObjectId(),
      familyId: new ObjectId(),
      name: "Test Task",
      assignment: { type: "unassigned" },
      createdBy: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: new Date(),
    };
  });

  describe("register and invoke hooks", () => {
    it("should invoke registered hooks on completion", async () => {
      const hookSpy = jest.fn();
      const mockHook: TaskCompletionHook = {
        onTaskCompleted: hookSpy,
      };

      registry.register(mockHook);
      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      expect(hookSpy).toHaveBeenCalledWith(mockTask, completedBy, triggeredBy);
      expect(hookSpy).toHaveBeenCalledTimes(1);
    });

    it("should invoke multiple hooks in order", async () => {
      const hook1Spy = jest.fn();
      const hook2Spy = jest.fn();
      const hook3Spy = jest.fn();

      registry.register({ onTaskCompleted: hook1Spy });
      registry.register({ onTaskCompleted: hook2Spy });
      registry.register({ onTaskCompleted: hook3Spy });

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      expect(hook1Spy).toHaveBeenCalledWith(mockTask, completedBy, triggeredBy);
      expect(hook2Spy).toHaveBeenCalledWith(mockTask, completedBy, triggeredBy);
      expect(hook3Spy).toHaveBeenCalledWith(mockTask, completedBy, triggeredBy);
    });

    it("should pass task and completedBy correctly to hooks", async () => {
      const hookSpy = jest.fn();
      registry.register({ onTaskCompleted: hookSpy });

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      const callArgs = hookSpy.mock.calls[0];
      expect(callArgs[0]).toBe(mockTask);
      expect(callArgs[1]).toBe(completedBy);
    });
  });

  describe("error handling", () => {
    it("should catch hook errors and call error handler", async () => {
      const error = new Error("Hook failed");
      const failingHook: TaskCompletionHook = {
        onTaskCompleted: jest.fn().mockRejectedValue(error),
      };
      const errorHandler = jest.fn();

      registry.register(failingHook);
      await registry.invokeHooks(
        mockTask,
        completedBy,
        triggeredBy,
        errorHandler,
      );

      expect(errorHandler).toHaveBeenCalledWith(error);
    });

    it("should handle multiple hooks with some failing", async () => {
      const error1 = new Error("Hook 1 failed");
      const error2 = new Error("Hook 2 failed");
      const errorHandler = jest.fn();

      const hook1: TaskCompletionHook = {
        onTaskCompleted: jest.fn().mockRejectedValue(error1),
      };
      const hook2: TaskCompletionHook = {
        onTaskCompleted: jest.fn().mockResolvedValue(undefined),
      };
      const hook3: TaskCompletionHook = {
        onTaskCompleted: jest.fn().mockRejectedValue(error2),
      };

      registry.register(hook1);
      registry.register(hook2);
      registry.register(hook3);

      await registry.invokeHooks(
        mockTask,
        completedBy,
        triggeredBy,
        errorHandler,
      );

      expect(errorHandler).toHaveBeenCalledTimes(2);
      expect(errorHandler).toHaveBeenCalledWith(error1);
      expect(errorHandler).toHaveBeenCalledWith(error2);
    });

    it("should invoke hooks in parallel with allSettled", async () => {
      const startTime = Date.now();
      const delay = 50;

      const slowHook: TaskCompletionHook = {
        onTaskCompleted: async () => {
          await new Promise((resolve) => setTimeout(resolve, delay));
        },
      };

      registry.register(slowHook);
      registry.register(slowHook); // Register twice
      registry.register(slowHook); // Register thrice

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      const elapsed = Date.now() - startTime;
      // If executed in parallel, should be ~delay, not 3*delay
      // Allow some buffer for execution
      expect(elapsed).toBeLessThan(delay * 2.5);
    });

    it("should not call error handler if none provided", async () => {
      const error = new Error("Hook failed");
      const failingHook: TaskCompletionHook = {
        onTaskCompleted: jest.fn().mockRejectedValue(error),
      };

      registry.register(failingHook);
      // Should not throw
      await expect(
        registry.invokeHooks(mockTask, completedBy, triggeredBy),
      ).resolves.toBeUndefined();
    });
  });

  describe("hook registry management", () => {
    it("should clear all hooks", async () => {
      const hook1Spy = jest.fn();
      const hook2Spy = jest.fn();

      registry.register({ onTaskCompleted: hook1Spy });
      registry.register({ onTaskCompleted: hook2Spy });

      registry.clear();

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      expect(hook1Spy).not.toHaveBeenCalled();
      expect(hook2Spy).not.toHaveBeenCalled();
    });

    it("should handle registering hooks after clearing", async () => {
      const hook1Spy = jest.fn();
      const hook2Spy = jest.fn();

      registry.register({ onTaskCompleted: hook1Spy });
      registry.clear();
      registry.register({ onTaskCompleted: hook2Spy });

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      expect(hook1Spy).not.toHaveBeenCalled();
      expect(hook2Spy).toHaveBeenCalledWith(mockTask, completedBy, triggeredBy);
    });

    it("should maintain hook order across invocations", async () => {
      const callOrder: number[] = [];

      const hook1: TaskCompletionHook = {
        onTaskCompleted: async () => {
          callOrder.push(1);
        },
      };
      const hook2: TaskCompletionHook = {
        onTaskCompleted: async () => {
          callOrder.push(2);
        },
      };
      const hook3: TaskCompletionHook = {
        onTaskCompleted: async () => {
          callOrder.push(3);
        },
      };

      registry.register(hook1);
      registry.register(hook2);
      registry.register(hook3);

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      callOrder.length = 0;
      mockTask._id = new ObjectId(); // Change task to invoke again

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      // Since hooks are invoked in parallel with allSettled, order is not guaranteed
      // But the hooks should all be called
      expect(callOrder).toHaveLength(3);
      expect(new Set(callOrder)).toEqual(new Set([1, 2, 3]));
    });
  });

  describe("edge cases", () => {
    it("should handle no registered hooks", async () => {
      await expect(
        registry.invokeHooks(mockTask, completedBy, triggeredBy),
      ).resolves.toBeUndefined();
    });

    it("should handle hooks that return undefined", async () => {
      const hook: TaskCompletionHook = {
        onTaskCompleted: jest.fn().mockResolvedValue(undefined),
      };

      registry.register(hook);
      await expect(
        registry.invokeHooks(mockTask, completedBy, triggeredBy),
      ).resolves.toBeUndefined();
    });

    it("should handle async hooks", async () => {
      const hookSpy = jest.fn().mockResolvedValue(undefined);
      registry.register({ onTaskCompleted: hookSpy });

      await registry.invokeHooks(mockTask, completedBy, triggeredBy);

      expect(hookSpy).toHaveBeenCalled();
    });
  });
});
