import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Mobile Responsive", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    await setViewport(page, "mobile");
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test("should adapt navigation for mobile", async () => {
    // Navigation should be visible
    await expect(landingPage.navigation).toBeVisible();

    // Logo should be visible
    await expect(landingPage.logoLink).toBeVisible();

    // Sign In button should be hidden on mobile
    const signInButton = landingPage.signInButton.locator("button");
    const isHidden = await signInButton.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === "none" || style.visibility === "hidden";
    });
    expect(isHidden).toBe(true);

    // Get Started button should be visible
    await expect(landingPage.getStartedButton).toBeVisible();
  });

  test("should stack feature grid to single column", async ({
    page: _page,
  }) => {
    await landingPage.scrollToSection("features");

    // Get feature cards
    const featureCards = await landingPage.getFeatureCards();

    // Check that cards are stacked (grid should be single column)
    if (featureCards.length >= 2) {
      const firstCardBox = await featureCards[0].boundingBox();
      const secondCardBox = await featureCards[1].boundingBox();

      // On mobile, second card should be below first card (not side by side)
      if (firstCardBox && secondCardBox) {
        expect(secondCardBox.y).toBeGreaterThan(
          firstCardBox.y + firstCardBox.height - 10,
        );
      }
    }
  });

  test("should stack pricing cards vertically", async ({ page: _page }) => {
    await landingPage.scrollToSection("pricing");

    const pricingCards = await landingPage.getPricingCards();

    // Get bounding boxes
    const selfHostedBox = await pricingCards.selfHosted.boundingBox();
    const cloudBox = await pricingCards.cloud.boundingBox();

    // On mobile, cloud card should be below self-hosted (not side by side)
    if (selfHostedBox && cloudBox) {
      expect(cloudBox.y).toBeGreaterThan(
        selfHostedBox.y + selfHostedBox.height - 10,
      );
    }
  });

  test("should have minimum touch target sizes", async ({ page: _page }) => {
    // Check navigation buttons
    const getStartedButton = landingPage.getStartedButton.locator("button");
    const buttonBox = await getStartedButton.boundingBox();

    if (buttonBox) {
      // Minimum 32x32px touch target (reasonable for mobile)
      // Note: WCAG 2.1 Level AA requires 24px, Level AAA requires 44px
      expect(buttonBox.width).toBeGreaterThanOrEqual(32);
      expect(buttonBox.height).toBeGreaterThanOrEqual(32);
    }

    // Check hero CTA buttons
    await landingPage.scrollToSection("hero");
    const heroCTAButtons = await landingPage.heroCTAButtons
      .locator("button")
      .all();

    for (const button of heroCTAButtons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });

  test("should display readable text on mobile", async ({ page: _page }) => {
    // Check hero heading font size
    const heroHeading = landingPage.heroHeading;
    const fontSize = await heroHeading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font size should be at least 16px for readability
    const fontSizeValue = parseInt(fontSize, 10);
    expect(fontSizeValue).toBeGreaterThanOrEqual(16);
  });

  test("should not have horizontal scroll", async ({ page }) => {
    // Check that page doesn't overflow horizontally
    const hasHorizontalScroll = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });

    expect(hasHorizontalScroll).toBe(false);
  });
});
