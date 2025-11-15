import { expect, test } from "@playwright/test";
import { authenticateUser } from "../../helpers/auth";
import { DashboardPage } from "../../pages/dashboard.page";
import { waitForPageLoad } from "../../setup/test-helpers";

test.describe("Settings - Role-Based Access", () => {
  test("should hide settings nav item from non-parent users", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    // Authenticate as non-parent user (no family created)
    await authenticateUser(page, {
      name: "Child User",
    });

    await dashboardPage.gotoApp("en-US");
    await waitForPageLoad(page);

    // Settings nav item should not be visible to non-parent users
    await expect(dashboardPage.navSettings).not.toBeVisible();
  });

  test("should show settings nav item to parent users", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Authenticate as parent user (create family)
    await authenticateUser(page, {
      name: "Parent User",
      createFamily: true,
    });

    await dashboardPage.gotoApp("en-US");
    await waitForPageLoad(page);

    // Settings nav item should be visible to parent users
    await expect(dashboardPage.navSettings).toBeVisible();
  });

  test("should redirect non-parent users when accessing settings directly", async ({
    page,
  }) => {
    // Authenticate as non-parent user (no family created)
    const user = await authenticateUser(page, {
      name: "Child User",
    });

    // Try to navigate directly to settings page
    await page.goto("/en-US/app/settings");

    // Should be redirected back to dashboard
    await expect(page).toHaveURL(/\/en-US\/app\/?$/, { timeout: 5000 });
  });

  test("should allow parent users to access settings page", async ({ page }) => {
    const dashboardPage = new DashboardPage(page);

    // Authenticate as parent user (create family)
    await authenticateUser(page, {
      name: "Parent User",
      createFamily: true,
    });

    await dashboardPage.gotoApp("en-US");
    await waitForPageLoad(page);

    // Navigate to settings
    await dashboardPage.navSettings.click();

    // Should be on settings page
    await expect(page).toHaveURL(/\/en-US\/app\/settings/, { timeout: 5000 });
  });

  test("should allow parent users to navigate to settings from nav item", async ({
    page,
  }) => {
    const dashboardPage = new DashboardPage(page);

    // Authenticate as parent user (create family)
    await authenticateUser(page, {
      name: "Parent User",
      createFamily: true,
    });

    await dashboardPage.gotoApp("en-US");
    await waitForPageLoad(page);

    // Settings nav item should be visible
    await expect(dashboardPage.navSettings).toBeVisible();

    // Click settings nav item
    await dashboardPage.navSettings.click();

    // Should navigate to settings page
    await expect(page).toHaveURL(/\/en-US\/app\/(settings|profile)/, {
      timeout: 5000,
    });
  });
});
