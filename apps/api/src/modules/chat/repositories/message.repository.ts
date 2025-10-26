import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, ObjectId } from "mongodb";
import type { Message } from "../domain/message";

export class MessageRepository {
  private collection: Collection<Message>;

  constructor() {
    this.collection = getDb().collection<Message>("messages");
  }

  /**
   * Ensure indexes are created for the messages collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for pagination by chat (newest first)
      await this.collection.createIndex(
        { chatId: 1, createdAt: -1 },
        { name: "idx_chat_created" },
      );

      // Unique partial index for idempotency enforcement
      // Ensures at most one message per (chatId, clientId) pair
      // Only indexes documents where clientId exists (not null/undefined)
      await this.collection.createIndex(
        { chatId: 1, clientId: 1 },
        { 
          unique: true, 
          name: "idx_idempotency",
          partialFilterExpression: { clientId: { $type: "string" } }
        },
      );

      // Text index for message search
      // Note: Text indexes cannot be combined with regular fields in the key pattern
      await this.collection.createIndex(
        { body: "text" },
        { name: "idx_search" },
      );

      logger.info("Message indexes created successfully");
    } catch (error) {
      logger.error("Failed to create message indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new message
   */
  async create(
    chatId: ObjectId,
    senderId: ObjectId,
    body: string,
    clientId?: string,
  ): Promise<Message> {
    const now = new Date();

    const message: Message = {
      _id: new ObjectId(),
      chatId,
      senderId,
      body,
      clientId,
      createdAt: now,
      deleted: false,
    };

    await this.collection.insertOne(message);

    return message;
  }

  /**
   * Find a message by ID
   */
  async findById(messageId: ObjectId): Promise<Message | null> {
    return this.collection.findOne({ _id: messageId });
  }

  /**
   * Find messages for a chat with cursor pagination
   * Returns messages sorted by createdAt descending (newest first), with _id as tie-breaker
   * 
   * @param chatId - The chat to query messages from
   * @param before - Optional cursor (message ID) - will fetch messages older than this message's createdAt
   * @param limit - Maximum number of messages to return
   */
  async findByChatId(
    chatId: ObjectId,
    before?: ObjectId,
    limit: number = 50,
  ): Promise<Message[]> {
    // biome-ignore lint/suspicious/noExplicitAny: MongoDB query builder requires any
    let query: any = { chatId };

    // If cursor provided, get the message to find its createdAt timestamp
    if (before) {
      const cursorMessage = await this.findById(before);
      if (cursorMessage) {
        // Find messages older than the cursor message
        // Use compound condition: createdAt < cursor.createdAt OR (createdAt = cursor.createdAt AND _id < cursor._id)
        // Must use $and to combine chatId filter with $or condition
        query = {
          $and: [
            { chatId },
            {
              $or: [
                { createdAt: { $lt: cursorMessage.createdAt } },
                { 
                  createdAt: cursorMessage.createdAt,
                  _id: { $lt: before }
                }
              ]
            }
          ]
        };
      }
    }

    return this.collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Find a message by client ID (for idempotency checks)
   */
  async findByClientId(
    chatId: ObjectId,
    clientId: string,
  ): Promise<Message | null> {
    return this.collection.findOne({ chatId, clientId });
  }

  /**
   * Count the number of messages in a chat
   */
  async countByChatId(chatId: ObjectId): Promise<number> {
    return this.collection.countDocuments({ chatId });
  }

  /**
   * Count unread messages for a chat after a specific message ID
   * Messages are considered unread if they were created after the lastReadMessageId
   *
   * @param chatId - The chat ID
   * @param afterMessageId - Count messages created after this message ID (lastReadMessageId)
   * @returns The count of unread messages
   */
  async countUnreadMessages(
    chatId: ObjectId,
    afterMessageId: ObjectId,
  ): Promise<number> {
    return this.collection.countDocuments({
      chatId,
      _id: { $gt: afterMessageId },
    });
  }

  /**
   * Search messages across multiple chats
   * Uses MongoDB text search on message body
   * Results sorted by createdAt descending (newest first), with _id as tie-breaker
   */
  async search(
    chatIds: ObjectId[],
    query: string,
    cursor?: ObjectId,
    limit: number = 50,
  ): Promise<Message[]> {
    // biome-ignore lint/suspicious/noExplicitAny: MongoDB query builder requires any
    const searchQuery: any = {
      chatId: { $in: chatIds },
      $text: { $search: query },
    };

    // If cursor provided, get the message to find its createdAt timestamp
    if (cursor) {
      const cursorMessage = await this.findById(cursor);
      if (cursorMessage) {
        // Find messages older than the cursor message
        const dateConditions = [
          { createdAt: { $lt: cursorMessage.createdAt } },
          { 
            createdAt: cursorMessage.createdAt,
            _id: { $lt: cursor }
          }
        ];
        
        // Combine with existing conditions
        if (searchQuery.$or) {
          searchQuery.$and = [{ $or: searchQuery.$or }, { $or: dateConditions }];
          delete searchQuery.$or;
        } else {
          searchQuery.$or = dateConditions;
        }
      }
    }

    return this.collection
      .find(searchQuery)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();
  }
}
