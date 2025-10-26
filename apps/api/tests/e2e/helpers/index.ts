/**
 * E2E Test Helpers Index
 * Centralized exports for all test utilities and patterns
 */

// Authentication & Setup
export * from "./auth-setup";
export * from "./test-data-factory";
export * from "./token-manager";
export * from "./authorization-matrix";

// Test Patterns & Assertions
export * from "./request-assertions";
export * from "./test-scenarios";

// Database
export { cleanDatabase, clearAuthCaches, dropDatabase, closeMongoClient } from "./database";
export { getTestApp } from "./test-app";

// Socket.IO Client Helpers
export {
  connectSocketClient,
  disconnectSocketClient,
  waitForEvent,
  emitWithAck,
  waitForMultipleEvents,
  waitForEventOrNull,
} from "./socket-client";
