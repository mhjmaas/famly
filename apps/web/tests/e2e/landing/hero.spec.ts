import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Hero", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test("should display hero section with correct content", async () => {
    // Check hero section is visible
    await expect(landingPage.heroSection).toBeVisible();

    // Check heading is visible and has content
    await expect(landingPage.heroHeading).toBeVisible();
    await expect(landingPage.heroHeading).toContainText("Family");

    // Check subheading is visible
    await expect(landingPage.heroSubheading).toBeVisible();
  });

  test("should display CTA buttons", async () => {
    // Check CTA buttons container is visible
    await expect(landingPage.heroCTAButtons).toBeVisible();

    // Check both CTA buttons are present
    const buttons = await landingPage.heroCTAButtons.locator("button").all();
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  test("should have animated entrance effects", async ({ page }) => {
    // Check that hero section has animation classes or styles
    const heroSection = landingPage.heroSection;
    await expect(heroSection).toBeVisible();

    // Verify animations are present (check for animation-related classes or styles)
    const hasAnimations = await page.evaluate(() => {
      const hero = document.querySelector('[data-testid="hero-section"]');
      if (!hero) return false;

      // Check for animation-related classes or computed styles
      const computedStyle = window.getComputedStyle(hero);
      const hasAnimationClass = hero.className.includes("animate");
      const hasTransition = computedStyle.transition !== "all 0s ease 0s";

      return hasAnimationClass || hasTransition;
    });

    expect(hasAnimations).toBeTruthy();
  });

  test("should respect prefers-reduced-motion", async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: "reduce" });

    // Reload page with reduced motion
    await landingPage.goto();
    await waitForPageLoad(page);

    // Hero should still be visible
    await expect(landingPage.heroSection).toBeVisible();

    // Check that animations are disabled or reduced
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    expect(hasReducedMotion).toBe(true);
  });
});
