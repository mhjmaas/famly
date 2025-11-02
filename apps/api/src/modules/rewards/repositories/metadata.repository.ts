import { logger } from "@lib/logger";
import type { MongoClient, ObjectId } from "mongodb";
import type { RewardMetadata } from "../domain/reward";

/**
 * Repository for RewardMetadata operations
 * Uses composite key pattern: _id = `${familyId}_${rewardId}_${memberId}`
 */
export class MetadataRepository {
  private collectionName = "reward_metadata";

  constructor(private client: MongoClient) {}

  private getCollection() {
    const db = this.client.db("famly");
    return db.collection<RewardMetadata>(this.collectionName);
  }

  /**
   * Generate composite ID from components
   */
  private generateId(
    familyId: ObjectId,
    rewardId: ObjectId,
    memberId: ObjectId,
  ): string {
    return `${familyId}_${rewardId}_${memberId}`;
  }

  /**
   * Upsert favourite status for a member's reward
   */
  async upsertFavourite(
    familyId: ObjectId,
    rewardId: ObjectId,
    memberId: ObjectId,
    isFavourite: boolean,
  ): Promise<RewardMetadata> {
    const collection = this.getCollection();
    const _id = this.generateId(familyId, rewardId, memberId);

    const result = await collection.findOneAndUpdate(
      { _id },
      {
        $set: {
          familyId,
          rewardId,
          memberId,
          isFavourite,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          claimCount: 0,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    if (!result) {
      throw new Error("Failed to upsert favourite metadata");
    }

    logger.debug("Metadata favourite updated", {
      rewardId: rewardId.toString(),
      memberId: memberId.toString(),
      isFavourite,
    });

    return result;
  }

  /**
   * Increment claim count for a member's reward
   */
  async incrementClaimCount(
    familyId: ObjectId,
    rewardId: ObjectId,
    memberId: ObjectId,
  ): Promise<RewardMetadata | null> {
    const collection = this.getCollection();
    const _id = this.generateId(familyId, rewardId, memberId);

    const result = await collection.findOneAndUpdate(
      { _id },
      {
        $inc: { claimCount: 1 },
        $set: {
          familyId,
          rewardId,
          memberId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          isFavourite: false,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    logger.debug("Metadata claim count incremented", {
      rewardId: rewardId.toString(),
      memberId: memberId.toString(),
    });

    return result || null;
  }

  /**
   * Get metadata for a specific member and reward
   */
  async findByRewardAndMember(
    rewardId: ObjectId,
    memberId: ObjectId,
  ): Promise<RewardMetadata | null> {
    const collection = this.getCollection();
    // Note: We can't use generateId since we don't have familyId, so we query differently
    const metadata = await collection.findOne({
      rewardId,
      memberId,
    });
    return metadata || null;
  }

  /**
   * Get all favourite rewards for a member
   */
  async findFavouritesByMember(
    familyId: ObjectId,
    memberId: ObjectId,
  ): Promise<RewardMetadata[]> {
    const collection = this.getCollection();
    const favourites = await collection
      .find({
        familyId,
        memberId,
        isFavourite: true,
      })
      .toArray();
    return favourites;
  }

  /**
   * Get total claim count for a reward across all members
   */
  async getTotalClaimCount(rewardId: ObjectId): Promise<number> {
    const collection = this.getCollection();
    const result = await collection
      .aggregate([
        { $match: { rewardId } },
        { $group: { _id: null, total: { $sum: "$claimCount" } } },
      ])
      .toArray();

    return result.length > 0 ? result[0].total : 0;
  }

  /**
   * Get total favourite count for a reward
   */
  async getTotalFavouriteCount(rewardId: ObjectId): Promise<number> {
    const collection = this.getCollection();
    const count = await collection.countDocuments({
      rewardId,
      isFavourite: true,
    });
    return count;
  }

  /**
   * Get all metadata for a reward
   */
  async findByReward(rewardId: ObjectId): Promise<RewardMetadata[]> {
    const collection = this.getCollection();
    const metadata = await collection.find({ rewardId }).toArray();
    return metadata;
  }
}
