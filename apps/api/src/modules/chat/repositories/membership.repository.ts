import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, ObjectId } from "mongodb";
import type { Membership } from "../domain/membership";

export class MembershipRepository {
  private collection: Collection<Membership>;

  constructor() {
    this.collection = getDb().collection<Membership>("chat_memberships");
  }

  /**
   * Ensure indexes are created for the chat_memberships collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Unique index to enforce one membership per user per chat
      await this.collection.createIndex(
        { chatId: 1, userId: 1 },
        { unique: true, name: "idx_chat_user_unique" },
      );

      // Compound index for finding memberships by user (for authorization)
      await this.collection.createIndex(
        { userId: 1, chatId: 1 },
        { name: "idx_user_chat" },
      );

      logger.info("Membership indexes created successfully");
    } catch (error) {
      logger.error("Failed to create membership indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new membership
   */
  async create(
    chatId: ObjectId,
    userId: ObjectId,
    role: "admin" | "member",
  ): Promise<Membership> {
    const now = new Date();

    const membership: Membership = {
      _id: new ObjectId(),
      chatId,
      userId,
      role,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(membership);

    return membership;
  }

  /**
   * Create multiple memberships in bulk
   */
  async createBulk(
    chatId: ObjectId,
    userRoles: Array<{ userId: ObjectId; role: "admin" | "member" }>,
  ): Promise<Membership[]> {
    const now = new Date();

    const memberships: Membership[] = userRoles.map((ur) => ({
      _id: new ObjectId(),
      chatId,
      userId: ur.userId,
      role: ur.role,
      createdAt: now,
      updatedAt: now,
    }));

    if (memberships.length > 0) {
      await this.collection.insertMany(memberships);
    }

    return memberships;
  }

  /**
   * Find membership for a specific user in a specific chat
   */
  async findByUserAndChat(
    userId: ObjectId,
    chatId: ObjectId,
  ): Promise<Membership | null> {
    return this.collection.findOne({ userId, chatId });
  }

  /**
   * Find all memberships for a specific chat
   */
  async findByChat(chatId: ObjectId): Promise<Membership[]> {
    return this.collection.find({ chatId }).toArray();
  }

  /**
   * Find all memberships for a specific user (all chats they're in)
   */
  async findByUser(userId: ObjectId): Promise<Membership[]> {
    return this.collection.find({ userId }).toArray();
  }

  /**
   * Update the read cursor (lastReadMessageId) for a membership
   */
  async updateReadCursor(
    membershipId: ObjectId,
    messageId: ObjectId,
  ): Promise<Membership | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: { $eq: membershipId } },
      {
        $set: {
          lastReadMessageId: messageId,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Update the role of a membership
   */
  async updateRole(
    membershipId: ObjectId,
    role: "admin" | "member",
  ): Promise<Membership | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: { $eq: membershipId } },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a membership
   */
  async delete(membershipId: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: { $eq: membershipId },
    });
    return result.deletedCount > 0;
  }
}
