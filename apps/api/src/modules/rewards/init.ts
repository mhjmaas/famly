import { getMongoClient } from "@infra/mongo/client";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { KarmaRepository, KarmaService } from "@modules/karma";
import type { TaskService } from "@modules/tasks/services/task.service";
import { ClaimCompletionHook } from "./hooks/claim-completion.hook";
import { ClaimRepository } from "./repositories/claim.repository";
import { MetadataRepository } from "./repositories/metadata.repository";
import { RewardRepository } from "./repositories/reward.repository";

/**
 * Initialize rewards module integration with task service
 * This registers the claim completion hook so that reward claims are automatically
 * completed when their associated auto-task is marked as completed
 * 
 * @param taskService - The task service instance to register hooks with
 */
export function initializeRewardsIntegration(taskService: TaskService): void {
  // Initialize dependencies
  const mongoClient = getMongoClient();
  const claimRepository = new ClaimRepository(mongoClient);
  const rewardRepository = new RewardRepository(mongoClient);
  const metadataRepository = new MetadataRepository(mongoClient);
  
  const membershipRepository = new FamilyMembershipRepository();
  const karmaRepository = new KarmaRepository();
  const karmaService = new KarmaService(karmaRepository, membershipRepository);

  // Create and register the claim completion hook
  const claimCompletionHook = new ClaimCompletionHook(
    claimRepository,
    rewardRepository,
    metadataRepository,
    karmaService,
  );

  taskService.registerCompletionHook(claimCompletionHook);
}
