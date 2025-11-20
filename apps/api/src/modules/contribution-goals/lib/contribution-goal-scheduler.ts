import { logger } from "@lib/logger";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { KarmaRepository, KarmaService } from "@modules/karma";
import { CronJob } from "cron";
import { ContributionGoalRepository } from "../repositories/contribution-goal.repository";
import { ContributionGoalProcessorService } from "../services/contribution-goal-processor.service";
import { getCurrentWeekStart } from "./week-utils";

let cronJob: CronJob | null = null;

/**
 * Start the contribution goal weekly processing cron job
 * Runs every Sunday at 18:00 UTC
 */
export function startContributionGoalScheduler(): void {
  try {
    if (cronJob) {
      logger.warn("Contribution goal scheduler already running");
      return;
    }

    // Initialize repositories and services
    const contributionGoalRepository = new ContributionGoalRepository();
    const karmaRepository = new KarmaRepository();
    const membershipRepository = new FamilyMembershipRepository();
    const activityEventRepository = new ActivityEventRepository();

    const karmaService = new KarmaService(
      karmaRepository,
      membershipRepository,
    );
    const activityEventService = new ActivityEventService(
      activityEventRepository,
    );

    const contributionGoalProcessor = new ContributionGoalProcessorService(
      contributionGoalRepository,
      karmaService,
      activityEventService,
    );

    // Create cron job: runs at 18:00 UTC every Sunday
    // Format: second minute hour dayOfMonth month dayOfWeek
    cronJob = new CronJob(
      "0 0 18 * * 0", // 18:00:00 every Sunday (day 0)
      async () => {
        try {
          logger.info("Contribution goal weekly processing cron job triggered");

          // Get the week that just ended
          const weekStartDate = getCurrentWeekStart();

          await contributionGoalProcessor.processWeeklyGoals(weekStartDate);

          logger.info(
            "Contribution goal weekly processing completed successfully",
          );
        } catch (error) {
          logger.error("Contribution goal weekly processing cron job failed", {
            error,
          });
        }
      },
      null, // onComplete
      true, // start immediately
      "UTC", // timezone
    );

    logger.info("Contribution goal scheduler started successfully", {
      schedule: "18:00 UTC every Sunday",
      timezone: "UTC",
    });
  } catch (error) {
    logger.error("Failed to start contribution goal scheduler", { error });
    throw error;
  }
}

/**
 * Stop the contribution goal weekly processing cron job
 * Used during application shutdown
 */
export function stopContributionGoalScheduler(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info("Contribution goal scheduler stopped");
  }
}

/**
 * Get the current status of the contribution goal scheduler
 */
export function getContributionGoalSchedulerStatus(): { running: boolean } {
  return {
    running: cronJob !== null,
  };
}
