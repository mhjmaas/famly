import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, ObjectId } from "mongodb";
import type {
  DeploymentConfig,
  DeploymentMode,
} from "../domain/deployment-config";

export class DeploymentConfigRepository {
  private collection: Collection<DeploymentConfig>;

  constructor() {
    this.collection = getDb().collection<DeploymentConfig>("deployment_config");
  }

  /**
   * Ensure indexes are created for the deployment_config collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // No indexes needed for singleton collection
      logger.info("DeploymentConfig indexes ensured (none required)");
    } catch (error) {
      logger.error("Failed to ensure deployment_config indexes:", error);
      throw error;
    }
  }

  /**
   * Get the deployment configuration (singleton)
   *
   * @returns The deployment config document or null if not found
   */
  async get(): Promise<DeploymentConfig | null> {
    return this.collection.findOne({});
  }

  /**
   * Create the deployment configuration
   * Should only be called once during initial setup
   *
   * @param mode - The deployment mode
   * @returns The created deployment config document
   */
  async create(mode: DeploymentMode): Promise<DeploymentConfig> {
    const now = new Date();

    const config: DeploymentConfig = {
      _id: new ObjectId(),
      mode,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(config);

    return config;
  }

  /**
   * Mark onboarding as completed
   *
   * @returns The updated deployment config document or null if not found
   */
  async markOnboardingCompleted(): Promise<DeploymentConfig | null> {
    const result = await this.collection.findOneAndUpdate(
      {},
      {
        $set: {
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Check if onboarding is completed
   *
   * @returns True if onboarding is completed, false otherwise
   */
  async isOnboardingCompleted(): Promise<boolean> {
    const config = await this.get();
    return config?.onboardingCompleted ?? false;
  }

  /**
   * Utility used in tests to clear the deployment configuration collection
   */
  async clearAll(): Promise<void> {
    await this.collection.deleteMany({});
  }
}
