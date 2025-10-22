declare global {
  var __TEST_BASE_URL__: string;
}

/**
 * Get the base URL for the test server.
 * The server is started once in global setup and shared across all tests.
 */
export function getTestApp(): string {
  const baseUrl = global.__TEST_BASE_URL__;
  if (!baseUrl) {
    throw new Error(
      "Test server not initialized. Ensure global setup has run.",
    );
  }
  return baseUrl;
}
