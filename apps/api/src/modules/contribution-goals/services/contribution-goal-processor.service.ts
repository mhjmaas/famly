import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import { getUserLanguage } from "@lib/user-utils";
import type { ActivityEventService } from "@modules/activity-events";
import type { KarmaService } from "@modules/karma";
import {
  createContributionGoalAwardedNotification,
  createContributionGoalZeroKarmaNotification,
  sendToUser,
} from "@modules/notifications";
import { emitContributionGoalAwarded } from "../events/contribution-goal-events";
import { calculateCurrentKarma } from "../lib/contribution-goal.mapper";
import type { ContributionGoalRepository } from "../repositories/contribution-goal.repository";

export class ContributionGoalProcessorService {
  constructor(
    private contributionGoalRepository: ContributionGoalRepository,
    private karmaService: KarmaService,
    private activityEventService?: ActivityEventService,
  ) {}

  /**
   * Process all contribution goals for a given week
   * Awards remaining karma, creates activity events, sends notifications, and deletes goals
   *
   * @param weekStartDate The start date of the week to process
   */
  async processWeeklyGoals(weekStartDate: Date): Promise<void> {
    try {
      logger.info("Starting weekly contribution goal processing", {
        weekStartDate: weekStartDate.toISOString(),
      });

      const goals =
        await this.contributionGoalRepository.findActiveGoalsForWeek(
          weekStartDate,
        );

      if (goals.length === 0) {
        logger.info("No active contribution goals to process for this week");
        return;
      }

      logger.info(`Processing ${goals.length} contribution goals`);

      let successCount = 0;
      let errorCount = 0;

      for (const goal of goals) {
        try {
          const currentKarma = calculateCurrentKarma(goal);

          // Only award karma if there's remaining karma
          if (currentKarma > 0) {
            // Award karma via karma service
            await this.karmaService.awardKarma(
              {
                familyId: validateObjectId(
                  goal.familyId.toString(),
                  "familyId",
                ),
                userId: validateObjectId(goal.memberId.toString(), "userId"),
                amount: currentKarma,
                source: "contribution_goal_weekly",
                description: `Weekly contribution goal achieved: ${goal.title}`,
                metadata: {},
              },
              false, // Don't skip notification
            );

            logger.info("Karma awarded for contribution goal", {
              goalId: goal._id.toString(),
              memberId: goal.memberId.toString(),
              karmaAwarded: currentKarma,
            });
          } else {
            logger.info("No karma to award for contribution goal", {
              goalId: goal._id.toString(),
              memberId: goal.memberId.toString(),
              currentKarma,
            });
          }

          // Record activity event for goal completion
          if (this.activityEventService) {
            await this.activityEventService.recordEvent({
              userId: validateObjectId(goal.memberId.toString(), "userId"),
              type: "CONTRIBUTION_GOAL",
              detail: "AWARDED",
              title: `Weekly goal completed: ${goal.title}`,
              description:
                currentKarma > 0
                  ? `Earned ${currentKarma} karma from contribution goal`
                  : `No karma earned - all potential karma was deducted`,
              metadata: {
                karma: currentKarma,
              },
              templateKey:
                currentKarma > 0
                  ? "activity.contributionGoal.awarded"
                  : "activity.contributionGoal.deducted",
              templateParams: {
                amount: Math.abs(currentKarma),
                goalTitle: goal.title,
              },
            });
          }

          // Emit real-time event for karma award
          emitContributionGoalAwarded(goal, currentKarma);

          // Send push notification
          try {
            const locale = await getUserLanguage(goal.memberId.toString());
            const notification =
              currentKarma > 0
                ? createContributionGoalAwardedNotification(
                    locale,
                    currentKarma,
                    goal.title,
                  )
                : createContributionGoalZeroKarmaNotification(
                    locale,
                    goal.title,
                  );

            await sendToUser(goal.memberId.toString(), notification);
          } catch (notificationError) {
            // Log but don't fail processing if notification fails
            logger.error("Failed to send contribution goal notification", {
              goalId: goal._id.toString(),
              memberId: goal.memberId.toString(),
              error: notificationError,
            });
          }

          // Delete the goal after processing (per design decision - no history)
          // Delete the goal for the processed week before optionally creating next week's goal
          await this.contributionGoalRepository.deleteById(goal._id.toString());

          // If recurring, recreate the goal for the next week (no notifications on auto-create)
          if (goal.recurring) {
            const nextWeekStart = new Date(goal.weekStartDate);
            nextWeekStart.setUTCDate(goal.weekStartDate.getUTCDate() + 7);

            try {
              await this.contributionGoalRepository.createForWeek(
                goal.familyId.toString(),
                {
                  memberId: goal.memberId.toString(),
                  title: goal.title,
                  description: goal.description,
                  maxKarma: goal.maxKarma,
                  recurring: true,
                },
                nextWeekStart,
                new Date(),
              );
            } catch (createError) {
              logger.error("Failed to recreate recurring contribution goal", {
                goalId: goal._id.toString(),
                memberId: goal.memberId.toString(),
                familyId: goal.familyId.toString(),
                error: createError,
              });
            }
          }

          logger.info("Contribution goal processed and deleted successfully", {
            goalId: goal._id.toString(),
            memberId: goal.memberId.toString(),
          });

          successCount++;
        } catch (error) {
          errorCount++;
          logger.error("Failed to process contribution goal", {
            goalId: goal._id.toString(),
            memberId: goal.memberId.toString(),
            error,
          });
          // Continue processing remaining goals even if one fails
        }
      }

      logger.info("Weekly contribution goal processing completed", {
        totalGoals: goals.length,
        successCount,
        errorCount,
      });
    } catch (error) {
      logger.error("Failed to process weekly contribution goals", { error });
      throw error;
    }
  }
}
