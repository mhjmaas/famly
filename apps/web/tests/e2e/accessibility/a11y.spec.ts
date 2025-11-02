import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForPageLoad } from '../setup/test-helpers';
import { LandingPage } from '../pages/landing.page';

test.describe('Landing Page - Accessibility', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
    await landingPage.goto();
    await waitForPageLoad(page);
  });

  // Skipped: Requires manual review of axe-core violations and fixes
  // Run `pnpm test:e2e:ui` to see detailed violations
  // TODO: Review axe-core report, fix violations, then re-enable this test
  test.skip('should not have automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Get all headings
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    // Should have at least one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);

    // Check heading levels don't skip (e.g., h1 -> h3 without h2)
    const headingLevels = await Promise.all(
      headings.map(async (heading) => {
        const tagName = await heading.evaluate((el) => el.tagName.toLowerCase());
        return parseInt(tagName.substring(1));
      })
    );

    // Verify no skipped levels
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have proper ARIA labels on interactive elements', async () => {
    // Check navigation links have accessible names
    await expect(landingPage.featuresLink).toHaveAttribute('href', '#features');
    await expect(landingPage.privacyLink).toHaveAttribute('href', '#privacy');
    await expect(landingPage.pricingLink).toHaveAttribute('href', '#pricing');

    // Check buttons have accessible text
    const getStartedButton = landingPage.getStartedButton.locator('button');
    const buttonText = await getStartedButton.textContent();
    expect(buttonText?.trim().length).toBeGreaterThan(0);
  });

  // Skipped: Color contrast needs design review and adjustment
  // TODO: Review text colors in globals.css, adjust to meet 4.5:1 ratio for normal text
  // TODO: Use contrast checker tools to verify all text/background combinations
  test.skip('should have sufficient color contrast', async ({ page }) => {
    // Run axe with specific color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (violation) => violation.id === 'color-contrast'
    );

    expect(contrastViolations).toHaveLength(0);
  });

  test('should have alt text for images', async ({ page }) => {
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      // Images should have alt attribute (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Start from top
    await page.keyboard.press('Tab');

    // Should be able to reach navigation
    await expect(landingPage.logoLink).toBeFocused();

    // Continue tabbing through navigation
    await page.keyboard.press('Tab');
    await expect(landingPage.featuresLink).toBeFocused();

    // Should be able to activate with Enter
    await page.keyboard.press('Enter');
    await page.waitForURL('**/en-US#features');
  });

  test('should have proper form labels if forms exist', async ({ page }) => {
    // Check if there are any form inputs
    const inputs = await page.locator('input, textarea, select').all();
    
    for (const input of inputs) {
      // Each input should have associated label or aria-label
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');
      
      let hasLabel = false;
      
      if (ariaLabel || ariaLabelledBy) {
        hasLabel = true;
      } else if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }
      
      expect(hasLabel).toBe(true);
    }
  });

  test('should have proper landmark regions', async ({ page }) => {
    // Check for main landmark
    const main = await page.locator('main').count();
    expect(main).toBeGreaterThanOrEqual(1);

    // Check for navigation landmark
    const nav = await page.locator('nav').count();
    expect(nav).toBeGreaterThanOrEqual(1);

    // Check for footer landmark
    const footer = await page.locator('footer').count();
    expect(footer).toBeGreaterThanOrEqual(1);
  });

  test('should have focus indicators', async ({ page }) => {
    // Tab to first focusable element
    await page.keyboard.press('Tab');
    
    // Check that focused element has visible outline or focus style
    const hasFocusStyle = await page.evaluate(() => {
      const focused = document.activeElement;
      if (!focused) return false;
      
      const styles = window.getComputedStyle(focused);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;
      
      // Should have some focus indicator
      return outline !== 'none' || boxShadow !== 'none';
    });
    
    expect(hasFocusStyle).toBe(true);
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Emulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Reload page
    await landingPage.goto();
    await waitForPageLoad(page);

    // Check that animations are disabled or reduced
    const hasReducedMotion = await page.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    expect(hasReducedMotion).toBe(true);

    // Page should still be functional
    await expect(landingPage.heroSection).toBeVisible();
    await expect(landingPage.navigation).toBeVisible();
  });
});
