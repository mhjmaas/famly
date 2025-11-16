import { type ChildProcess, spawn } from "node:child_process";
import {
  MongoDBContainer,
  type StartedMongoDBContainer,
} from "@testcontainers/mongodb";
import { GenericContainer, type StartedTestContainer } from "testcontainers";

declare global {
  var __MONGO_URI__: string;
  var __MONGO_CONTAINER__: StartedMongoDBContainer;
  var __MINIO_CONTAINER__: StartedTestContainer;
  var __SERVER_PROCESS__: ChildProcess;
  var __TEST_baseUrl__: string;
}

export default async function globalSetup() {
  // Set env vars BEFORE any imports that depend on them
  process.env.BETTER_AUTH_SECRET =
    "test_better_auth_secret_min_32_chars_long_x";
  process.env.BETTER_AUTH_URL = "http://localhost:3001";
  process.env.NODE_ENV = "test";
  process.env.DEPLOYMENT_MODE = "saas";
  // MinIO env vars will be set after container starts
  process.env.MINIO_ENDPOINT = "localhost:9000"; // Temporary, will be updated
  process.env.MINIO_ROOT_USER = "famly-test-access";
  process.env.MINIO_ROOT_PASSWORD = "famly-test-secret-min-32-chars";
  process.env.MINIO_BUCKET = "famly-rewards-test";
  process.env.MINIO_USE_SSL = "false";

  console.log("Starting shared MongoDB container for e2e tests...");

  // Start MongoDB container (shared across all test files)
  const mongoContainer = await new MongoDBContainer("mongo:7.0").start();

  const host = mongoContainer.getHost();
  const port = mongoContainer.getMappedPort(27017);
  const mongoUri = `mongodb://${host}:${port}`;

  // Set MongoDB URI BEFORE importing anything that validates env
  process.env.MONGODB_URI = mongoUri;

  // Store globally for teardown and test access
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_CONTAINER__ = mongoContainer;

  console.log(`Shared MongoDB container started at ${mongoUri}`);

  // Start MinIO container (shared across all test files)
  console.log("Starting shared MinIO container for e2e tests...");
  const minioContainer = await new GenericContainer("minio/minio:latest")
    .withExposedPorts(9000)
    .withEnvironment({
      MINIO_ROOT_USER: "famly-test-access",
      MINIO_ROOT_PASSWORD: "famly-test-secret-min-32-chars",
    })
    .withCommand(["server", "/data"])
    .start();

  const minioHost = minioContainer.getHost();
  const minioPort = minioContainer.getMappedPort(9000);
  const minioEndpoint = `${minioHost}:${minioPort}`;

  // Store globally for teardown
  global.__MINIO_CONTAINER__ = minioContainer;

  console.log(`Shared MinIO container started at ${minioEndpoint}`);

  // Start API server (shared across all test files)
  console.log("Starting shared API server for e2e tests...");
  const serverPort = 3001;

  const serverProcess = spawn("npx", ["tsx", "src/server.ts"], {
    env: {
      ...process.env,
      MONGODB_URI: mongoUri,
      NODE_ENV: "test",
      PORT: serverPort.toString(),
      BETTER_AUTH_SECRET: "test_better_auth_secret_min_32_chars_x",
      BETTER_AUTH_URL: `http://localhost:${serverPort}`,
      DEPLOYMENT_MODE: "saas",
      MINIO_ENDPOINT: minioEndpoint,
      MINIO_ROOT_USER: "famly-test-access",
      MINIO_ROOT_PASSWORD: "famly-test-secret-min-32-chars",
      MINIO_BUCKET: "famly-rewards-test",
      MINIO_USE_SSL: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const allOutput: string[] = [];

  serverProcess.stdout?.on("data", (data) => {
    allOutput.push(`[stdout] ${data.toString()}`);
  });

  serverProcess.stderr?.on("data", (data) => {
    allOutput.push(`[stderr] ${data.toString()}`);
  });

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log("Server output:", allOutput.join(""));
      reject(new Error("Server failed to start within 15 seconds"));
    }, 15000);

    let resolved = false;

    const checkAndResolve = () => {
      const fullOutput = allOutput.join("");
      if (!resolved && fullOutput.includes("listening on port")) {
        resolved = true;
        clearTimeout(timeout);
        setTimeout(() => resolve(), 500);
      }
    };

    const interval = setInterval(checkAndResolve, 100);

    serverProcess.on("error", (error) => {
      clearTimeout(timeout);
      clearInterval(interval);
      console.log("Server output:", allOutput.join(""));
      reject(error);
    });

    serverProcess.on("exit", (code) => {
      if (!resolved) {
        clearTimeout(timeout);
        clearInterval(interval);
        console.log("Server output:", allOutput.join(""));
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });

  const baseUrl = `http://localhost:${serverPort}`;
  global.__SERVER_PROCESS__ = serverProcess;
  global.__TEST_baseUrl__ = baseUrl;

  console.log(`Shared API server ready at ${baseUrl}`);
}
