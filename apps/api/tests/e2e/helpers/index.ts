/**
 * E2E Test Helpers Index
 * Centralized exports for all test utilities and patterns
 */

// Authentication & Setup
export * from "./auth-setup";
export * from "./authorization-matrix";
// Database
export {
  cleanDatabase,
  clearAuthCaches,
  closeMongoClient,
  dropDatabase,
} from "./database";
// Test Patterns & Assertions
export * from "./request-assertions";
// Socket.IO Client Helpers
export {
  connectSocketClient,
  disconnectSocketClient,
  emitWithAck,
  waitForEvent,
  waitForEventOrNull,
  waitForMultipleEvents,
} from "./socket-client";
export { getTestApp } from "./test-app";
export * from "./test-data-factory";
export * from "./test-scenarios";
export * from "./token-manager";
