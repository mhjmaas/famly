import { Collection, ObjectId } from 'mongodb';
import { getDb } from '@infra/mongo/client';
import { FamilyMembership, FamilyRole } from '../domain/family';
import { logger } from '@lib/logger';

export class FamilyMembershipRepository {
  private collection: Collection<FamilyMembership>;

  constructor() {
    this.collection = getDb().collection<FamilyMembership>('family_memberships');
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
        { unique: true, name: 'idx_family_user_unique' }
      );

      // Index on userId for efficient lookups when listing user's families
      await this.collection.createIndex(
        { userId: 1 },
        { name: 'idx_user_families' }
      );

      logger.info('Family membership indexes created successfully');
    } catch (error) {
      logger.error('Failed to create family membership indexes:', error);
      throw error;
    }
  }

  /**
   * Insert a new family membership
   *
   * @param familyId - The family ID
   * @param userId - The user ID
   * @param role - The role (Parent or Child)
   * @param addedBy - Optional: The user who added this member
   * @returns The created membership document
   */
  async insertMembership(
    familyId: ObjectId,
    userId: ObjectId,
    role: FamilyRole,
    addedBy?: ObjectId
  ): Promise<FamilyMembership> {
    const now = new Date();

    const membership: FamilyMembership = {
      _id: new ObjectId(),
      familyId,
      userId,
      role,
      addedBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(membership);

    return membership;
  }

  /**
   * Find a membership by family and user
   *
   * @param familyId - The family ID
   * @param userId - The user ID
   * @returns The membership document or null if not found
   */
  async findByFamilyAndUser(
    familyId: ObjectId,
    userId: ObjectId
  ): Promise<FamilyMembership | null> {
    return this.collection.findOne({ familyId, userId });
  }

  /**
   * Find all memberships for a user
   * Ordered by createdAt descending (newest first)
   *
   * @param userId - The user ID
   * @returns Array of membership documents
   */
  async findByUser(userId: ObjectId): Promise<FamilyMembership[]> {
    return this.collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Find all memberships for a family
   *
   * @param familyId - The family ID
   * @returns Array of membership documents
   */
  async findByFamily(familyId: ObjectId): Promise<FamilyMembership[]> {
    return this.collection
      .find({ familyId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Find all memberships for the provided family IDs
   *
   * @param familyIds - Array of family IDs
   * @returns Array of membership documents across the families
   */
  async findByFamilyIds(familyIds: ObjectId[]): Promise<FamilyMembership[]> {
    if (familyIds.length === 0) {
      return [];
    }

    return this.collection
      .find({ familyId: { $in: familyIds } })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Delete a membership
   *
   * @param familyId - The family ID
   * @param userId - The user ID
   * @returns True if deleted, false if not found
   */
  async deleteMembership(familyId: ObjectId, userId: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ familyId, userId });
    return result.deletedCount > 0;
  }
}
