/** @type {import('jest').Config} */
module.exports = {
  displayName: "unit",
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.test.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/index.ts"],
  coverageDirectory: "coverage/unit",
  clearMocks: true,
  moduleFileExtensions: ["ts", "js", "json", "node"],
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
    "^@locales/(.*)$": "<rootDir>/src/locales/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
    "^@famly/shared$": "<rootDir>/../../packages/shared/src/index.ts",
  },
};
