import { connectMongo } from "@infra/mongo/client";
import { DeploymentMode } from "@modules/deployment-config";
import { DeploymentConfigRepository } from "@modules/deployment-config/repositories/deployment-config.repository";
import request from "supertest";
import { cleanDatabase } from "./helpers/database";
import { getTestApp } from "./helpers/test-app";

describe("Status Endpoint E2E Tests", () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = getTestApp();
    await connectMongo();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /v1/status", () => {
    it("should return deployment status without authentication", async () => {
      const response = await request(baseUrl).get("/v1/status");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("mode");
      expect(response.body).toHaveProperty("onboardingCompleted");
      expect(["saas", "standalone"]).toContain(response.body.mode);
      expect(typeof response.body.onboardingCompleted).toBe("boolean");
    });

    it("should return SaaS mode by default", async () => {
      const response = await request(baseUrl).get("/v1/status");

      expect(response.status).toBe(200);
      expect(response.body.mode).toBe("saas");
      expect(response.body.onboardingCompleted).toBe(false);
    });

    it("should return standalone mode when configured", async () => {
      // Update deployment config to standalone mode
      const repository = new DeploymentConfigRepository();
      await repository.create(DeploymentMode.Standalone);

      const response = await request(baseUrl).get("/v1/status");

      expect(response.status).toBe(200);
      expect(response.body.mode).toBe("standalone");
      expect(response.body.onboardingCompleted).toBe(false);

      // Clean up
      await repository.clearAll();
    });

    it("should reflect onboarding completion status", async () => {
      // Create config and mark onboarding complete
      const repository = new DeploymentConfigRepository();
      await repository.create(DeploymentMode.Standalone);
      await repository.markOnboardingCompleted();

      const response = await request(baseUrl).get("/v1/status");

      expect(response.status).toBe(200);
      expect(response.body.mode).toBe("standalone");
      expect(response.body.onboardingCompleted).toBe(true);

      // Clean up
      await repository.clearAll();
    });
  });
});
