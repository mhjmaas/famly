import { DeploymentMode } from "@modules/deployment-config";
import { DeploymentConfigRepository } from "@modules/deployment-config/repositories/deployment-config.repository";
import request from "supertest";

import { cleanDatabase } from "../helpers/database";
import { getTestApp } from "../helpers/test-app";

// Better Auth uses this cookie name pattern
const SESSION_COOKIE_PREFIX = "better-auth.session_token";

describe("E2E: POST /v1/auth/register", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("Web Flow (Cookie-based)", () => {
    it("should register a new user and set session cookie", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "webuser@example.com",
        password: "SecurePassword123!",
        name: "Web User",
        birthdate: "1990-01-15",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email", "webuser@example.com");
      expect(response.body.user).toHaveProperty("name", "Web User");
      expect(response.body.user).toHaveProperty("birthdate");
      expect(response.body).toHaveProperty("session");
      expect(response.body.session).toHaveProperty("expiresAt");

      // Verify session cookie was set
      const cookies = response.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining(SESSION_COOKIE_PREFIX),
        ]),
      );
    });

    it("should auto-sign in after registration (web flow)", async () => {
      const registerResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: "autosignin@example.com",
          password: "SecurePassword123!",
          name: "Auto Sign In User",
          birthdate: "1995-05-20",
        });

      expect(registerResponse.status).toBe(201);

      // Extract session cookie
      const cookies = registerResponse.headers["set-cookie"];
      const cookieArray = Array.isArray(cookies)
        ? cookies
        : cookies
          ? [cookies]
          : [];
      const sessionCookie = cookieArray.find((c: string) =>
        c.includes(SESSION_COOKIE_PREFIX),
      );

      // Use the session cookie to access protected endpoint
      if (!sessionCookie) {
        throw new Error("Session cookie not found");
      }
      const meResponse = await request(baseUrl)
        .get("/v1/auth/me")
        .set("Cookie", sessionCookie);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.email).toBe("autosignin@example.com");
      expect(meResponse.body.authType).toBe("cookie");
    });

    it("should reject registration with duplicate email", async () => {
      // Register first user
      await request(baseUrl).post("/v1/auth/register").send({
        email: "duplicate@example.com",
        password: "SecurePassword123!",
        name: "First User",
        birthdate: "1985-03-10",
      });

      // Try to register with same email
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "duplicate@example.com",
        password: "DifferentPassword456!",
        name: "Second User",
        birthdate: "1990-06-15",
      });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject registration with weak password", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "weakpass@example.com",
        password: "weak",
        name: "Weak Pass User",
        birthdate: "1992-08-25",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "invalid-email",
        password: "SecurePassword123!",
        name: "Invalid Email User",
        birthdate: "1988-12-01",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should reject registration with missing birthdate", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "nobirth@example.com",
        password: "SecurePassword123!",
        name: "No Birthdate User",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Birthdate");
    });

    it("should reject registration with invalid birthdate format", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "invalidbirth@example.com",
        password: "SecurePassword123!",
        name: "Invalid Birthdate User",
        birthdate: "01-15-1990", // Wrong format
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("ISO 8601");
    });

    it("should reject registration with missing name", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "noname@example.com",
        password: "SecurePassword123!",
        birthdate: "1991-04-22",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Name");
    });
  });

  describe("Mobile Flow (Bearer Token)", () => {
    it("should register and return bearer token in header", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "mobile@example.com",
        password: "SecurePassword123!",
        name: "Mobile User",
        birthdate: "1993-07-08",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("mobile@example.com");
      expect(response.body.user).toHaveProperty("birthdate");

      // Tokens should be in response header and body
      const sessionToken = response.headers["set-auth-token"];

      expect(sessionToken).toBeDefined();
      expect(typeof sessionToken).toBe("string");

      // Access token (JWT) - short-lived, stateless, for API requests
      expect(response.body).toHaveProperty("accessToken");
      expect(response.body.accessToken).toBeDefined();

      // Session token - long-lived, database-backed, for token refresh
      expect(response.body).toHaveProperty("sessionToken");
      expect(response.body.sessionToken).toBe(sessionToken);
    });

    it("should use bearer token to access protected endpoints", async () => {
      // Register and get bearer token (use unique email to avoid conflicts)
      const uniqueEmail = `beareruser${Date.now()}@example.com`;
      const registerResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: uniqueEmail,
          password: "SecurePassword123!",
          name: "Bearer User",
          birthdate: "1996-11-09",
        });

      // Use access token (JWT) or session token for API requests
      const accessToken = registerResponse.body.accessToken;
      const sessionToken = registerResponse.body.sessionToken;

      // Prefer JWT, fallback to session token
      const bearerToken = accessToken || sessionToken;
      expect(bearerToken).toBeDefined();

      // Access protected endpoint with bearer token
      const meResponse = await request(baseUrl)
        .get("/v1/auth/me")
        .set("Authorization", `Bearer ${bearerToken}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user.email).toBe(uniqueEmail);
      expect(["bearer-jwt", "bearer-session"]).toContain(
        meResponse.body.authType,
      );
    });

    it("should reject access with invalid bearer token", async () => {
      const response = await request(baseUrl)
        .get("/v1/auth/me")
        .set("Authorization", "Bearer invalid-token-xyz");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("should support all three authentication methods (cookie, JWT, session)", async () => {
      // Register and get all auth credentials
      const registerResponse = await request(baseUrl)
        .post("/v1/auth/register")
        .send({
          email: "allauth@example.com",
          password: "SecurePassword123!",
          name: "All Auth User",
          birthdate: "1989-02-14",
        });

      expect(registerResponse.status).toBe(201);

      // Extract all auth credentials
      const cookies = registerResponse.headers["set-cookie"];
      const cookieArray = Array.isArray(cookies)
        ? cookies
        : cookies
          ? [cookies]
          : [];
      const sessionCookie = cookieArray.find((c: string) =>
        c.includes(SESSION_COOKIE_PREFIX),
      );
      const accessToken = registerResponse.body.accessToken; // JWT
      const sessionToken = registerResponse.body.sessionToken; // Session

      expect(sessionCookie).toBeDefined();
      expect(accessToken).toBeDefined();
      expect(sessionToken).toBeDefined();

      // Test 1: Cookie-based authentication
      if (!sessionCookie) {
        throw new Error("Session cookie not found");
      }
      const cookieResponse = await request(baseUrl)
        .get("/v1/auth/me")
        .set("Cookie", sessionCookie);

      expect(cookieResponse.status).toBe(200);
      expect(cookieResponse.body.user.email).toBe("allauth@example.com");
      expect(cookieResponse.body.authType).toBe("cookie");

      // Test 2: JWT token authentication (stateless, fast)
      const jwtResponse = await request(baseUrl)
        .get("/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(jwtResponse.status).toBe(200);
      expect(jwtResponse.body.user.email).toBe("allauth@example.com");
      expect(jwtResponse.body.authType).toBe("bearer-jwt");

      // Test 3: Session token authentication (database-backed)
      const sessionResponse = await request(baseUrl)
        .get("/v1/auth/me")
        .set("Authorization", `Bearer ${sessionToken}`);

      expect(sessionResponse.status).toBe(200);
      expect(sessionResponse.body.user.email).toBe("allauth@example.com");
      expect(sessionResponse.body.authType).toBe("bearer-session");
    });
  });

  describe("Email Normalization", () => {
    it("should normalize email to lowercase on registration", async () => {
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "UPPERCASE@EXAMPLE.COM",
        password: "SecurePassword123!",
        name: "Uppercase User",
        birthdate: "1994-09-30",
      });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe("uppercase@example.com");
    });

    it("should reject duplicate email regardless of case", async () => {
      // Register with lowercase
      await request(baseUrl).post("/v1/auth/register").send({
        email: "casetest@example.com",
        password: "SecurePassword123!",
        name: "Case Test User",
        birthdate: "1987-05-17",
      });

      // Try with uppercase
      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "CASETEST@EXAMPLE.COM",
        password: "DifferentPassword456!",
        name: "Case Test User 2",
        birthdate: "1997-10-12",
      });

      expect(response.status).toBe(409);
    });
  });

  describe("Deployment Mode Registration Blocking", () => {
    let deploymentConfigRepo: DeploymentConfigRepository;

    beforeAll(async () => {
      // Ensure MongoDB is connected for deployment config tests
      const { connectMongo } = await import("@infra/mongo/client");
      await connectMongo();
    });

    beforeEach(async () => {
      deploymentConfigRepo = new DeploymentConfigRepository();
      // Clean up deployment config before each test
      await deploymentConfigRepo.clearAll();
    });

    it("should block registration in standalone mode after onboarding", async () => {
      // Setup: Create standalone deployment config with onboarding completed
      await deploymentConfigRepo.create(DeploymentMode.Standalone);
      await deploymentConfigRepo.markOnboardingCompleted();

      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "blocked@example.com",
        password: "SecurePassword123!",
        name: "Blocked User",
        birthdate: "1990-01-15",
      });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe(
        "Registration is closed. Contact your family administrator to be added.",
      );
    });

    it("should allow registration in standalone mode before onboarding", async () => {
      // Setup: Create standalone deployment config without onboarding completed
      await deploymentConfigRepo.create(DeploymentMode.Standalone);

      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "allowed@example.com",
        password: "SecurePassword123!",
        name: "Allowed User",
        birthdate: "1990-01-15",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("allowed@example.com");
    });

    it("should always allow registration in SaaS mode", async () => {
      // Setup: Create SaaS deployment config with onboarding completed
      await deploymentConfigRepo.create(DeploymentMode.SaaS);
      await deploymentConfigRepo.markOnboardingCompleted();

      const response = await request(baseUrl).post("/v1/auth/register").send({
        email: "saas@example.com",
        password: "SecurePassword123!",
        name: "SaaS User",
        birthdate: "1990-01-15",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("saas@example.com");
    });
  });
});
