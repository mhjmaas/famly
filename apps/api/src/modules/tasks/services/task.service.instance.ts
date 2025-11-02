import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { KarmaRepository, KarmaService } from "@modules/karma";
import { TaskRepository } from "../repositories/task.repository";
import { TaskService } from "./task.service";

/**
 * Singleton instance of TaskService
 * This ensures all routes and modules use the same task service instance,
 * which is necessary for task completion hooks to work properly
 */
let taskServiceInstance: TaskService | null = null;

export function getTaskService(): TaskService {
  if (!taskServiceInstance) {
    const taskRepository = new TaskRepository();
    const membershipRepository = new FamilyMembershipRepository();
    const karmaRepository = new KarmaRepository();
    const karmaService = new KarmaService(
      karmaRepository,
      membershipRepository,
    );

    taskServiceInstance = new TaskService(
      taskRepository,
      membershipRepository,
      karmaService,
    );
  }

  return taskServiceInstance;
}
