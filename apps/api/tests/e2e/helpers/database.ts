import { MongoClient } from "mongodb";

let mongoClient: MongoClient | null = null;

/**
 * Get MongoDB client for test utilities.
 * Uses the connection URI from global setup.
 */
async function getMongoClient(): Promise<MongoClient> {
  if (!mongoClient) {
    const mongoUri = process.env.MONGODB_URI || global.__MONGO_URI__;
    if (!mongoUri) {
      throw new Error("MongoDB URI not found. Ensure global setup has run.");
    }
    mongoClient = new MongoClient(mongoUri, { directConnection: true });
    await mongoClient.connect();
  }
  return mongoClient;
}

/**
 * Clean database between tests.
 * Uses parallel deletion for speed.
 */
export async function cleanDatabase(): Promise<void> {
  const client = await getMongoClient();
  const db = client.db("famly");

  // Get all collections
  const collections = await db.listCollections().toArray();

  // Delete all documents in parallel (much faster than sequential)
  await Promise.all(
    collections.map(async (collection) => {
      const count = await db.collection(collection.name).countDocuments();
      if (count > 0) {
        await db.collection(collection.name).deleteMany({});
      }
    }),
  );
}

/**
 * Clear auth-related caches.
 * Clears JWKS cache and resets Better Auth instance to prevent stale state.
 */
export async function clearAuthCaches(): Promise<void> {
  // Clear JWKS cache to force re-fetching keys
  try {
    const { clearJWKSCache } = await import(
      "@modules/auth/middleware/jwt-verify"
    );
    clearJWKSCache();
  } catch (_error) {
    // Ignore if module not available
  }

  // Reset Better Auth instance to clear any internal state corruption
  try {
    const { resetAuth } = await import("@modules/auth/better-auth");
    resetAuth();
  } catch (_error) {
    // Ignore if module not available
  }
}

/**
 * Drop entire database (fastest cleanup, use sparingly).
 */
export async function dropDatabase(): Promise<void> {
  const client = await getMongoClient();
  const db = client.db();
  await db.dropDatabase();
}

/**
 * Close MongoDB client connection.
 * Called in global teardown.
 */
export async function closeMongoClient(): Promise<void> {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
}
