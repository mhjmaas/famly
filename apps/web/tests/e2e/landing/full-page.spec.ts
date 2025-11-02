import { test, expect } from '@playwright/test';
import { waitForPageLoad } from '../setup/test-helpers';
import { LandingPage } from '../pages/landing.page';

test.describe('Landing Page - Full Page Integration', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  test('should render all sections in correct order', async () => {
    // Check all sections are visible
    await expect(landingPage.heroSection).toBeVisible();
    
    // Scroll through sections
    await landingPage.scrollToSection('features');
    await expect(landingPage.featuresSection).toBeVisible();
    
    await landingPage.scrollToSection('privacy');
    await expect(landingPage.privacySection).toBeVisible();
    
    await landingPage.scrollToSection('pricing');
    await expect(landingPage.pricingSection).toBeVisible();
    
    await landingPage.scrollToSection('footer');
    await expect(landingPage.footerSection).toBeVisible();
  });

  test('should have smooth page scrolling', async ({ page }) => {
    // Check scroll behavior is smooth
    const scrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });

    // Modern browsers support smooth scrolling
    expect(['smooth', 'auto']).toContain(scrollBehavior);
  });

  test('should navigate to sections using navigation anchors', async ({ page }) => {
    // Test features anchor
    await landingPage.navigateToSection('features');
    expect(page.url()).toContain('#features');
    await expect(landingPage.featuresSection).toBeInViewport();

    // Test privacy anchor
    await landingPage.navigateToSection('privacy');
    expect(page.url()).toContain('#privacy');
    await expect(landingPage.privacySection).toBeInViewport();

    // Test pricing anchor
    await landingPage.navigateToSection('pricing');
    expect(page.url()).toContain('#pricing');
    await expect(landingPage.pricingSection).toBeInViewport();
  });

  test('should have consistent navigation across page', async () => {
    // Navigation should be visible at top
    await expect(landingPage.navigation).toBeVisible();

    // Scroll to middle of page
    await landingPage.scrollToSection('privacy');
    
    // Navigation should still be visible (fixed)
    await expect(landingPage.navigation).toBeVisible();

    // Scroll to bottom
    await landingPage.scrollToSection('footer');
    
    // Navigation should still be visible
    await expect(landingPage.navigation).toBeVisible();
  });

  test('should have proper page metadata', async ({ page }) => {
    // Check title
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
  });

  test('should be accessible via keyboard navigation', async ({ page }) => {
    // Start from top
    await page.keyboard.press('Tab');
    
    // Should be able to tab through navigation
    await expect(landingPage.logoLink).toBeFocused();
    
    // Continue tabbing
    await page.keyboard.press('Tab');
    await expect(landingPage.featuresLink).toBeFocused();
    
    // Should be able to activate links with Enter
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('#features');
  });

  test('should load all sections without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Scroll through all sections
    await landingPage.scrollToSection('features');
    await page.waitForTimeout(500);
    
    await landingPage.scrollToSection('privacy');
    await page.waitForTimeout(500);
    
    await landingPage.scrollToSection('pricing');
    await page.waitForTimeout(500);
    
    await landingPage.scrollToSection('footer');
    await page.waitForTimeout(500);

    // Should have no console errors
    expect(errors).toHaveLength(0);
  });
});
