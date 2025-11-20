import {
  resolveNotificationLocale,
  translateNotification,
} from "@modules/notifications/lib/notification-i18n";

describe("notification-i18n", () => {
  it("falls back to default locale when unsupported", () => {
    expect(resolveNotificationLocale("fr-FR")).toBe("en-US");
    expect(resolveNotificationLocale(undefined)).toBe("en-US");
  });

  it("translates known keys with placeholders", () => {
    const result = translateNotification("nl-NL", "karma.awardedDescription", {
      amount: 5,
      description: " voor iets leuks",
    });

    expect(result).toContain("5");
    expect(result).toMatch(/karma/i);
    expect(result).toContain("voor iets leuks");
  });
});
