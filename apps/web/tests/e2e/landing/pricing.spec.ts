import { test, expect } from '@playwright/test';
import { waitForPageLoad } from '../setup/test-helpers';
import { LandingPage } from '../pages/landing.page';

test.describe('Landing Page - Pricing', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test('should display pricing section', async () => {
    // Scroll to pricing section
    await landingPage.scrollToSection('pricing');

    // Check pricing section is visible
    await expect(landingPage.pricingSection).toBeVisible();
  });

  test('should display both pricing options', async () => {
    // Scroll to pricing section
    await landingPage.scrollToSection('pricing');

    // Get pricing cards
    const pricingCards = await landingPage.getPricingCards();

    // Check self-hosted option
    await expect(pricingCards.selfHosted).toBeVisible();
    await expect(pricingCards.selfHosted).toContainText('Free');

    // Check cloud option
    await expect(pricingCards.cloud).toBeVisible();
  });

  test('should display pricing features', async () => {
    // Scroll to pricing section
    await landingPage.scrollToSection('pricing');

    // Get pricing cards
    const pricingCards = await landingPage.getPricingCards();

    // Check that self-hosted card has feature list
    const selfHostedFeatures = pricingCards.selfHosted.locator('ul li');
    const selfHostedCount = await selfHostedFeatures.count();
    expect(selfHostedCount).toBeGreaterThan(0);

    // Check that cloud card has feature list
    const cloudFeatures = pricingCards.cloud.locator('ul li');
    const cloudCount = await cloudFeatures.count();
    expect(cloudCount).toBeGreaterThan(0);
  });

  test('should have CTA buttons on pricing cards', async () => {
    // Scroll to pricing section
    await landingPage.scrollToSection('pricing');

    // Get pricing cards
    const pricingCards = await landingPage.getPricingCards();

    // Check for buttons/links
    const selfHostedButton = pricingCards.selfHosted.locator('a, button').first();
    await expect(selfHostedButton).toBeVisible();

    const cloudButton = pricingCards.cloud.locator('a, button').first();
    await expect(cloudButton).toBeVisible();
  });
});
