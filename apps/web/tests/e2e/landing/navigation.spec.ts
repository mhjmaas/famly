import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Navigation", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test("should display navigation with logo and links", async () => {
    // Check logo is visible
    await expect(landingPage.logoLink).toBeVisible();
    await expect(landingPage.logoLink).toContainText("Famly");

    // Check navigation links are visible
    await expect(landingPage.featuresLink).toBeVisible();
    await expect(landingPage.privacyLink).toBeVisible();
    await expect(landingPage.pricingLink).toBeVisible();
    await expect(landingPage.docsLink).toBeVisible();

    // Check CTA buttons are visible
    await expect(landingPage.signInButton).toBeVisible();
    await expect(landingPage.getStartedButton).toBeVisible();
  });

  test("should change appearance on scroll", async () => {
    // Check initial state (not scrolled)
    const isInitiallyScrolled = await landingPage.isNavigationScrolled();
    expect(isInitiallyScrolled).toBe(false);

    // Scroll down
    await landingPage.scrollPage(100);

    // Check scrolled state (blurred background)
    const isScrolled = await landingPage.isNavigationScrolled();
    expect(isScrolled).toBe(true);
  });

  test("should have proper keyboard navigation", async ({ page: _page }) => {
    // Tab to logo link
    await landingPage.tabThroughNavigation();
    await expect(landingPage.logoLink).toBeFocused();

    // Tab to features link
    await landingPage.tabThroughNavigation();
    await expect(landingPage.featuresLink).toBeFocused();

    // Tab to privacy link
    await landingPage.tabThroughNavigation();
    await expect(landingPage.privacyLink).toBeFocused();

    // Tab to pricing link
    await landingPage.tabThroughNavigation();
    await expect(landingPage.pricingLink).toBeFocused();

    // Tab to docs link
    await landingPage.tabThroughNavigation();
    await expect(landingPage.docsLink).toBeFocused();
  });

  test("should navigate to sections when clicking anchor links", async ({
    page,
  }) => {
    // Navigate to features section
    await landingPage.navigateToSection("features");
    expect(page.url()).toContain("#features");

    // Navigate to privacy section
    await landingPage.navigateToSection("privacy");
    expect(page.url()).toContain("#privacy");

    // Navigate to pricing section
    await landingPage.navigateToSection("pricing");
    expect(page.url()).toContain("#pricing");
  });

  test("should be responsive on mobile", async ({ page }) => {
    await setViewport(page, "mobile");

    // Navigation should still be visible
    await expect(landingPage.navigation).toBeVisible();

    // Logo should be visible
    await expect(landingPage.logoLink).toBeVisible();

    // Sign In button should be hidden on small screens
    await expect(landingPage.signInButton.locator("button")).toHaveClass(
      /hidden/,
    );

    // Get Started button should be visible
    await expect(landingPage.getStartedButton).toBeVisible();
  });

  test("should have proper ARIA labels", async () => {
    // Check navigation is visible
    await expect(landingPage.navigation).toBeVisible();

    // Check buttons have accessible names
    await expect(landingPage.getStartedButton.locator("button")).toHaveText(
      "Get Started",
    );
  });
});
