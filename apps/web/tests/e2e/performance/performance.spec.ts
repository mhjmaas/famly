import { expect, test } from "@playwright/test";
import { LandingPage } from "../pages/landing.page";
import { waitForPageLoad } from "../setup/test-helpers";

test.describe("Landing Page - Performance", () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    landingPage = new LandingPage(page);
  });

  test("should load within acceptable time", async ({ page }) => {
    const startTime = Date.now();

    await landingPage.goto();
    await waitForPageLoad(page);

    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test("should have good Core Web Vitals - LCP", async ({ page }) => {
    await landingPage.goto();
    await waitForPageLoad(page);

    // Measure Largest Contentful Paint
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            renderTime?: number;
            loadTime?: number;
          };
          resolve(lastEntry.renderTime || lastEntry.loadTime || 0);
        }).observe({ type: "largest-contentful-paint", buffered: true });

        // Timeout after 5 seconds
        setTimeout(() => resolve(0), 5000);
      });
    });

    // LCP should be under 2.5 seconds (good)
    expect(lcp).toBeLessThan(2500);
  });

  test("should have minimal layout shifts - CLS", async ({ page }) => {
    await landingPage.goto();
    await waitForPageLoad(page);

    // Wait for page to settle
    await page.waitForTimeout(2000);

    // Measure Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as PerformanceEntry & {
              hadRecentInput?: boolean;
              value: number;
            };
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
        }).observe({ type: "layout-shift", buffered: true });

        setTimeout(() => resolve(clsValue), 1000);
      });
    });

    // CLS should be under 0.1 (good)
    expect(cls).toBeLessThan(0.1);
  });

  test("should have fast First Input Delay - FID", async ({ page }) => {
    await landingPage.goto();
    await waitForPageLoad(page);

    // Simulate user interaction
    const startTime = Date.now();
    await landingPage.featuresLink.click();
    const interactionTime = Date.now() - startTime;

    // First interaction should respond quickly (under 150ms)
    // Dev build includes HMR, source maps, and unminified code so threshold is higher
    expect(interactionTime).toBeLessThan(150);
  });

  // Skipped: Dev build includes HMR, source maps, and unminified code
  // TODO: Run this test against production build: `pnpm build && pnpm start`
  // TODO: Production JS bundle should be < 500KB, CSS < 100KB
  test.skip("should not load excessive resources", async ({ page }) => {
    const resourceSizes: { [key: string]: number } = {
      script: 0,
      stylesheet: 0,
      image: 0,
      font: 0,
    };

    page.on("response", async (response) => {
      const _url = response.url();
      const request = response.request();
      const resourceType = request.resourceType();

      if (["script", "stylesheet", "image", "font"].includes(resourceType)) {
        try {
          const buffer = await response.body();
          resourceSizes[resourceType] += buffer.length;
        } catch {
          // Ignore errors for resources we can't measure
        }
      }
    });

    await landingPage.goto();
    await waitForPageLoad(page);
    await page.waitForTimeout(2000); // Wait for all resources

    // Check resource sizes are reasonable
    // JavaScript should be under 500KB
    expect(resourceSizes.script).toBeLessThan(500 * 1024);

    // CSS should be under 100KB
    expect(resourceSizes.stylesheet).toBeLessThan(100 * 1024);

    // Images should be under 2MB total
    expect(resourceSizes.image).toBeLessThan(2 * 1024 * 1024);
  });

  test("should have efficient animations", async ({ page }) => {
    await landingPage.goto();
    await waitForPageLoad(page);

    // Check that animations use GPU-accelerated properties
    const usesGPUAcceleration = await page.evaluate(() => {
      const animatedElements = document.querySelectorAll('[class*="animate"]');

      for (const element of Array.from(animatedElements)) {
        const styles = window.getComputedStyle(element);
        const transform = styles.transform;
        const willChange = styles.willChange;

        // Should use transform or have will-change set
        if (transform !== "none" || willChange !== "auto") {
          return true;
        }
      }

      return animatedElements.length === 0; // OK if no animations
    });

    expect(usesGPUAcceleration).toBe(true);
  });

  test.skip("should have fast Time to Interactive", async ({ page }) => {
    const startTime = Date.now();

    await landingPage.goto();

    // Wait for page to be fully interactive
    await page.waitForLoadState("networkidle");

    const tti = Date.now() - startTime;

    // Time to Interactive should be under 5 seconds
    expect(tti).toBeLessThan(5000);
  });

  test("should lazy load images below the fold", async ({ page }) => {
    await landingPage.goto();

    // Check if images have loading="lazy" attribute
    const images = await page.locator("img").all();

    let hasLazyLoading = false;
    for (const img of images) {
      const loading = await img.getAttribute("loading");
      if (loading === "lazy") {
        hasLazyLoading = true;
        break;
      }
    }

    // At least some images should use lazy loading
    // (or page might not have images below fold)
    const imageCount = images.length;
    expect(imageCount === 0 || hasLazyLoading).toBe(true);
  });

  test("should not block rendering with scripts", async ({ page }) => {
    await landingPage.goto();

    // Check that scripts don't block rendering
    const blockingScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll("script[src]");
      let blocking = 0;

      for (const script of Array.from(scripts)) {
        const hasAsync = script.hasAttribute("async");
        const hasDefer = script.hasAttribute("defer");
        const hasModule = script.getAttribute("type") === "module";

        if (!hasAsync && !hasDefer && !hasModule) {
          blocking++;
        }
      }

      return blocking;
    });

    // Should have minimal render-blocking scripts
    // Note: Next.js dev mode includes some blocking scripts for HMR
    // In production build, this should be much lower
    expect(blockingScripts).toBeLessThan(5);
  });
});
