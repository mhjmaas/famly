import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Footer", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test("should display footer section", async () => {
    // Scroll to footer
    await landingPage.scrollToSection("footer");

    // Check footer is visible
    await expect(landingPage.footerSection).toBeVisible();
  });

  test("should display all footer columns", async () => {
    // Scroll to footer
    await landingPage.scrollToSection("footer");

    // Check for multiple columns (Product, Resources, Company, etc.)
    const columns = landingPage.footerSection.locator('[class*="grid"] > div');
    const count = await columns.count();

    // Should have at least 3 columns
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("should display social links", async () => {
    // Scroll to footer
    await landingPage.scrollToSection("footer");

    // Check for social media links (look for common social icons)
    const socialLinks = landingPage.footerSection.locator(
      'a[href*="github"], a[href*="twitter"], a[href*="mailto"]',
    );
    const socialCount = await socialLinks.count();

    expect(socialCount).toBeGreaterThan(0);
  });

  test("should display theme toggle", async () => {
    // Scroll to footer
    await landingPage.scrollToSection("footer");

    // Check theme toggle is present
    await expect(landingPage.themeToggle).toBeVisible();
  });

  test("should display copyright with current year", async ({
    page: _page,
  }) => {
    // Scroll to footer
    await landingPage.scrollToSection("footer");

    // Get current year
    const currentYear = new Date().getFullYear();

    // Check for copyright text with current year
    const copyrightText = await landingPage.footerSection.textContent();
    expect(copyrightText).toContain(currentYear.toString());
  });

  test("should have working theme toggle in footer", async () => {
    // Scroll to footer
    await landingPage.scrollToSection("footer");

    // Get initial theme
    const initialTheme = await landingPage.getCurrentTheme();

    // Toggle to opposite theme
    const targetTheme = initialTheme === "dark" ? "light" : "dark";
    await landingPage.setTheme(targetTheme);

    // Verify theme changed
    const newTheme = await landingPage.getCurrentTheme();
    expect(newTheme).toBe(targetTheme);
  });
});
