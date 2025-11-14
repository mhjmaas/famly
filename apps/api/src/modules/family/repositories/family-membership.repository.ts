import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId, toObjectIdArray } from "@lib/objectid-utils";
import { type Collection, ObjectId } from "mongodb";
import type { FamilyMembership, FamilyRole } from "../domain/family";

export class FamilyMembershipRepository {
  private collection: Collection<FamilyMembership>;

  constructor() {
    this.collection =
      getDb().collection<FamilyMembership>("family_memberships");
  }

  /**
   * Ensure indexes are created for the family_memberships collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Unique compound index to enforce single membership per user per family
      await this.collection.createIndex(
        { familyId: 1, userId: 1 },
        { unique: true, name: "idx_family_user_unique" },
      );

      // Index on userId for efficient lookups when listing user's families
      await this.collection.createIndex(
        { userId: 1 },
        { name: "idx_user_families" },
      );

      logger.info("Family membership indexes created successfully");
    } catch (error) {
      logger.error("Failed to create family membership indexes:", error);
      throw error;
    }
  }

  /**
   * Insert a new family membership
   *
   * @param familyId - The family ID (string)
   * @param userId - The user ID (string)
   * @param role - The role (Parent or Child)
   * @param addedBy - Optional: The user who added this member (string)
   * @returns The created membership document
   */
  async insertMembership(
    familyId: string,
    userId: string,
    role: FamilyRole,
    addedBy?: string,
  ): Promise<FamilyMembership> {
    const now = new Date();

    const membership: FamilyMembership = {
      _id: new ObjectId(),
      familyId: toObjectId(familyId),
      userId: toObjectId(userId),
      role,
      addedBy: addedBy ? toObjectId(addedBy) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(membership);

    return membership;
  }

  /**
   * Find a membership by family and user
   *
   * @param familyId - The family ID (string)
   * @param userId - The user ID (string)
   * @returns The membership document or null if not found
   */
  async findByFamilyAndUser(
    familyId: string,
    userId: string,
  ): Promise<FamilyMembership | null> {
    return this.collection.findOne({
      familyId: toObjectId(familyId),
      userId: toObjectId(userId),
    });
  }

  /**
   * Find all memberships for a user
   * Ordered by createdAt descending (newest first)
   *
   * @param userId - The user ID (string)
   * @returns Array of membership documents
   */
  async findByUser(userId: string): Promise<FamilyMembership[]> {
    return this.collection
      .find({ userId: toObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Find all memberships for a family
   *
   * @param familyId - The family ID (string)
   * @returns Array of membership documents
   */
  async findByFamily(familyId: string): Promise<FamilyMembership[]> {
    return this.collection
      .find({ familyId: toObjectId(familyId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Find all memberships for the provided family IDs
   *
   * @param familyIds - Array of family IDs (strings)
   * @returns Array of membership documents across the families
   */
  async findByFamilyIds(familyIds: string[]): Promise<FamilyMembership[]> {
    if (familyIds.length === 0) {
      return [];
    }

    return this.collection
      .find({ familyId: { $in: toObjectIdArray(familyIds) } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Update a member's role in a family
   *
   * @param familyId - The family ID (string)
   * @param userId - The user ID (string)
   * @param role - The new role (Parent or Child)
   * @returns True if updated, false if not found
   */
  async updateMemberRole(
    familyId: string,
    userId: string,
    role: FamilyRole,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { familyId: toObjectId(familyId), userId: toObjectId(userId) },
      { $set: { role, updatedAt: new Date() } },
    );
    return result.modifiedCount > 0;
  }

  /**
   * Delete a membership
   *
   * @param familyId - The family ID (string)
   * @param userId - The user ID (string)
   * @returns True if deleted, false if not found
   */
  async deleteMembership(familyId: string, userId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      familyId: toObjectId(familyId),
      userId: toObjectId(userId),
    });
    return result.deletedCount > 0;
  }
}
