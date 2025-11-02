import { logger } from "@lib/logger";
import type { MongoClient, ObjectId } from "mongodb";
import type { ClaimStatus, RewardClaim } from "../domain/reward";

/**
 * Repository for RewardClaim CRUD operations
 */
export class ClaimRepository {
  private collectionName = "reward_claims";

  constructor(private client: MongoClient) {}

  private getCollection() {
    const db = this.client.db("famly");
    return db.collection<RewardClaim>(this.collectionName);
  }

  /**
   * Create a new claim
   */
  async create(
    rewardId: ObjectId,
    familyId: ObjectId,
    memberId: ObjectId,
  ): Promise<RewardClaim> {
    const collection = this.getCollection();

    const claim: RewardClaim = {
      _id: new (await import("mongodb")).ObjectId(),
      rewardId,
      familyId,
      memberId,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(claim);
    logger.debug("Claim created", { claimId: claim._id.toString() });
    return claim;
  }

  /**
   * Find claim by ID
   */
  async findById(claimId: ObjectId): Promise<RewardClaim | null> {
    const collection = this.getCollection();
    const claim = await collection.findOne({ _id: claimId });
    return claim || null;
  }

  /**
   * Find all claims for a specific member
   */
  async findByMember(
    familyId: ObjectId,
    memberId: ObjectId,
  ): Promise<RewardClaim[]> {
    const collection = this.getCollection();
    const claims = await collection
      .find({ familyId, memberId })
      .sort({ createdAt: -1 })
      .toArray();
    return claims;
  }

  /**
   * Find all claims for a family
   */
  async findByFamily(familyId: ObjectId): Promise<RewardClaim[]> {
    const collection = this.getCollection();
    const claims = await collection
      .find({ familyId })
      .sort({ createdAt: -1 })
      .toArray();
    return claims;
  }

  /**
   * Update claim status
   */
  async updateStatus(
    claimId: ObjectId,
    status: ClaimStatus,
    metadata?: {
      completedBy?: ObjectId;
      completedAt?: Date;
      cancelledBy?: ObjectId;
      cancelledAt?: Date;
    },
  ): Promise<RewardClaim | null> {
    const collection = this.getCollection();

    const updateData: Partial<RewardClaim> = {
      status,
      updatedAt: new Date(),
    };

    if (metadata?.completedBy) updateData.completedBy = metadata.completedBy;
    if (metadata?.completedAt) updateData.completedAt = metadata.completedAt;
    if (metadata?.cancelledBy) updateData.cancelledBy = metadata.cancelledBy;
    if (metadata?.cancelledAt) updateData.cancelledAt = metadata.cancelledAt;

    const result = await collection.findOneAndUpdate(
      { _id: claimId },
      { $set: updateData },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Find pending claim for a member and reward combination
   */
  async findPendingByRewardAndMember(
    rewardId: ObjectId,
    memberId: ObjectId,
  ): Promise<RewardClaim | null> {
    const collection = this.getCollection();
    const claim = await collection.findOne({
      rewardId,
      memberId,
      status: "pending",
    });
    return claim || null;
  }

  /**
   * Update claim with auto-task ID
   */
  async updateAutoTaskId(
    claimId: ObjectId,
    autoTaskId: ObjectId,
  ): Promise<RewardClaim | null> {
    const collection = this.getCollection();

    const result = await collection.findOneAndUpdate(
      { _id: claimId },
      {
        $set: {
          autoTaskId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Find claim by auto-task ID
   */
  async findByAutoTaskId(autoTaskId: ObjectId): Promise<RewardClaim | null> {
    const collection = this.getCollection();
    const claim = await collection.findOne({ autoTaskId });
    return claim || null;
  }

  /**
   * Delete a claim (used during cancellation)
   */
  async delete(claimId: ObjectId): Promise<boolean> {
    const collection = this.getCollection();
    const result = await collection.deleteOne({ _id: claimId });
    return result.deletedCount > 0;
  }
}
