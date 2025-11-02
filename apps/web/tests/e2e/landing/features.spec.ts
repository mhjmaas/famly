import { test, expect } from '@playwright/test';
import { waitForPageLoad } from '../setup/test-helpers';
import { LandingPage } from '../pages/landing.page';

test.describe('Landing Page - Features', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test('should display features section', async () => {
    // Scroll to features section
    await landingPage.scrollToSection('features');

    // Check features section is visible
    await expect(landingPage.featuresSection).toBeVisible();
  });

  test('should display all feature cards', async () => {
    // Scroll to features section
    await landingPage.scrollToSection('features');

    // Get all feature cards
    const featureCards = await landingPage.getFeatureCards();

    // Should have at least 8 feature cards (based on reference design)
    expect(featureCards.length).toBeGreaterThanOrEqual(8);

    // Check first few cards are visible
    for (let i = 0; i < Math.min(3, featureCards.length); i++) {
      await expect(featureCards[i]).toBeVisible();
    }
  });

  test('should have proper heading hierarchy', async () => {
    // Scroll to features section
    await landingPage.scrollToSection('features');

    // Check for main heading
    const heading = landingPage.featuresSection.locator('h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display feature icons', async () => {
    // Scroll to features section
    await landingPage.scrollToSection('features');

    // Get feature cards
    const featureCards = await landingPage.getFeatureCards();

    // Check that at least the first card has an icon (svg)
    if (featureCards.length > 0) {
      const icon = featureCards[0].locator('svg').first();
      await expect(icon).toBeVisible();
    }
  });
});
