#!/usr/bin/env ts-node

import "dotenv/config";
import { connectMongo, disconnectMongo } from "../apps/api/src/infra/mongo/client";
import { logger } from "../apps/api/src/lib/logger";
import { FamilyRepository } from "../apps/api/src/modules/family/repositories/family.repository";
import { FamilySettingsRepository } from "../apps/api/src/modules/family/repositories/family-settings.repository";

/**
 * Migration script to create default settings for existing families
 * 
 * This script:
 * 1. Finds all families without settings
 * 2. Creates default settings (all features enabled) for each
 * 3. Logs results
 * 
 * Usage:
 *   # Dry run (doesn't make changes)
 *   ts-node scripts/migrate-family-settings.ts --dry-run
 * 
 *   # Actually apply the migration
 *   ts-node scripts/migrate-family-settings.ts
 */

interface MigrationStats {
  totalFamilies: number;
  familiesWithSettings: number;
  familiesWithoutSettings: number;
  settingsCreated: number;
  errors: number;
}

async function migrateFamilySettings(dryRun: boolean = false): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalFamilies: 0,
    familiesWithSettings: 0,
    familiesWithoutSettings: 0,
    settingsCreated: 0,
    errors: 0,
  };

  try {
    logger.info(`Starting family settings migration${dryRun ? " (DRY RUN)" : ""}...`);

    const familyRepo = new FamilyRepository();
    const settingsRepo = new FamilySettingsRepository();

    // Get all families
    const families = await familyRepo.findByCreator(""); // Empty creator returns all (we'll need to adjust this)
    
    // Better approach: query all families directly
    const db = await import("../apps/api/src/infra/mongo/client").then(m => m.getDb());
    const familiesCollection = db.collection("families");
    const allFamilies = await familiesCollection.find({}).toArray();
    
    stats.totalFamilies = allFamilies.length;

    logger.info(`Found ${stats.totalFamilies} families to check`);

    // Check each family for existing settings
    for (const family of allFamilies) {
      const familyId = family._id.toString();
      
      try {
        const existingSettings = await settingsRepo.findByFamilyId(familyId);
        
        if (existingSettings) {
          stats.familiesWithSettings++;
          logger.debug(`Family ${familyId} already has settings, skipping`);
        } else {
          stats.familiesWithoutSettings++;
          logger.info(`Family ${familyId} (${family.name || "Unnamed"}) needs default settings`);
          
          if (!dryRun) {
            await settingsRepo.createDefaultSettings(familyId);
            stats.settingsCreated++;
            logger.info(`✓ Created default settings for family ${familyId}`);
          } else {
            logger.info(`[DRY RUN] Would create default settings for family ${familyId}`);
          }
        }
      } catch (error) {
        stats.errors++;
        logger.error(`Error processing family ${familyId}:`, error);
      }
    }

    logger.info("\nMigration Summary:");
    logger.info(`Total families: ${stats.totalFamilies}`);
    logger.info(`Families with settings: ${stats.familiesWithSettings}`);
    logger.info(`Families without settings: ${stats.familiesWithoutSettings}`);
    
    if (dryRun) {
      logger.info(`Would create settings for: ${stats.familiesWithoutSettings} families`);
    } else {
      logger.info(`Settings created: ${stats.settingsCreated}`);
    }
    
    if (stats.errors > 0) {
      logger.warn(`Errors encountered: ${stats.errors}`);
    }

    return stats;
  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  try {
    // Connect to MongoDB
    logger.info("Connecting to MongoDB...");
    await connectMongo();
    logger.info("MongoDB connected successfully");

    // Run migration
    const stats = await migrateFamilySettings(dryRun);

    // Disconnect from MongoDB
    await disconnectMongo();
    logger.info("MongoDB disconnected");

    // Exit with appropriate code
    if (stats.errors > 0) {
      logger.error("Migration completed with errors");
      process.exit(1);
    } else {
      logger.info("Migration completed successfully");
      process.exit(0);
    }
  } catch (error) {
    logger.error("Fatal error during migration:", error);
    try {
      await disconnectMongo();
    } catch (disconnectError) {
      logger.error("Error disconnecting from MongoDB:", disconnectError);
    }
    process.exit(1);
  }
}

// Run main if executed directly
if (require.main === module) {
  main();
}

export { migrateFamilySettings };