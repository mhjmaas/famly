import request from "supertest";
import {
  cleanDatabase,
  clearTestEmailsHelper,
  extractResetTokenFromEmail,
  getLatestTestEmail,
  getTestApp,
  getTestEmailsHelper,
} from "../helpers";

const SESSION_COOKIE_PREFIX = "better-auth.session_token";

describe("E2E: Password Reset Flow", () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = getTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    clearTestEmailsHelper();
  });

  describe("POST /v1/auth/request-password-reset", () => {
    describe("Request with valid registered email", () => {
      it("should return success message", async () => {
        // Register a user first
        await request(baseUrl).post("/v1/auth/register").send({
          email: "user@example.com",
          password: "OldPassword123!",
          name: "Test User",
          birthdate: "1990-01-01",
        });

        // Request password reset
        const response = await request(baseUrl)
          .post("/v1/auth/request-password-reset")
          .send({
            email: "user@example.com",
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message:
            "If your email is registered, you will receive a password reset link",
        });
      });

      it("should send password reset email with token", async () => {
        // Register user
        await request(baseUrl).post("/v1/auth/register").send({
          email: "user@example.com",
          password: "OldPassword123!",
          name: "Test User",
          birthdate: "1990-01-01",
        });

        // Request password reset
        await request(baseUrl).post("/v1/auth/request-password-reset").send({
          email: "user@example.com",
        });

        // Check email was captured
        const emails = getTestEmailsHelper();
        expect(emails).toHaveLength(1);

        const email = emails[0];
        expect(email.to).toBe("user@example.com");
        expect(email.subject).toBe("Reset your Famly password");
        expect(email.text).toContain("/reset-password?token=");
        expect(email.html).toContain("/reset-password?token=");
      });

      it("should include expiration notice in email", async () => {
        await request(baseUrl).post("/v1/auth/register").send({
          email: "user@example.com",
          password: "OldPassword123!",
          name: "Test User",
          birthdate: "1990-01-01",
        });

        await request(baseUrl).post("/v1/auth/request-password-reset").send({
          email: "user@example.com",
        });

        const email = getLatestTestEmail();
        expect(email).toBeDefined();
        expect(email?.text).toContain("1 hour");
        expect(email?.html).toContain("1 hour");
      });

      it("should extract valid token from email", async () => {
        await request(baseUrl).post("/v1/auth/register").send({
          email: "user@example.com",
          password: "OldPassword123!",
          name: "Test User",
          birthdate: "1990-01-01",
        });

        await request(baseUrl).post("/v1/auth/request-password-reset").send({
          email: "user@example.com",
        });

        const email = getLatestTestEmail();
        expect(email).toBeDefined();

        const token = extractResetTokenFromEmail(email!);
        expect(token).toBeTruthy();
        expect(typeof token).toBe("string");
        expect(token!.length).toBeGreaterThan(10);
      });
    });

    describe("Request with non-existent email", () => {
      it("should return same success message (prevent enumeration)", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/request-password-reset")
          .send({
            email: "nonexistent@example.com",
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message:
            "If your email is registered, you will receive a password reset link",
        });
      });

      it("should not send email for non-existent user", async () => {
        await request(baseUrl).post("/v1/auth/request-password-reset").send({
          email: "nonexistent@example.com",
        });

        const emails = getTestEmailsHelper();
        expect(emails).toHaveLength(0);
      });
    });

    describe("Multiple reset requests", () => {
      it("should allow multiple reset requests for same email", async () => {
        await request(baseUrl).post("/v1/auth/register").send({
          email: "user@example.com",
          password: "OldPassword123!",
          name: "Test User",
          birthdate: "1990-01-01",
        });

        // First request
        const response1 = await request(baseUrl)
          .post("/v1/auth/request-password-reset")
          .send({
            email: "user@example.com",
          });

        expect(response1.status).toBe(200);

        // Second request
        const response2 = await request(baseUrl)
          .post("/v1/auth/request-password-reset")
          .send({
            email: "user@example.com",
          });

        expect(response2.status).toBe(200);

        // Should have sent 2 emails
        const emails = getTestEmailsHelper();
        expect(emails).toHaveLength(2);
      });

      it("should generate different tokens for multiple requests", async () => {
        await request(baseUrl).post("/v1/auth/register").send({
          email: "user@example.com",
          password: "OldPassword123!",
          name: "Test User",
          birthdate: "1990-01-01",
        });

        // First request
        await request(baseUrl).post("/v1/auth/request-password-reset").send({
          email: "user@example.com",
        });

        const emails = getTestEmailsHelper();
        const token1 = extractResetTokenFromEmail(emails[0]);

        // Second request
        await request(baseUrl).post("/v1/auth/request-password-reset").send({
          email: "user@example.com",
        });

        const updatedEmails = getTestEmailsHelper();
        const token2 = extractResetTokenFromEmail(updatedEmails[1]);

        expect(token1).not.toEqual(token2);
      });
    });

    describe("Validation errors", () => {
      it("should reject invalid email format", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/request-password-reset")
          .send({
            email: "not-an-email",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("valid email");
      });

      it("should reject missing email field", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/request-password-reset")
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });

      it("should reject empty email", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/request-password-reset")
          .send({
            email: "",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });
    });
  });

  describe("POST /v1/auth/reset-password", () => {
    async function setupUserAndGetResetToken(email: string, password: string) {
      // Register user
      await request(baseUrl).post("/v1/auth/register").send({
        email,
        password,
        name: "Test User",
        birthdate: "1990-01-01",
      });

      // Request password reset
      await request(baseUrl).post("/v1/auth/request-password-reset").send({
        email,
      });

      // Extract token from email
      const sentEmail = getLatestTestEmail();
      return extractResetTokenFromEmail(sentEmail!);
    }

    describe("Reset with valid token", () => {
      it("should successfully reset password", async () => {
        const email = "user@example.com";
        const oldPassword = "OldPassword123!";
        const newPassword = "NewPassword456!";

        const token = await setupUserAndGetResetToken(email, oldPassword);

        const response = await request(baseUrl)
          .post("/v1/auth/reset-password")
          .send({
            token,
            newPassword,
          });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message: "Password reset successful",
        });
      });

      it("should allow login with new password after reset", async () => {
        const email = "user@example.com";
        const oldPassword = "OldPassword123!";
        const newPassword = "NewPassword456!";

        const token = await setupUserAndGetResetToken(email, oldPassword);

        // Reset password
        await request(baseUrl).post("/v1/auth/reset-password").send({
          token,
          newPassword,
        });

        // Try to login with new password
        const loginResponse = await request(baseUrl)
          .post("/v1/auth/login")
          .send({
            email,
            password: newPassword,
          });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.user.email).toBe(email);
      });

      it("should not allow login with old password after reset", async () => {
        const email = "user@example.com";
        const oldPassword = "OldPassword123!";
        const newPassword = "NewPassword456!";

        const token = await setupUserAndGetResetToken(email, oldPassword);

        // Reset password
        await request(baseUrl).post("/v1/auth/reset-password").send({
          token,
          newPassword,
        });

        // Try to login with old password
        const loginResponse = await request(baseUrl)
          .post("/v1/auth/login")
          .send({
            email,
            password: oldPassword,
          });

        expect(loginResponse.status).toBe(401);
      });
    });

    describe("Session invalidation", () => {
      it("should invalidate existing sessions after password reset", async () => {
        const email = "user@example.com";
        const oldPassword = "OldPassword123!";
        const newPassword = "NewPassword456!";

        // Register and login to create session
        await request(baseUrl).post("/v1/auth/register").send({
          email,
          password: oldPassword,
          name: "Test User",
          birthdate: "1990-01-01",
        });

        const loginResponse = await request(baseUrl)
          .post("/v1/auth/login")
          .send({
            email,
            password: oldPassword,
          });

        const cookies = loginResponse.headers["set-cookie"];
        const sessionCookie = Array.isArray(cookies)
          ? cookies.find((c: string) => c.includes(SESSION_COOKIE_PREFIX))
          : cookies;

        // Verify session works
        const meResponse1 = await request(baseUrl)
          .get("/v1/auth/me")
          .set("Cookie", sessionCookie || "");

        expect(meResponse1.status).toBe(200);

        // Request password reset
        await request(baseUrl).post("/v1/auth/request-password-reset").send({
          email,
        });

        const resetToken = extractResetTokenFromEmail(getLatestTestEmail()!);

        // Reset password
        await request(baseUrl).post("/v1/auth/reset-password").send({
          token: resetToken,
          newPassword,
        });

        // Try to use old session
        const meResponse2 = await request(baseUrl)
          .get("/v1/auth/me")
          .set("Cookie", sessionCookie || "");

        expect(meResponse2.status).toBe(401);
      });
    });

    describe("Invalid tokens", () => {
      it("should reject invalid token", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/reset-password")
          .send({
            token: "invalid-token-12345",
            newPassword: "NewPassword123!",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toBeTruthy();
      });

      it("should reject already-used token", async () => {
        const email = "user@example.com";
        const token = await setupUserAndGetResetToken(email, "OldPassword123!");

        // Use token first time
        await request(baseUrl).post("/v1/auth/reset-password").send({
          token,
          newPassword: "NewPassword1!",
        });

        // Try to use same token again
        const response = await request(baseUrl)
          .post("/v1/auth/reset-password")
          .send({
            token,
            newPassword: "NewPassword2!",
          });

        expect(response.status).toBe(400);
      });
    });

    describe("Validation errors", () => {
      it("should reject password less than 8 characters", async () => {
        const email = "user@example.com";
        const token = await setupUserAndGetResetToken(email, "OldPassword123!");

        const response = await request(baseUrl)
          .post("/v1/auth/reset-password")
          .send({
            token,
            newPassword: "short",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("at least 8 characters");
      });

      it("should reject missing token", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/reset-password")
          .send({
            newPassword: "NewPassword123!",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });

      it("should reject missing password", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/reset-password")
          .send({
            token: "some-token",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });

      it("should reject empty token", async () => {
        const response = await request(baseUrl)
          .post("/v1/auth/reset-password")
          .send({
            token: "",
            newPassword: "NewPassword123!",
          });

        expect(response.status).toBe(400);
        expect(response.body.error.message).toContain("required");
      });
    });
  });
});
