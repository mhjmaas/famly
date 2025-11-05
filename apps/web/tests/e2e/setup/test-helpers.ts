import type { Page } from "@playwright/test";

/**
 * Wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}

/**
 * Check if element is visible in viewport
 */
export async function isInViewport(
  page: Page,
  selector: string,
): Promise<boolean> {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(
  page: Page,
  selector: string,
): Promise<void> {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, selector);

  // Wait for scroll to complete by checking if element is in viewport
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      return rect.top <= window.innerHeight && rect.bottom >= 0;
    },
    selector,
    { timeout: 5000 }
  );
}

/**
 * Get computed style property
 */
export async function getComputedStyle(
  page: Page,
  selector: string,
  property: string,
): Promise<string> {
  return page.evaluate(
    ({ sel, prop }) => {
      const element = document.querySelector(sel);
      if (!element) return "";
      return window.getComputedStyle(element).getPropertyValue(prop);
    },
    { sel: selector, prop: property },
  );
}

/**
 * Check if animations are reduced
 */
export async function prefersReducedMotion(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
}

/**
 * Set viewport size
 */
export async function setViewport(
  page: Page,
  size: "mobile" | "tablet" | "desktop",
): Promise<void> {
  const viewports = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
  };

  await page.setViewportSize(viewports[size]);
}
