import { ObjectId } from "mongodb";
import { getMongoClient } from "../../../infra/mongo/client";
import type {
  CreatePushSubscriptionInput,
  PushSubscription,
  PushSubscriptionDocument,
} from "../domain/push-subscription";
import { toPushSubscription } from "../lib/push-subscription.mapper";

const COLLECTION_NAME = "push_subscriptions";

export class PushSubscriptionRepository {
  private async getCollection() {
    const client = await getMongoClient();
    return client.db().collection<PushSubscriptionDocument>(COLLECTION_NAME);
  }

  async create(input: CreatePushSubscriptionInput): Promise<PushSubscription> {
    const collection = await this.getCollection();
    const now = new Date();

    const doc: PushSubscriptionDocument = {
      _id: new ObjectId(),
      userId: new ObjectId(input.userId),
      endpoint: input.endpoint,
      keys: input.keys,
      deviceInfo: input.deviceInfo,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(doc);
    return toPushSubscription(doc);
  }

  async upsertByEndpoint(
    input: CreatePushSubscriptionInput,
  ): Promise<PushSubscription> {
    const collection = await this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { endpoint: input.endpoint },
      {
        $set: {
          userId: new ObjectId(input.userId),
          keys: input.keys,
          deviceInfo: input.deviceInfo,
          updatedAt: now,
        },
        $setOnInsert: {
          _id: new ObjectId(),
          endpoint: input.endpoint,
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    if (!result) {
      throw new Error("Failed to upsert subscription");
    }

    return toPushSubscription(result);
  }

  async findByUserId(userId: string): Promise<PushSubscription[]> {
    const collection = await this.getCollection();
    const docs = await collection
      .find({ userId: new ObjectId(userId) })
      .toArray();

    return docs.map(toPushSubscription);
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ endpoint });

    return doc ? toPushSubscription(doc) : null;
  }

  async deleteByEndpoint(endpoint: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ endpoint });

    return result.deletedCount > 0;
  }

  async deleteById(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({
      _id: { $eq: new ObjectId(id) },
    });

    return result.deletedCount > 0;
  }

  async existsByEndpoint(endpoint: string): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments({ endpoint }, { limit: 1 });

    return count > 0;
  }

  async ensureIndexes(): Promise<void> {
    const collection = await this.getCollection();

    await collection.createIndex({ endpoint: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
  }
}
