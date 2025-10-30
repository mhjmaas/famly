import { resetPasswordValidator } from "@modules/auth/validators/reset-password.validator";

describe("Reset Password Validator", () => {
  describe("valid inputs", () => {
    it("should accept valid token and password", () => {
      const validInput = {
        token: "valid-reset-token-123",
        newPassword: "SecurePassword123!",
      };

      const result = resetPasswordValidator.safeParse(validInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.token).toBe("valid-reset-token-123");
        expect(result.data.newPassword).toBe("SecurePassword123!");
      }
    });

    it("should accept minimum length password (8 characters)", () => {
      const validInput = {
        token: "token123",
        newPassword: "Pass1234",
      };

      const result = resetPasswordValidator.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should accept long password", () => {
      const validInput = {
        token: "token123",
        newPassword: "ThisIsAVeryLongAndSecurePasswordWithLotsOfCharacters123!",
      };

      const result = resetPasswordValidator.safeParse(validInput);

      expect(result.success).toBe(true);
    });

    it("should accept token with various formats", () => {
      const tokens = [
        "simple-token",
        "token_with_underscore",
        "token.with.dots",
        "TOKEN123",
        "abc-123-def-456",
      ];

      for (const token of tokens) {
        const result = resetPasswordValidator.safeParse({
          token,
          newPassword: "ValidPass123",
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("invalid passwords", () => {
    it("should reject password less than 8 characters", () => {
      const invalidInput = {
        token: "valid-token",
        newPassword: "short",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "newPassword",
        );
        expect(passwordError?.message).toContain("at least 8 characters");
      }
    });

    it("should reject password with exactly 7 characters", () => {
      const invalidInput = {
        token: "valid-token",
        newPassword: "Pass123",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const invalidInput = {
        token: "valid-token",
        newPassword: "",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "newPassword",
        );
        expect(passwordError?.message).toContain("at least 8 characters");
      }
    });

    it("should reject missing password", () => {
      const invalidInput = {
        token: "valid-token",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "newPassword",
        );
        expect(passwordError?.message).toContain("required");
      }
    });

    it("should reject null password", () => {
      const invalidInput = {
        token: "valid-token",
        newPassword: null,
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject undefined password", () => {
      const invalidInput = {
        token: "valid-token",
        newPassword: undefined,
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe("invalid tokens", () => {
    it("should reject empty token", () => {
      const invalidInput = {
        token: "",
        newPassword: "ValidPassword123",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const tokenError = result.error.issues.find(
          (issue) => issue.path[0] === "token",
        );
        expect(tokenError?.message).toContain("required");
      }
    });

    it("should reject missing token", () => {
      const invalidInput = {
        newPassword: "ValidPassword123",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        const tokenError = result.error.issues.find(
          (issue) => issue.path[0] === "token",
        );
        expect(tokenError?.message).toContain("required");
      }
    });

    it("should reject null token", () => {
      const invalidInput = {
        token: null,
        newPassword: "ValidPassword123",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });

    it("should reject undefined token", () => {
      const invalidInput = {
        token: undefined,
        newPassword: "ValidPassword123",
      };

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
    });
  });

  describe("missing both fields", () => {
    it("should reject when both token and password are missing", () => {
      const invalidInput = {};

      const result = resetPasswordValidator.safeParse(invalidInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        const paths = result.error.issues.map((issue) => issue.path[0]);
        expect(paths).toContain("token");
        expect(paths).toContain("newPassword");
      }
    });
  });

  describe("error messages", () => {
    it("should provide clear error message for short password", () => {
      const result = resetPasswordValidator.safeParse({
        token: "token",
        newPassword: "short",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find(
          (issue) => issue.path[0] === "newPassword",
        );
        expect(passwordError?.message).toBe(
          "Password must be at least 8 characters",
        );
      }
    });

    it("should provide clear error message for missing token", () => {
      const result = resetPasswordValidator.safeParse({
        newPassword: "ValidPassword123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const tokenError = result.error.issues.find(
          (issue) => issue.path[0] === "token",
        );
        expect(tokenError?.message).toBe("Reset token is required");
      }
    });
  });
});
