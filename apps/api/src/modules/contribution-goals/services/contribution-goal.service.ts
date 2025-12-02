import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { type ObjectIdString, validateObjectId } from "@lib/objectid-utils";
import { getUserLanguage } from "@lib/user-utils";
import type { ActivityEventService } from "@modules/activity-events";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import {
  createContributionGoalDeductionNotification,
  sendToUser,
} from "@modules/notifications";
import type {
  AddDeductionInput,
  ContributionGoal,
  CreateContributionGoalInput,
  UpdateContributionGoalInput,
} from "../domain/contribution-goal";
import {
  emitContributionGoalDeducted,
  emitContributionGoalUpdated,
} from "../events/contribution-goal-events";
import type { ContributionGoalRepository } from "../repositories/contribution-goal.repository";

export class ContributionGoalService {
  constructor(
    private contributionGoalRepository: ContributionGoalRepository,
    private membershipRepository: FamilyMembershipRepository,
    private activityEventService?: ActivityEventService,
  ) {}

  /**
   * Create a new contribution goal
   * Only parents can create contribution goals
   */
  async createContributionGoal(
    familyId: string,
    userId: string,
    input: CreateContributionGoalInput,
  ): Promise<ContributionGoal> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Creating contribution goal", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        memberId: input.memberId,
        title: input.title,
      });

      // Require parent role to create contribution goals
      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent],
        membershipRepository: this.membershipRepository,
      });

      // Verify the target member belongs to the family
      const targetMember = await this.membershipRepository.findByFamilyAndUser(
        normalizedFamilyId,
        input.memberId,
      );

      if (!targetMember) {
        throw HttpError.notFound("Target member not found in family");
      }

      const goal = await this.contributionGoalRepository.create(
        normalizedFamilyId,
        input,
      );

      logger.info("Contribution goal created successfully", {
        goalId: goal._id.toString(),
        familyId,
        memberId: input.memberId,
      });

      // Emit real-time event for goal creation
      emitContributionGoalUpdated(goal, "CREATED");

      return goal;
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("E11000")) {
        throw HttpError.badRequest(
          "This member already has a contribution goal for the current week",
        );
      }

      logger.error("Failed to create contribution goal", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get a contribution goal for a member
   * Any family member can view contribution goals
   */
  async getContributionGoal(
    familyId: string,
    userId: string,
    memberId: string,
  ): Promise<ContributionGoal | null> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      // Verify user is a member of the family
      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      const goal = await this.contributionGoalRepository.findByFamilyAndMember(
        normalizedFamilyId,
        memberId,
      );

      return goal;
    } catch (error) {
      logger.error("Failed to get contribution goal", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        memberId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update a contribution goal
   * Only parents can update contribution goals
   */
  async updateContributionGoal(
    familyId: string,
    userId: string,
    memberId: string,
    input: UpdateContributionGoalInput,
  ): Promise<ContributionGoal> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Updating contribution goal", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        memberId,
      });

      // Require parent role to update contribution goals
      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent],
        membershipRepository: this.membershipRepository,
      });

      const goal = await this.contributionGoalRepository.update(
        normalizedFamilyId,
        memberId,
        input,
      );

      if (!goal) {
        throw HttpError.notFound("Contribution goal not found");
      }

      logger.info("Contribution goal updated successfully", {
        goalId: goal._id.toString(),
        familyId,
        memberId,
      });

      // Emit real-time event for goal update
      emitContributionGoalUpdated(goal, "UPDATED");

      return goal;
    } catch (error) {
      logger.error("Failed to update contribution goal", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        memberId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a contribution goal
   * Only parents can delete contribution goals
   */
  async deleteContributionGoal(
    familyId: string,
    userId: string,
    memberId: string,
  ): Promise<void> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Deleting contribution goal", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        memberId,
      });

      // Require parent role to delete contribution goals
      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent],
        membershipRepository: this.membershipRepository,
      });

      // First get the goal to emit the event
      const goal = await this.contributionGoalRepository.findByFamilyAndMember(
        normalizedFamilyId,
        memberId,
      );

      const deleted = await this.contributionGoalRepository.delete(
        normalizedFamilyId,
        memberId,
      );

      if (!deleted) {
        throw HttpError.notFound("Contribution goal not found");
      }

      logger.info("Contribution goal deleted successfully", {
        familyId,
        memberId,
      });

      // Emit real-time event for goal deletion
      if (goal) {
        emitContributionGoalUpdated(goal, "DELETED");
      }
    } catch (error) {
      logger.error("Failed to delete contribution goal", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        memberId,
        error,
      });
      throw error;
    }
  }

  /**
   * Add a deduction to a contribution goal
   * Only parents can add deductions
   */
  async addDeduction(
    familyId: string,
    userId: string,
    memberId: string,
    input: AddDeductionInput,
  ): Promise<ContributionGoal> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Adding deduction to contribution goal", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        memberId,
        amount: input.amount,
        reason: input.reason,
      });

      // Require parent role to add deductions
      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent],
        membershipRepository: this.membershipRepository,
      });

      const goal = await this.contributionGoalRepository.addDeduction(
        normalizedFamilyId,
        memberId,
        input,
        normalizedUserId,
      );

      if (!goal) {
        throw HttpError.notFound("Contribution goal not found");
      }

      logger.info("Deduction added successfully", {
        goalId: goal._id.toString(),
        familyId,
        memberId,
        amount: input.amount,
      });

      // Record activity event for the deduction (include the reason so it shows in the activity feed)
      if (this.activityEventService) {
        await this.activityEventService.recordEvent({
          userId: validateObjectId(memberId, "userId"),
          type: "CONTRIBUTION_GOAL",
          detail: "DEDUCTED",
          title: `Deduction: ${input.reason}`,
          description: `${input.amount} karma deducted from contribution goal "${goal.title}" because: "${input.reason}"`,
          metadata: {
            karma: -input.amount,
            triggeredBy: normalizedUserId,
          },
          templateKey: "activity.contributionGoal.deductedWithReason",
          templateParams: {
            amount: input.amount,
            goalTitle: goal.title,
            reason: input.reason,
          },
        });
      }

      // Get the latest deduction that was just added
      const latestDeduction = goal.deductions[goal.deductions.length - 1];

      // Emit real-time event for deduction
      emitContributionGoalDeducted(goal, latestDeduction);

      // Send push notification to the member about the deduction (localized)
      try {
        const locale = await getUserLanguage(memberId);
        const notification = createContributionGoalDeductionNotification(
          locale,
          input.amount,
          input.reason,
        );
        await sendToUser(memberId, notification);
      } catch (notificationError) {
        logger.error("Failed to send deduction notification", {
          familyId: normalizedFamilyId,
          memberId,
          error: notificationError,
        });
      }

      return goal;
    } catch (error) {
      logger.error("Failed to add deduction", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        memberId,
        error,
      });
      throw error;
    }
  }
}
