import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { ContributionGoalRepository } from "../repositories/contribution-goal.repository";
import { ContributionGoalService } from "./contribution-goal.service";

/**
 * Singleton instance of ContributionGoalService
 * This ensures all routes and modules use the same service instance
 */
let contributionGoalServiceInstance: ContributionGoalService | null = null;

export function getContributionGoalService(): ContributionGoalService {
  if (!contributionGoalServiceInstance) {
    const contributionGoalRepository = new ContributionGoalRepository();
    const membershipRepository = new FamilyMembershipRepository();

    // Initialize activity event service
    const activityEventRepository = new ActivityEventRepository();
    const activityEventService = new ActivityEventService(
      activityEventRepository,
    );

    contributionGoalServiceInstance = new ContributionGoalService(
      contributionGoalRepository,
      membershipRepository,
      activityEventService,
    );
  }

  return contributionGoalServiceInstance;
}
