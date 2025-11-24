import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId } from "@lib/objectid-utils";
import { type Collection, ObjectId, type UpdateFilter } from "mongodb";
import type {
  AddDeductionInput,
  ContributionGoal,
  CreateContributionGoalInput,
  Deduction,
  UpdateContributionGoalInput,
} from "../domain/contribution-goal";
import { getCurrentWeekStart } from "../lib/week-utils";

export class ContributionGoalRepository {
  private collection: Collection<ContributionGoal>;

  constructor() {
    this.collection =
      getDb().collection<ContributionGoal>("contribution_goals");
  }

  /**
   * Ensure indexes are created for the contribution_goals collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Unique compound index to ensure one goal per member per week
      await this.collection.createIndex(
        { familyId: 1, memberId: 1, weekStartDate: 1 },
        { name: "idx_family_member_week", unique: true },
      );

      // Index for efficient cron job queries
      await this.collection.createIndex(
        { weekStartDate: 1 },
        { name: "idx_week_start" },
      );

      logger.info("Contribution goal indexes created successfully");
    } catch (error) {
      logger.error("Failed to create contribution goal indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new contribution goal
   */
  async create(
    familyId: string,
    input: CreateContributionGoalInput,
  ): Promise<ContributionGoal> {
    const now = new Date();
    const weekStartDate = getCurrentWeekStart();

    return this.createForWeek(familyId, input, weekStartDate, now);
  }

  /**
   * Create a new contribution goal for a specific week start date
   */
  async createForWeek(
    familyId: string,
    input: CreateContributionGoalInput,
    weekStartDate: Date,
    now = new Date(),
  ): Promise<ContributionGoal> {
    const goal: ContributionGoal = {
      _id: new ObjectId(),
      familyId: toObjectId(familyId),
      memberId: toObjectId(input.memberId),
      weekStartDate,
      title: input.title,
      description: input.description,
      maxKarma: input.maxKarma,
      recurring: input.recurring ?? false,
      deductions: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(goal);

    return goal;
  }

  /**
   * Find a contribution goal by family and member for the current week
   */
  async findByFamilyAndMember(
    familyId: string,
    memberId: string,
  ): Promise<ContributionGoal | null> {
    const weekStartDate = getCurrentWeekStart();

    return this.collection.findOne({
      familyId: toObjectId(familyId),
      memberId: toObjectId(memberId),
      weekStartDate,
    });
  }

  /**
   * Find all active contribution goals for a specific week
   * Used by the cron job to process weekly karma awards
   */
  async findActiveGoalsForWeek(
    weekStartDate: Date,
  ): Promise<ContributionGoal[]> {
    return this.collection.find({ weekStartDate }).toArray();
  }

  /**
   * Update a contribution goal
   */
  async update(
    familyId: string,
    memberId: string,
    input: UpdateContributionGoalInput,
  ): Promise<ContributionGoal | null> {
    const weekStartDate = getCurrentWeekStart();
    const setFields: Partial<ContributionGoal> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) {
      setFields.title = input.title;
    }
    if (input.description !== undefined) {
      setFields.description = input.description;
    }
    if (input.maxKarma !== undefined) {
      setFields.maxKarma = input.maxKarma;
    }
    if (input.recurring !== undefined) {
      setFields.recurring = input.recurring;
    }

    const updateDoc: UpdateFilter<ContributionGoal> = {
      $set: setFields,
    };

    const result = await this.collection.findOneAndUpdate(
      {
        familyId: toObjectId(familyId),
        memberId: toObjectId(memberId),
        weekStartDate,
      },
      updateDoc,
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a contribution goal
   */
  async delete(familyId: string, memberId: string): Promise<boolean> {
    const weekStartDate = getCurrentWeekStart();

    const result = await this.collection.deleteOne({
      familyId: toObjectId(familyId),
      memberId: toObjectId(memberId),
      weekStartDate,
    });

    return result.deletedCount > 0;
  }

  /**
   * Add a deduction to a contribution goal using atomic $push operation
   */
  async addDeduction(
    familyId: string,
    memberId: string,
    input: AddDeductionInput,
    deductedBy: string,
  ): Promise<ContributionGoal | null> {
    const weekStartDate = getCurrentWeekStart();

    const deduction: Deduction = {
      _id: new ObjectId(),
      amount: input.amount,
      reason: input.reason,
      deductedBy: toObjectId(deductedBy),
      createdAt: new Date(),
    };

    const result = await this.collection.findOneAndUpdate(
      {
        familyId: toObjectId(familyId),
        memberId: toObjectId(memberId),
        weekStartDate,
      },
      {
        $push: { deductions: deduction },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a contribution goal by ID
   * Used by the cron job after awarding karma
   */
  async deleteById(goalId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: toObjectId(goalId),
    });

    return result.deletedCount > 0;
  }
}
