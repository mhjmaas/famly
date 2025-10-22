import { settings } from "@config/settings";
import { logger } from "@lib/logger";
import { type Db, MongoClient } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  // In test environment, use directConnection for standalone MongoDB containers
  // In production/dev, connect normally (works with both standalone and replica sets)
  const options: Record<string, unknown> = {
    maxPoolSize: settings.isProduction ? 50 : 10,
    minPoolSize: settings.isProduction ? 5 : 0,
  };

  // Use directConnection in test mode for testcontainers compatibility
  if (settings.isTest) {
    options.directConnection = true;
  }

  client = new MongoClient(settings.mongodbUri, options);

  try {
    await client.connect();
    logger.info("Connected to MongoDB");

    db = client.db("famly");

    // Verify connection
    await db.admin().ping();
    logger.info("MongoDB ping successful");

    return db;
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    if (client) {
      await client.close();
      client = null;
    }
    throw error;
  }
}

export async function disconnectMongo(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info("Disconnected from MongoDB");
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB not connected. Call connectMongo() first.");
  }
  return db;
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error(
      "MongoDB client not initialized. Call connectMongo() first.",
    );
  }
  return client;
}
