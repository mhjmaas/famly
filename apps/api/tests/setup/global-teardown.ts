import type { ChildProcess } from "node:child_process";
import type { StartedMongoDBContainer } from "@testcontainers/mongodb";
import type { StartedTestContainer } from "testcontainers";
import { closeMongoClient } from "../e2e/helpers/database";

declare global {
  var __MONGO_CONTAINER__: StartedMongoDBContainer;
  var __MINIO_CONTAINER__: StartedTestContainer;
  var __SERVER_PROCESS__: ChildProcess;
}

export default async function globalTeardown() {
  // Stop API server
  const serverProcess = global.__SERVER_PROCESS__;
  if (serverProcess) {
    console.log("Stopping shared API server...");
    serverProcess.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      serverProcess.on("exit", () => {
        console.log("Server process stopped");
        resolve();
      });
      setTimeout(() => {
        serverProcess.kill("SIGKILL");
        resolve();
      }, 3000);
    });
  }

  // Close MongoDB client
  await closeMongoClient();

  // Stop MinIO container
  const minioContainer = global.__MINIO_CONTAINER__;
  if (minioContainer) {
    await minioContainer.stop();
    console.log("Shared MinIO container stopped");
  }

  // Stop MongoDB container
  const mongoContainer = global.__MONGO_CONTAINER__;
  if (mongoContainer) {
    await mongoContainer.stop();
    console.log("Shared MongoDB container stopped");
  }
}
