import { createHash } from "node:crypto";
import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, type Filter, ObjectId } from "mongodb";
import type { Chat } from "../domain/chat";

export class ChatRepository {
  private collection: Collection<Chat>;

  constructor() {
    this.collection = getDb().collection<Chat>("chats");
  }

  /**
   * Generate a hash of sorted member IDs for DM deduplication
   * Ensures consistent hash regardless of argument order
   */
  private generateMemberIdsHash(memberIds: ObjectId[]): string {
    const sorted = memberIds
      .map((id) => id.toString())
      .sort()
      .join("|");
    return createHash("sha256").update(sorted).digest("hex");
  }

  /**
   * Ensure indexes are created for the chats collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for finding chats by members (for listing user's chats)
      await this.collection.createIndex(
        { memberIds: 1, updatedAt: -1 },
        { name: "idx_members_updated" },
      );

      // Unique partial index for DM deduplication using memberIdsHash
      // This ensures at most one DM exists between two users
      // We use memberIdsHash instead of memberIds array because MongoDB's unique
      // index on array fields creates index entries per element, not per array
      // Only indexes documents where memberIdsHash exists (not null/undefined)
      await this.collection.createIndex(
        { type: 1, memberIdsHash: 1 },
        {
          unique: true,
          name: "idx_dm_unique",
          partialFilterExpression: { memberIdsHash: { $type: "string" } },
        },
      );

      logger.info("Chat indexes created successfully");
    } catch (error) {
      logger.error("Failed to create chat indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new chat
   */
  async create(
    type: "dm" | "group",
    creatorId: ObjectId,
    memberIds: ObjectId[],
    title?: string | null,
  ): Promise<Chat> {
    const now = new Date();

    const chat: Chat = {
      _id: new ObjectId(),
      type,
      title: title ?? null,
      createdBy: creatorId,
      memberIds,
      // For DMs, generate a hash for deduplication
      // For groups, memberIdsHash is not set (sparse index handles this)
      ...(type === "dm" && {
        memberIdsHash: this.generateMemberIdsHash(memberIds),
      }),
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(chat);

    return chat;
  }

  /**
   * Find a chat by ID
   */
  async findById(chatId: ObjectId): Promise<Chat | null> {
    return this.collection.findOne({ _id: { $eq: chatId } });
  }

  /**
   * Find a DM chat by member IDs (for deduplication)
   * Returns the first (and should be only) DM between these two users
   */
  async findByMemberIds(memberIds: ObjectId[]): Promise<Chat | null> {
    const memberIdsHash = this.generateMemberIdsHash(memberIds);
    return this.collection.findOne({
      type: "dm",
      memberIdsHash,
    });
  }

  /**
   * Update the members array of a chat
   */
  async updateMembers(
    chatId: ObjectId,
    memberIds: ObjectId[],
  ): Promise<Chat | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: { $eq: chatId } },
      {
        $set: {
          memberIds,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Update the updatedAt timestamp of a chat
   */
  async updateTimestamp(chatId: ObjectId): Promise<Chat | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: { $eq: chatId } },
      {
        $set: {
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Find chats by IDs with cursor pagination, sorted by updatedAt descending
   */
  async findByIdsWithPagination(
    chatIds: ObjectId[],
    cursor?: ObjectId,
    limit: number = 20,
  ): Promise<Chat[]> {
    let query: Filter<Chat> = { _id: { $in: chatIds } };

    if (cursor) {
      // Only include chats that come before the cursor in sort order (updatedAt descending)
      query = {
        _id: { $in: chatIds, $lt: cursor },
      };
    }

    return this.collection
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
  }
}
