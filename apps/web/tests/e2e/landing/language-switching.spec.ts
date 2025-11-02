import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Language Switching", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
    // Scroll to footer to ensure language selector is visible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(100);
  });

  test("should switch from English to Dutch", async ({ page }) => {
    // Verify we start in English
    let currentLocale = await landingPage.getCurrentLocale();
    expect(currentLocale).toBe("en-US");

    // Verify initial HTML lang attribute
    let htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("en-US");

    // Switch to Dutch
    await landingPage.switchLanguage("nl-NL");

    // Verify URL changed
    currentLocale = await landingPage.getCurrentLocale();
    expect(currentLocale).toBe("nl-NL");

    // Verify HTML lang attribute changed
    htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("nl-NL");
  });

  test("should switch from Dutch to English", async ({ page }) => {
    // First switch to Dutch
    await landingPage.switchLanguage("nl-NL");
    let currentLocale = await landingPage.getCurrentLocale();
    expect(currentLocale).toBe("nl-NL");

    // Now switch back to English
    await landingPage.switchLanguage("en-US");

    // Verify URL changed back
    currentLocale = await landingPage.getCurrentLocale();
    expect(currentLocale).toBe("en-US");

    // Verify HTML lang attribute is back to English
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("en-US");
  });

  test("should work when switching language from middle of page", async ({
    page,
  }) => {
    // Scroll to features section (not at footer)
    const featuresSection = landingPage.featuresSection;
    await featuresSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);

    // Verify we're scrolled down
    const scrollPosition = await page.evaluate(() => window.scrollY);
    expect(scrollPosition).toBeGreaterThan(100);

    // Switch language - this should work even though we're not at the footer
    await landingPage.switchLanguage("nl-NL");

    // Verify language changed
    const currentLocale = await landingPage.getCurrentLocale();
    expect(currentLocale).toBe("nl-NL");

    // Verify HTML lang attribute changed
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("nl-NL");
  });

  test("should update page metadata when switching language", async ({
    page,
  }) => {
    // Get initial title in English
    const titleBefore = await page.title();
    expect(titleBefore).toContain("Famly");

    // Switch to Dutch
    await landingPage.switchLanguage("nl-NL");

    // Wait for page to fully load after navigation
    await waitForPageLoad(page);

    // Verify language attribute changed
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("nl-NL");

    // Wait for title to be updated and get title in Dutch
    await page.waitForFunction(() => document.title.length > 0, {
      timeout: 5000,
    });
    const titleAfter = await page.title();
    expect(titleAfter).toBeTruthy();
    expect(titleAfter.length).toBeGreaterThan(0);
  });

  test("should verify language selector button states", async ({ page }) => {
    // Find the language selector navigation
    const languageGroup = page.locator("nav").filter({
      has: page.getByRole("button", { name: /English|Nederlands/ }),
    });

    // EN button (labeled "English") should be active initially
    const enButton = languageGroup.getByRole("button", { name: /English/ });
    await expect(enButton).toHaveClass(/bg-background/);
    await expect(enButton).toHaveAttribute("aria-pressed", "true");

    // NL button (labeled "Nederlands") should not be active
    const nlButton = languageGroup.getByRole("button", { name: /Nederlands/ });
    await expect(nlButton).not.toHaveClass(/bg-background shadow-sm/);
    await expect(nlButton).toHaveAttribute("aria-pressed", "false");

    // Switch to Dutch
    await landingPage.switchLanguage("nl-NL");

    // NL button should now be active
    await expect(nlButton).toHaveClass(/bg-background/);
    await expect(nlButton).toHaveAttribute("aria-pressed", "true");

    // EN button should no longer be active
    await expect(enButton).not.toHaveClass(/bg-background shadow-sm/);
    await expect(enButton).toHaveAttribute("aria-pressed", "false");
  });

  test("should preserve query parameters when switching language", async ({
    page,
  }) => {
    // Add a query parameter
    await page.goto("/en-US?test=true");

    // Switch language
    await landingPage.switchLanguage("nl-NL");

    // Verify query parameter is preserved
    const url = page.url();
    expect(url).toContain("nl-NL");
    expect(url).toContain("test=true");
  });

  test("should switch language via direct URL navigation", async ({ page }) => {
    // Start at en-US
    await landingPage.goto();
    let currentLocale = await landingPage.getCurrentLocale();
    expect(currentLocale).toBe("en-US");

    // Navigate directly to nl-NL
    await page.goto("/nl-NL");
    await waitForPageLoad(page);

    // Verify locale changed
    currentLocale = await landingPage.getCurrentLocale();
    expect(currentLocale).toBe("nl-NL");

    // Verify content is in Dutch
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("nl-NL");
  });

  test("should have accessible language selector", async ({ page }) => {
    // Language selector should have proper ARIA attributes
    const languageGroup = page
      .locator("nav")
      .filter({ has: page.getByRole("button").filter({ hasText: /EN|NL/ }) });
    const isVisible = await languageGroup.isVisible();
    expect(isVisible).toBe(true);

    // Get all buttons in the language selector
    const enButton = languageGroup
      .getByRole("button")
      .filter({ hasText: /EN/ });
    const nlButton = languageGroup
      .getByRole("button")
      .filter({ hasText: /NL/ });

    // Buttons should have aria-label attributes
    const enLabel = await enButton.first().getAttribute("aria-label");
    const nlLabel = await nlButton.first().getAttribute("aria-label");
    expect(enLabel).toBeTruthy();
    expect(nlLabel).toBeTruthy();

    // Active button should have aria-current or aria-pressed set to true
    const activeButton = languageGroup
      .getByRole("button")
      .filter({ hasText: /EN/ });
    const ariaPressed = await activeButton.first().getAttribute("aria-pressed");
    expect(ariaPressed).toBe("true");
  });
});
