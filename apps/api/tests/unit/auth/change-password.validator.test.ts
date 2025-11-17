import { changePasswordSchema } from "@modules/auth/validators/change-password.validator";

describe("changePasswordSchema", () => {
  it("validates a correct payload", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123!",
      newPassword: "NewPassword456!",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing current password", () => {
    const result = changePasswordSchema.safeParse({
      newPassword: "NewPassword456!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        (result.error.format().currentPassword?._errors ?? []).length,
      ).toBeGreaterThan(0);
    }
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "short",
      newPassword: "another",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.format().currentPassword?._errors[0]).toContain(
        "at least 8",
      );
      expect(result.error.format().newPassword?._errors[0]).toContain(
        "at least 8",
      );
    }
  });

  it("rejects if new password matches current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "SamePassword123!",
      newPassword: "SamePassword123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.format().newPassword?._errors).toContain(
        "New password must be different from the current password",
      );
    }
  });
});
