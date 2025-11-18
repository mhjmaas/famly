import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { type ObjectIdString, validateObjectId } from "@lib/objectid-utils";
import type { ActivityEventService } from "@modules/activity-events";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type {
  CreateScheduleInput,
  TaskSchedule,
  UpdateScheduleInput,
} from "../domain/task";
import type { ScheduleRepository } from "../repositories/schedule.repository";
import type { TaskGeneratorService } from "./task-generator.service";

export class ScheduleService {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private membershipRepository: FamilyMembershipRepository,
    private activityEventService?: ActivityEventService, // Optional for activity tracking
    private taskGeneratorService?: TaskGeneratorService,
  ) {}

  /**
   * Create a new task schedule
   */
  async createSchedule(
    familyId: string,
    userId: string,
    input: CreateScheduleInput,
  ): Promise<TaskSchedule> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Creating task schedule", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        name: input.name,
      });

      await this.verifyFamilyMembership(normalizedFamilyId, normalizedUserId);

      // Check karma authorization: only parents can set karma on schedules
      if (input.metadata?.karma) {
        const membership = await this.membershipRepository.findByFamilyAndUser(
          normalizedFamilyId,
          normalizedUserId,
        );

        if (!membership || membership.role !== FamilyRole.Parent) {
          throw HttpError.forbidden("Only parents can set karma on tasks");
        }
      }

      const schedule = await this.scheduleRepository.createSchedule(
        normalizedFamilyId,
        input,
        normalizedUserId,
      );

      logger.info("Task schedule created successfully", {
        scheduleId: schedule._id.toString(),
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      // Record activity event for schedule creation
      if (this.activityEventService) {
        try {
          await this.activityEventService.recordEvent({
            userId: normalizedUserId,
            type: "TASK",
            title: schedule.name,
            description: schedule.description,
            metadata: schedule.metadata?.karma
              ? { karma: schedule.metadata.karma }
              : undefined,
          });
        } catch (error) {
          // Log error but don't fail schedule creation
          logger.error(
            "Failed to record activity event for schedule creation",
            {
              scheduleId: schedule._id.toString(),
              error,
            },
          );
        }
      }

      if (this.taskGeneratorService) {
        try {
          await this.taskGeneratorService.generateTaskForSchedule(
            schedule,
            new Date(),
          );
        } catch (error) {
          logger.error("Failed to generate initial task for new schedule", {
            scheduleId: schedule._id.toString(),
            familyId,
            error,
          });
        }
      }

      return schedule;
    } catch (error) {
      logger.error("Failed to create task schedule", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * List all schedules for a family
   */
  async listSchedulesForFamily(
    familyId: string,
    userId: string,
  ): Promise<TaskSchedule[]> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Listing schedules for family", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.verifyFamilyMembership(normalizedFamilyId, normalizedUserId);

      const schedules =
        await this.scheduleRepository.findSchedulesByFamily(normalizedFamilyId);

      return schedules;
    } catch (error) {
      logger.error("Failed to list schedules for family", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific schedule by ID
   */
  async getScheduleById(
    familyId: string,
    scheduleId: string,
    userId: string,
  ): Promise<TaskSchedule> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedScheduleId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedScheduleId = validateObjectId(scheduleId, "scheduleId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Getting schedule by ID", {
        scheduleId: normalizedScheduleId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.verifyFamilyMembership(normalizedFamilyId, normalizedUserId);

      const schedule =
        await this.scheduleRepository.findScheduleById(normalizedScheduleId);

      if (!schedule) {
        throw HttpError.notFound("Schedule not found");
      }

      // Verify schedule belongs to the specified family
      if (schedule.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden("Schedule does not belong to this family");
      }

      return schedule;
    } catch (error) {
      logger.error("Failed to get schedule by ID", {
        scheduleId: normalizedScheduleId ?? scheduleId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    familyId: string,
    scheduleId: string,
    userId: string,
    input: UpdateScheduleInput,
  ): Promise<TaskSchedule> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedScheduleId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedScheduleId = validateObjectId(scheduleId, "scheduleId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Updating schedule", {
        scheduleId: normalizedScheduleId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.verifyFamilyMembership(normalizedFamilyId, normalizedUserId);

      const existingSchedule =
        await this.scheduleRepository.findScheduleById(normalizedScheduleId);
      if (!existingSchedule) {
        throw HttpError.notFound("Schedule not found");
      }

      if (existingSchedule.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden("Schedule does not belong to this family");
      }

      const updatedSchedule = await this.scheduleRepository.updateSchedule(
        normalizedScheduleId,
        input,
      );

      if (!updatedSchedule) {
        throw HttpError.notFound("Schedule not found");
      }

      logger.info("Schedule updated successfully", {
        scheduleId: normalizedScheduleId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      return updatedSchedule;
    } catch (error) {
      logger.error("Failed to update schedule", {
        scheduleId: normalizedScheduleId ?? scheduleId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(
    familyId: string,
    scheduleId: string,
    userId: string,
  ): Promise<void> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedScheduleId: ObjectIdString | undefined;
    let normalizedUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedScheduleId = validateObjectId(scheduleId, "scheduleId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Deleting schedule", {
        scheduleId: normalizedScheduleId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await this.verifyFamilyMembership(normalizedFamilyId, normalizedUserId);

      const existingSchedule =
        await this.scheduleRepository.findScheduleById(normalizedScheduleId);
      if (!existingSchedule) {
        throw HttpError.notFound("Schedule not found");
      }

      if (existingSchedule.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden("Schedule does not belong to this family");
      }

      // Delete the schedule
      const deleted =
        await this.scheduleRepository.deleteSchedule(normalizedScheduleId);

      if (!deleted) {
        throw HttpError.notFound("Schedule not found");
      }

      logger.info("Schedule deleted successfully", {
        scheduleId: normalizedScheduleId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });
    } catch (error) {
      logger.error("Failed to delete schedule", {
        scheduleId: normalizedScheduleId ?? scheduleId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Verify that a user is a member of a family
   */
  private async verifyFamilyMembership(
    familyId: ObjectIdString,
    userId: ObjectIdString,
  ): Promise<void> {
    const membership = await this.membershipRepository.findByFamilyAndUser(
      familyId,
      userId,
    );

    if (!membership) {
      throw HttpError.forbidden("User is not a member of this family");
    }
  }
}
