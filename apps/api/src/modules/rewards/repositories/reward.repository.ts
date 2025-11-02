import { logger } from "@lib/logger";
import type { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";
import type { CreateRewardInput, Reward, UpdateRewardInput } from "../domain/reward";

/**
 * Repository for Reward CRUD operations
 */
export class RewardRepository {
  private collectionName = "rewards";

  constructor(private client: MongoClient) {}

  private getCollection() {
    const db = this.client.db("famly");
    return db.collection<Reward>(this.collectionName);
  }

  /**
   * Create a new reward
   */
  async create(
    familyId: ObjectId,
    input: CreateRewardInput,
    createdBy: ObjectId,
  ): Promise<Reward> {
    const collection = this.getCollection();

    const reward: Reward = {
      _id: new (await import("mongodb")).ObjectId(),
      familyId,
      name: input.name,
      description: input.description,
      karmaCost: input.karmaCost,
      imageUrl: input.imageUrl,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(reward);
    logger.debug("Reward created", { rewardId: reward._id.toString() });
    return reward;
  }

  /**
   * Find reward by ID
   */
  async findById(rewardId: ObjectId): Promise<Reward | null> {
    const collection = this.getCollection();
    const reward = await collection.findOne({ _id: rewardId });
    return reward || null;
  }

  /**
   * Find all rewards for a family
   */
  async findByFamily(familyId: ObjectId): Promise<Reward[]> {
    const collection = this.getCollection();
    const rewards = await collection
      .find({ familyId })
      .sort({ createdAt: -1 })
      .toArray();
    return rewards;
  }

  /**
   * Update a reward
   */
  async update(
    rewardId: ObjectId,
    input: UpdateRewardInput,
  ): Promise<Reward | null> {
    const collection = this.getCollection();

    const updateData: Partial<Reward> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.karmaCost !== undefined) updateData.karmaCost = input.karmaCost;
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl;

    const result = await collection.findOneAndUpdate(
      { _id: rewardId },
      { $set: updateData },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a reward
   */
  async delete(rewardId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: rewardId });
    return result.deletedCount > 0;
  }

  /**
   * Check if reward has any pending claims
   */
  async hasPendingClaims(rewardId: ObjectId): Promise<boolean> {
    const db = this.client.db("famly");
    const claimsCollection = db.collection("reward_claims");
    const count = await claimsCollection.countDocuments({
      rewardId,
      status: "pending",
    });
    return count > 0;
  }
}
