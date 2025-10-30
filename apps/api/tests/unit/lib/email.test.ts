import {
  clearTestEmails,
  getTestEmails,
  sendEmail,
  sendPasswordResetEmail,
} from "@lib/email";
import { logger } from "@lib/logger";

// Mock logger
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock settings
jest.mock("@config/settings", () => ({
  settings: {
    isTest: true,
    isDevelopment: false,
  },
}));

describe("Email Service", () => {
  beforeEach(() => {
    clearTestEmails();
    jest.clearAllMocks();
  });

  describe("sendEmail", () => {
    it("should capture email in test environment", async () => {
      const emailOptions = {
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test body",
        html: "<p>Test body</p>",
      };

      await sendEmail(emailOptions);

      const capturedEmails = getTestEmails();
      expect(capturedEmails).toHaveLength(1);
      expect(capturedEmails[0]).toEqual(emailOptions);
    });

    it("should log email capture in test environment", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test body",
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Email captured for testing",
        expect.objectContaining({
          to: "test@example.com",
          subject: "Test Subject",
          textLength: 9,
        }),
      );
    });

    it("should handle email without html content", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        text: "Test body",
      });

      const capturedEmails = getTestEmails();
      expect(capturedEmails[0].html).toBeUndefined();
    });

    it("should capture multiple emails", async () => {
      await sendEmail({
        to: "user1@example.com",
        subject: "Subject 1",
        text: "Body 1",
      });

      await sendEmail({
        to: "user2@example.com",
        subject: "Subject 2",
        text: "Body 2",
      });

      const capturedEmails = getTestEmails();
      expect(capturedEmails).toHaveLength(2);
      expect(capturedEmails[0].to).toBe("user1@example.com");
      expect(capturedEmails[1].to).toBe("user2@example.com");
    });
  });

  describe("sendPasswordResetEmail", () => {
    const testEmail = "user@example.com";
    const testResetUrl = "https://famly.app/reset-password?token=abc123";
    const testToken = "abc123";

    it("should send password reset email with correct format", async () => {
      await sendPasswordResetEmail(testEmail, testResetUrl, testToken);

      const capturedEmails = getTestEmails();
      expect(capturedEmails).toHaveLength(1);

      const email = capturedEmails[0];
      expect(email.to).toBe(testEmail);
      expect(email.subject).toBe("Reset your Famly password");
      expect(email.text).toContain(testResetUrl);
      expect(email.html).toContain(testResetUrl);
    });

    it("should include reset URL in email body", async () => {
      await sendPasswordResetEmail(testEmail, testResetUrl, testToken);

      const capturedEmails = getTestEmails();
      const email = capturedEmails[0];

      expect(email.text).toContain(testResetUrl);
      expect(email.html).toContain(testResetUrl);
    });

    it("should include expiration notice in email", async () => {
      await sendPasswordResetEmail(testEmail, testResetUrl, testToken);

      const capturedEmails = getTestEmails();
      const email = capturedEmails[0];

      expect(email.text).toContain("1 hour");
      expect(email.html).toContain("1 hour");
    });

    it("should include clear instructions in email", async () => {
      await sendPasswordResetEmail(testEmail, testResetUrl, testToken);

      const capturedEmails = getTestEmails();
      const email = capturedEmails[0];

      expect(email.text).toContain("reset your password");
      expect(email.html).toContain("Reset Password");
    });

    it("should log email sending with structured data", async () => {
      await sendPasswordResetEmail(testEmail, testResetUrl, testToken);

      expect(logger.info).toHaveBeenCalledWith(
        "Sending password reset email",
        expect.objectContaining({
          email: testEmail,
          hasToken: true,
          resetUrlLength: testResetUrl.length,
        }),
      );

      expect(logger.info).toHaveBeenCalledWith(
        "Password reset email sent successfully",
        { email: testEmail },
      );
    });

    it("should never log the actual token for security", async () => {
      await sendPasswordResetEmail(testEmail, testResetUrl, testToken);

      const loggerCalls = (logger.info as jest.Mock).mock.calls;
      const allLoggedData = loggerCalls.flatMap((call) => JSON.stringify(call));

      // Ensure token is not logged directly (only hasToken boolean)
      expect(allLoggedData.some((data) => data.includes(testToken))).toBe(
        false,
      );
    });

    it("should format HTML email with proper structure", async () => {
      await sendPasswordResetEmail(testEmail, testResetUrl, testToken);

      const capturedEmails = getTestEmails();
      const email = capturedEmails[0];

      expect(email.html).toContain("<!DOCTYPE html>");
      expect(email.html).toContain("<html>");
      expect(email.html).toContain("</html>");
      expect(email.html).toContain('href="' + testResetUrl + '"');
    });
  });

  describe("getTestEmails", () => {
    it("should return empty array initially", () => {
      const emails = getTestEmails();
      expect(emails).toEqual([]);
    });

    it("should return all captured emails", async () => {
      await sendEmail({
        to: "test1@example.com",
        subject: "Test 1",
        text: "Body 1",
      });
      await sendEmail({
        to: "test2@example.com",
        subject: "Test 2",
        text: "Body 2",
      });

      const emails = getTestEmails();
      expect(emails).toHaveLength(2);
    });
  });

  describe("clearTestEmails", () => {
    it("should clear all captured emails", async () => {
      await sendEmail({
        to: "test@example.com",
        subject: "Test",
        text: "Body",
      });

      expect(getTestEmails()).toHaveLength(1);

      clearTestEmails();

      expect(getTestEmails()).toHaveLength(0);
    });
  });
});
