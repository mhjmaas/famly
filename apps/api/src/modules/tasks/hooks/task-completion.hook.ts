import type { ObjectId } from "mongodb";
import type { Task } from "../domain/task";

/**
 * Interface for task completion hooks
 * Allows modules to react when a task is marked as completed
 */
export interface TaskCompletionHook {
  /**
   * Called when a task transitions to completed status
   * @param task - The completed task
   * @param completedBy - User ID of the person who completed the task
   */
  onTaskCompleted(task: Task, completedBy: ObjectId): Promise<void>;
}

/**
 * Registry for task completion hooks
 * Used to manage and invoke hooks when tasks are completed
 */
export class TaskCompletionHookRegistry {
  private hooks: TaskCompletionHook[] = [];

  /**
   * Register a new task completion hook
   */
  register(hook: TaskCompletionHook): void {
    this.hooks.push(hook);
  }

  /**
   * Invoke all registered hooks for task completion
   * Errors are caught and logged to prevent one hook failure from affecting others
   */
  async invokeHooks(
    task: Task,
    completedBy: ObjectId,
    errorHandler?: (error: Error) => void,
  ): Promise<void> {
    const results = await Promise.allSettled(
      this.hooks.map((hook) => hook.onTaskCompleted(task, completedBy)),
    );

    for (const result of results) {
      if (result.status === "rejected" && errorHandler) {
        errorHandler(result.reason as Error);
      }
    }
  }

  /**
   * Clear all registered hooks (useful for testing)
   */
  clear(): void {
    this.hooks = [];
  }
}
