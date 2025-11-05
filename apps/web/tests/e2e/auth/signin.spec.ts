import { expect, test } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { waitForPageLoad } from "../setup/test-helpers";
import { authenticateUser } from "../helpers/auth";

test.describe("Authentication - Sign In", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoSignIn();
    await waitForPageLoad(page);
  });

  test("should display sign-in form with correct elements", async () => {
    // Check form is visible
    await expect(authPage.signInForm).toBeVisible();

    // Check form fields are present
    await expect(authPage.signInEmail).toBeVisible();
    await expect(authPage.signInPassword).toBeVisible();
    await expect(authPage.signInSubmit).toBeVisible();

    // Check link to registration
    await expect(authPage.signInGetStartedLink).toBeVisible();
  });

  test("should require email and password fields", async () => {
    // Try to submit empty form
    await authPage.signInSubmit.click();

    // Form should not submit (HTML5 validation)
    await expect(authPage.signInForm).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    // Fill in invalid credentials
    await authPage.signIn("invalid@example.com", "wrongpassword");

    // Wait for error to appear
    await expect(authPage.signInError).toBeVisible({ timeout: 5000 });

    // Should still be on signin page
    expect(page.url()).toContain("/signin");
  });

  test("should navigate to get-started page when clicking registration link", async ({
    page,
  }) => {
    // Click the get started link
    await authPage.signInGetStartedLink.click();

    // Should navigate to get-started page (may include query params)
    await page.waitForURL("**/get-started**", { timeout: 5000 });
    expect(page.url()).toContain("/get-started");
  });

  test("should disable submit button while loading", async () => {
    // Fill in credentials
    await authPage.signInEmail.fill("test@example.com");
    await authPage.signInPassword.fill("password123");

    // Submit form
    await authPage.signInSubmit.click();

    // Button should be disabled immediately
    await expect(authPage.signInSubmit).toBeDisabled();
  });

  test("should accept valid email format", async () => {
    // Fill in valid email
    await authPage.signInEmail.fill("user@example.com");
    await authPage.signInPassword.fill("password123");

    // Submit should be enabled
    await expect(authPage.signInSubmit).toBeEnabled();
  });

  test("should redirect authenticated users to app page", async ({ page }) => {
    // Authenticate with real user session
    await authenticateUser(page);

    // Navigate to signin page
    await authPage.gotoSignIn();

    // Should be redirected to app page
    await page.waitForURL("**/app", { timeout: 5000 });
    expect(page.url()).toContain("/app");
  });
});
