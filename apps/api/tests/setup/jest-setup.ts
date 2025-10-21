// Setup file that runs after jest environment is set up
// Use this for any additional test configuration

// Set test environment
process.env.NODE_ENV = 'test';

// Clean database and auth caches before each test file starts to prevent test pollution
beforeAll(async () => {
  const { cleanDatabase, clearAuthCaches } = await import('../e2e/helpers/database');
  await cleanDatabase();
  await clearAuthCaches();
});
