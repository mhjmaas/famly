import { StartedMongoDBContainer } from "@testcontainers/mongodb";
import { ChildProcess } from "child_process";
import { closeMongoClient } from "../e2e/helpers/database";

declare global {
  var __MONGO_CONTAINER__: StartedMongoDBContainer;
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

  // Stop MongoDB container
  const mongoContainer = global.__MONGO_CONTAINER__;
  if (mongoContainer) {
    await mongoContainer.stop();
    console.log("Shared MongoDB container stopped");
  }
}
