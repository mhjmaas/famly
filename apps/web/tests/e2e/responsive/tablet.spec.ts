import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Tablet Responsive", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    await setViewport(page, "tablet");
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test("should show 2-column feature grid", async ({ page: _page }) => {
    await landingPage.scrollToSection("features");

    const featureCards = await landingPage.getFeatureCards();

    // Check that first two cards are side by side (2 columns)
    if (featureCards.length >= 2) {
      const firstCardBox = await featureCards[0].boundingBox();
      const secondCardBox = await featureCards[1].boundingBox();

      // On tablet, cards should be roughly on same row (2 columns)
      if (firstCardBox && secondCardBox) {
        const verticalDiff = Math.abs(firstCardBox.y - secondCardBox.y);
        expect(verticalDiff).toBeLessThan(50); // Allow some tolerance
      }
    }
  });

  test("should display navigation with all elements", async () => {
    // All navigation elements should be visible on tablet
    await expect(landingPage.navigation).toBeVisible();
    await expect(landingPage.logoLink).toBeVisible();
    await expect(landingPage.featuresLink).toBeVisible();
    await expect(landingPage.privacyLink).toBeVisible();
    await expect(landingPage.pricingLink).toBeVisible();
    await expect(landingPage.docsLink).toBeVisible();
    await expect(landingPage.signInButton).toBeVisible();
    await expect(landingPage.getStartedButton).toBeVisible();
  });

  test("should display pricing cards side by side", async ({ page: _page }) => {
    await landingPage.scrollToSection("pricing");

    const pricingCards = await landingPage.getPricingCards();

    const selfHostedBox = await pricingCards.selfHosted.boundingBox();
    const cloudBox = await pricingCards.cloud.boundingBox();

    // On tablet, cards should be side by side
    if (selfHostedBox && cloudBox) {
      const verticalDiff = Math.abs(selfHostedBox.y - cloudBox.y);
      expect(verticalDiff).toBeLessThan(50); // Allow some tolerance
    }
  });

  test("should maintain readable spacing", async ({ page }) => {
    // Check that content doesn't feel cramped
    const containerWidth = await page.evaluate(() => {
      const container = document.querySelector(".container");
      return container ? container.clientWidth : 0;
    });

    // Container should have reasonable width on tablet
    expect(containerWidth).toBeGreaterThan(600);
    expect(containerWidth).toBeLessThan(1200);
  });
});
