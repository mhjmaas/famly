import { ObjectId } from "mongodb";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import {
  CreateScheduleInput,
  UpdateScheduleInput,
  TaskSchedule,
} from "../domain/task";
import { logger } from "@lib/logger";
import { HttpError } from "@lib/http-error";

export class ScheduleService {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private membershipRepository: FamilyMembershipRepository,
  ) {}

  /**
   * Create a new task schedule
   */
  async createSchedule(
    familyId: ObjectId,
    userId: ObjectId,
    input: CreateScheduleInput,
  ): Promise<TaskSchedule> {
    try {
      logger.info("Creating task schedule", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        name: input.name,
      });

      // Verify user is a member of the family
      await this.verifyFamilyMembership(familyId, userId);

      // Create the schedule
      const schedule = await this.scheduleRepository.createSchedule(
        familyId,
        input,
        userId,
      );

      logger.info("Task schedule created successfully", {
        scheduleId: schedule._id.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return schedule;
    } catch (error) {
      logger.error("Failed to create task schedule", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * List all schedules for a family
   */
  async listSchedulesForFamily(
    familyId: ObjectId,
    userId: ObjectId,
  ): Promise<TaskSchedule[]> {
    try {
      logger.debug("Listing schedules for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await this.verifyFamilyMembership(familyId, userId);

      // Fetch schedules
      const schedules =
        await this.scheduleRepository.findSchedulesByFamily(familyId);

      return schedules;
    } catch (error) {
      logger.error("Failed to list schedules for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific schedule by ID
   */
  async getScheduleById(
    familyId: ObjectId,
    scheduleId: ObjectId,
    userId: ObjectId,
  ): Promise<TaskSchedule> {
    try {
      logger.debug("Getting schedule by ID", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await this.verifyFamilyMembership(familyId, userId);

      // Fetch the schedule
      const schedule =
        await this.scheduleRepository.findScheduleById(scheduleId);

      if (!schedule) {
        throw HttpError.notFound("Schedule not found");
      }

      // Verify schedule belongs to the specified family
      if (schedule.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden("Schedule does not belong to this family");
      }

      return schedule;
    } catch (error) {
      logger.error("Failed to get schedule by ID", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    familyId: ObjectId,
    scheduleId: ObjectId,
    userId: ObjectId,
    input: UpdateScheduleInput,
  ): Promise<TaskSchedule> {
    try {
      logger.info("Updating schedule", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await this.verifyFamilyMembership(familyId, userId);

      // Verify schedule exists and belongs to family
      const existingSchedule =
        await this.scheduleRepository.findScheduleById(scheduleId);
      if (!existingSchedule) {
        throw HttpError.notFound("Schedule not found");
      }

      if (existingSchedule.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden("Schedule does not belong to this family");
      }

      // Update the schedule
      const updatedSchedule = await this.scheduleRepository.updateSchedule(
        scheduleId,
        input,
      );

      if (!updatedSchedule) {
        throw HttpError.notFound("Schedule not found");
      }

      logger.info("Schedule updated successfully", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return updatedSchedule;
    } catch (error) {
      logger.error("Failed to update schedule", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(
    familyId: ObjectId,
    scheduleId: ObjectId,
    userId: ObjectId,
  ): Promise<void> {
    try {
      logger.info("Deleting schedule", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await this.verifyFamilyMembership(familyId, userId);

      // Verify schedule exists and belongs to family
      const existingSchedule =
        await this.scheduleRepository.findScheduleById(scheduleId);
      if (!existingSchedule) {
        throw HttpError.notFound("Schedule not found");
      }

      if (existingSchedule.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden("Schedule does not belong to this family");
      }

      // Delete the schedule
      const deleted = await this.scheduleRepository.deleteSchedule(scheduleId);

      if (!deleted) {
        throw HttpError.notFound("Schedule not found");
      }

      logger.info("Schedule deleted successfully", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });
    } catch (error) {
      logger.error("Failed to delete schedule", {
        scheduleId: scheduleId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Verify that a user is a member of a family
   */
  private async verifyFamilyMembership(
    familyId: ObjectId,
    userId: ObjectId,
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
