import { requestPasswordResetValidator } from "@modules/auth/validators/request-password-reset.validator";

describe("Request Password Reset Validator", () => {
  describe("valid inputs", () => {
    it("should accept valid email", () => {
      const validInput = {
        email: "user@example.com",
      };

      const result = requestPasswordResetValidator.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should accept email with subdomain", () => {
      const validInput = {
        email: "user@mail.example.com",
      };

      const result = requestPasswordResetValidator.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should accept email with plus addressing", () => {
      const validInput = {
        email: "user+test@example.com",
      };

      const result = requestPasswordResetValidator.safeParse(validInput);

      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("should reject invalid email format", () => {
      const invalidInput = {
        email: "not-an-email",
      };

      const result = requestPasswordResetValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email");
      }
    });

    it("should reject email without @ symbol", () => {
      const invalidInput = {
        email: "userexample.com",
      };

      const result = requestPasswordResetValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject email without domain", () => {
      const invalidInput = {
        email: "user@",
      };

      const result = requestPasswordResetValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject missing email field", () => {
      const invalidInput = {};

      const result = requestPasswordResetValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("should reject empty string email", () => {
      const invalidInput = {
        email: "",
      };

      const result = requestPasswordResetValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("should reject null email", () => {
      const invalidInput = {
        email: null,
      };

      const result = requestPasswordResetValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject undefined email", () => {
      const invalidInput = {
        email: undefined,
      };

      const result = requestPasswordResetValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe("whitespace handling", () => {
    it("should handle email with leading whitespace", () => {
      const input = {
        email: "  user@example.com",
      };

      // Zod doesn't auto-trim by default, so this should fail validation
      const result = requestPasswordResetValidator.safeParse(input);

      // Email with leading space is technically invalid
      expect(result.success).toBe(false);
    });

    it("should handle email with trailing whitespace", () => {
      const input = {
        email: "user@example.com  ",
      };

      // Email with trailing space is technically invalid
      const result = requestPasswordResetValidator.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe("error messages", () => {
    it("should provide clear error message for invalid format", () => {
      const result = requestPasswordResetValidator.safeParse({
        email: "invalid",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email",
        );
        expect(emailError?.message).toBe("Email must be a valid email address");
      }
    });

    it("should provide clear error message for missing email", () => {
      const result = requestPasswordResetValidator.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        const emailError = result.error.issues.find(
          (issue) => issue.path[0] === "email",
        );
        expect(emailError?.message).toBe("Email is required");
      }
    });
  });
});
