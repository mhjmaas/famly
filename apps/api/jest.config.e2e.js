/** @type {import('jest').Config} */
module.exports = {
  displayName: 'e2e',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/e2e'],
  testMatch: ['**/*.e2e.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage/e2e',
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // E2E tests need longer timeouts for containers
  testTimeout: 10000,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '^.+\\.js$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
      }
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@routes/(.*)$': '<rootDir>/src/routes/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  // Allow transformation of better-auth ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(better-auth|@better-auth|@better-fetch|jose|oauth4webapi)/)'
  ],
  // Run tests serially for E2E (avoids port conflicts and container issues)
  maxWorkers: 1,
  // Force exit after tests complete to prevent hanging
  forceExit: true,
};
