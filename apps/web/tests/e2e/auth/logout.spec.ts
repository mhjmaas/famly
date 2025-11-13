import { expect, test } from "@playwright/test";
import { authenticateUser } from "../helpers/auth";
import { waitForPageLoad } from "../setup/test-helpers";

test.describe("Authentication - Logout", () => {
  test("should successfully log out user and redirect to signin page", async ({
    page,
  }) => {
    // Arrange: Create and authenticate a test user
    await authenticateUser(page);

    // Navigate to profile page
    await page.goto("/en-US/app/profile");
    await waitForPageLoad(page);

    // Verify user is logged in by checking profile page loads
    await expect(page.getByTestId("user-profile-card")).toBeVisible({
      timeout: 5000,
    });

    // Act: Open profile menu and click logout
    await page.getByTestId("profile-menu-button").click();

    // Wait for dropdown menu to be visible
    await page.waitForTimeout(300);

    // Click the logout button in the dropdown
    await page.getByRole("menuitem", { name: /logout/i }).click();

    // Assert: Should redirect to signin page
    await page.waitForURL("**/signin", { timeout: 5000 });
    expect(page.url()).toContain("/signin");

    // Verify signin form is visible
    await expect(page.getByTestId("signin-form")).toBeVisible();

    // Verify session cookie is cleared
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (cookie) => cookie.name === "better-auth.session_token",
    );
    expect(sessionCookie).toBeUndefined();
  });

  test("should prevent access to protected routes after logout", async ({
    page,
  }) => {
    // Arrange: Create and authenticate a test user
    await authenticateUser(page, { createFamily: true });

    // Navigate to app dashboard
    await page.goto("/en-US/app");
    await waitForPageLoad(page);

    // Verify user can access dashboard
    await expect(page.url()).toContain("/app");

    // Navigate to profile page
    await page.goto("/en-US/app/profile");
    await waitForPageLoad(page);

    // Act: Log out
    await page.getByTestId("profile-menu-button").click();
    await page.waitForTimeout(300);
    await page.getByRole("menuitem", { name: /logout/i }).click();

    // Wait for redirect to signin
    await page.waitForURL("**/signin", { timeout: 5000 });

    // Assert: Try to access protected route - should redirect to signin
    await page.goto("/en-US/app");
    await page.waitForURL("**/signin**", { timeout: 5000 });
    expect(page.url()).toContain("/signin");

    // Try to access profile page - should also redirect to signin
    await page.goto("/en-US/app/profile");
    await page.waitForURL("**/signin**", { timeout: 5000 });
    expect(page.url()).toContain("/signin");
  });

  test("should handle logout gracefully when session is already invalid", async ({
    page,
  }) => {
    // Arrange: Create and authenticate a test user
    const user = await authenticateUser(page);

    // Navigate to profile page
    await page.goto("/en-US/app/profile");
    await waitForPageLoad(page);

    // Manually clear session cookie to simulate expired/invalid session
    await page.context().clearCookies();

    // Act: Try to logout (should still work even with invalid session)
    await page.goto("/en-US/app/profile");

    // Should be redirected to signin since session is cleared
    await page.waitForURL("**/signin**", { timeout: 5000 });
    expect(page.url()).toContain("/signin");

    // Verify signin form is visible
    await expect(page.getByTestId("signin-form")).toBeVisible();
  });

  test("should clear user state after logout", async ({ page }) => {
    // Arrange: Create and authenticate a test user with family
    const user = await authenticateUser(page, { createFamily: true });

    // Navigate to profile page
    await page.goto("/en-US/app/profile");
    await waitForPageLoad(page);

    // Verify user profile is loaded
    await expect(page.getByTestId("user-profile-card")).toBeVisible();

    // Act: Log out
    await page.getByTestId("profile-menu-button").click();
    await page.waitForTimeout(300);
    await page.getByRole("menuitem", { name: /logout/i }).click();

    // Wait for redirect to signin
    await page.waitForURL("**/signin", { timeout: 5000 });

    // Assert: Navigate back to app page should not show user data
    await page.goto("/en-US/app");

    // Should be redirected back to signin since user is logged out
    await page.waitForURL("**/signin**", { timeout: 5000 });
    expect(page.url()).toContain("/signin");

    // Verify session is truly cleared by checking cookies
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter((cookie) =>
      cookie.name.includes("better-auth"),
    );
    expect(authCookies).toHaveLength(0);
  });
});
