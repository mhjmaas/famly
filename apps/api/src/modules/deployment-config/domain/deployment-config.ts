import type { ObjectId } from "mongodb";

/**
 * Deployment mode enum
 * Defines the allowed deployment modes for the application
 */
export enum DeploymentMode {
  SaaS = "saas",
  Standalone = "standalone",
}

/**
 * Deployment configuration document structure in MongoDB
 * Singleton collection - only one document should exist
 */
export interface DeploymentConfig {
  _id: ObjectId;
  mode: DeploymentMode;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deployment status response DTO
 * Used in API responses for /v1/status endpoint
 */
export interface DeploymentStatusResponse {
  mode: DeploymentMode;
  onboardingCompleted: boolean;
}
