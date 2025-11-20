import {
  isSupportedLanguage,
  resolvePreferredLanguage,
} from "@modules/auth/language";

describe("language utilities", () => {
  it("returns body language when supported", () => {
    expect(resolvePreferredLanguage("nl-NL", null)).toBe("nl-NL");
  });

  it("falls back to Accept-Language header", () => {
    expect(resolvePreferredLanguage(undefined, "nl-NL,en;q=0.8")).toBe("nl-NL");
  });

  it("defaults to en-US when no match is found", () => {
    expect(resolvePreferredLanguage(undefined, "fr-FR,es;q=0.8")).toBe("en-US");
  });

  it("validates supported language values", () => {
    expect(isSupportedLanguage("en-US")).toBe(true);
    expect(isSupportedLanguage("zz-ZZ")).toBe(false);
  });
});
