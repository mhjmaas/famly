/** @type {import('jest').Config} */
module.exports = {
  displayName: "web",
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/app/**/*.{ts,tsx}", // Exclude Next.js app directory
  ],
  coverageDirectory: "coverage/unit",
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@famly/shared$": "<rootDir>/../../packages/shared/src/index.ts",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/unit/setup.ts"],
};
