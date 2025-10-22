/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  collectCoverageFrom: ["src/**/*.ts"],
  coverageDirectory: "coverage",
  clearMocks: true,
  moduleFileExtensions: ["ts", "js", "json", "node"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest-setup.ts"],
  globalSetup: "<rootDir>/tests/setup/global-setup.ts",
  globalTeardown: "<rootDir>/tests/setup/global-teardown.ts",
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@infra/(.*)$": "<rootDir>/src/infra/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@middleware/(.*)$": "<rootDir>/src/middleware/$1",
    "^@modules/(.*)$": "<rootDir>/src/modules/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
};
