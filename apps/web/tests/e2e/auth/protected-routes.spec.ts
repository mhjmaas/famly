import { expect, test } from "@playwright/test";
import { waitForPageLoad } from "../setup/test-helpers";
import { authenticateUser } from "../helpers/auth";

test.describe("Authentication - Protected Routes", () => {
  test("should redirect unauthenticated users from /app to /signin", async ({
    page,
  }) => {
    // Try to access protected route without authentication
    await page.goto("/en-US/app");

    // Should be redirected to signin page
    await page.waitForURL("**/signin", { timeout: 5000 });
    expect(page.url()).toContain("/signin");

    // Sign in form should be visible
    await expect(page.getByTestId("signin-form")).toBeVisible();
  });

  test("should allow authenticated users to access /app", async ({ page }) => {
    // Authenticate with real user session
    await authenticateUser(page);

    // Navigate to protected route
    await page.goto("/en-US/app");
    await waitForPageLoad(page);

    // Should be able to access the app page
    expect(page.url()).toContain("/app");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("should preserve locale when redirecting to signin", async ({
    page,
  }) => {
    // Try to access protected route with nl-NL locale
    await page.goto("/nl-NL/app");

    // Should be redirected to signin with same locale
    await page.waitForURL("**/nl-NL/signin", { timeout: 5000 });
    expect(page.url()).toContain("/nl-NL/signin");
  });

  test("should redirect from signin to app when already authenticated", async ({
    page,
  }) => {
    // Authenticate with real user session
    await authenticateUser(page);

    // Try to access signin page
    await page.goto("/en-US/signin");

    // Should be redirected to app page
    await page.waitForURL("**/app", { timeout: 5000 });
    expect(page.url()).toContain("/app");
  });

  test("should redirect from get-started to app when already authenticated", async ({
    page,
  }) => {
    // Authenticate with real user session
    await authenticateUser(page);

    // Try to access get-started page
    await page.goto("/en-US/get-started");

    // Should be redirected to app page
    await page.waitForURL("**/app", { timeout: 5000 });
    expect(page.url()).toContain("/app");
  });

  test("should allow unauthenticated users to access landing page", async ({
    page,
  }) => {
    // Navigate to landing page
    await page.goto("/en-US");
    await waitForPageLoad(page);

    // Should be able to access landing page
    expect(page.url()).toContain("/en-US");
    await expect(page.getByTestId("hero-section")).toBeVisible();
  });

  test("should allow authenticated users to access landing page", async ({
    page,
  }) => {
    // Authenticate with real user session
    await authenticateUser(page);

    // Navigate to landing page
    await page.goto("/en-US");
    await waitForPageLoad(page);

    // Should be able to access landing page (no redirect)
    expect(page.url()).toContain("/en-US");
    expect(page.url()).not.toContain("/app");
    await expect(page.getByTestId("hero-section")).toBeVisible();
  });

  test("should handle missing locale in protected route redirect", async ({
    page,
  }) => {
    // Try to access protected route without locale
    await page.goto("/app");

    // Should redirect to signin with default locale
    await page.waitForURL("**/signin", { timeout: 5000 });
    expect(page.url()).toMatch(/\/(en-US|nl-NL)\/signin/);
  });
});
