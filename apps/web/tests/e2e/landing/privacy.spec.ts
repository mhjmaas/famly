import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Privacy", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test("should display privacy section", async () => {
    // Scroll to privacy section
    await landingPage.scrollToSection("privacy");

    // Check privacy section is visible
    await expect(landingPage.privacySection).toBeVisible();
  });

  test("should display privacy heading and content", async () => {
    // Scroll to privacy section
    await landingPage.scrollToSection("privacy");

    // Check for heading containing "Privacy"
    const heading = landingPage.privacySection.locator("h2").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText("Privacy");
  });

  test("should display privacy feature cards", async () => {
    // Scroll to privacy section
    await landingPage.scrollToSection("privacy");

    // Check for multiple cards/features
    const cards = landingPage.privacySection.locator('[class*="grid"] > div');
    const count = await cards.count();

    // Should have at least 4 privacy features
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test("should have shield/security icons", async () => {
    // Scroll to privacy section
    await landingPage.scrollToSection("privacy");

    // Check for SVG icons (security/privacy related)
    const icons = landingPage.privacySection.locator("svg");
    const iconCount = await icons.count();

    expect(iconCount).toBeGreaterThan(0);
  });
});
