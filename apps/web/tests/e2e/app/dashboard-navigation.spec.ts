import { expect, test } from "@playwright/test";
import { DashboardPage } from "../pages/dashboard.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

test.describe("Dashboard - Navigation", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    // Set authentication cookie to access protected routes
    await dashboardPage.setAuthCookie();
    await dashboardPage.gotoApp("en-US");
    await waitForPageLoad(page);
  });

  test("should display desktop layout on large screens", async ({ page }) => {
    await setViewport(page, "desktop");
    await page.waitForTimeout(500); // Wait for responsive layout to apply

    // Desktop sidebar should be visible
    await expect(dashboardPage.desktopSidebar).toBeVisible();
    await expect(dashboardPage.desktopLogo).toBeVisible();
    await expect(dashboardPage.desktopNavigation).toBeVisible();

    // Mobile header should not be visible
    await expect(dashboardPage.mobileHeader).not.toBeVisible();
    await expect(dashboardPage.tabletSidebar).not.toBeVisible();
  });

  test("should display tablet layout on medium screens", async ({ page }) => {
    await setViewport(page, "tablet");
    await page.waitForTimeout(500);

    // Tablet sidebar should be visible
    await expect(dashboardPage.tabletSidebar).toBeVisible();
    await expect(dashboardPage.tabletLogo).toBeVisible();
    await expect(dashboardPage.tabletNavigation).toBeVisible();

    // Desktop and mobile sidebars should not be visible
    await expect(dashboardPage.desktopSidebar).not.toBeVisible();
    await expect(dashboardPage.mobileHeader).not.toBeVisible();
  });

  test("should display mobile layout on small screens", async ({ page }) => {
    await setViewport(page, "mobile");
    await page.waitForTimeout(500);

    // Mobile header should be visible
    await expect(dashboardPage.mobileHeader).toBeVisible();
    await expect(dashboardPage.mobileMenuButton).toBeVisible();

    // Sidebars should not be visible initially
    await expect(dashboardPage.desktopSidebar).not.toBeVisible();
    await expect(dashboardPage.tabletSidebar).not.toBeVisible();
  });

  test("should open and close mobile drawer", async ({ page }) => {
    await setViewport(page, "mobile");

    // Drawer should not be visible initially
    await expect(dashboardPage.mobileDrawer).not.toBeVisible();

    // Click menu button to open drawer
    await dashboardPage.openMobileDrawer();
    await expect(dashboardPage.mobileDrawer).toBeVisible();

    // Close drawer
    await dashboardPage.closeMobileDrawer();
    await expect(dashboardPage.mobileDrawer).not.toBeVisible();
  });

  test("should navigate to dashboard page", async ({ page }) => {
    await expect(dashboardPage.navDashboard).toBeVisible();
    await dashboardPage.navDashboard.click();

    await expect(page).toHaveURL(/\/app\/?$/, { timeout: 5000 });
  });

  test("should expand and collapse family section", async ({ page }) => {
    await setViewport(page, "desktop");

    // Family section should exist
    await expect(dashboardPage.navFamilySection).toBeVisible();

    // Family items should be visible by default (sections start expanded)
    await expect(dashboardPage.navMembers).toBeVisible();
    await expect(dashboardPage.navTasks).toBeVisible();
    await expect(dashboardPage.navShoppingLists).toBeVisible();
    await expect(dashboardPage.navRewards).toBeVisible();

    // Click to collapse family section
    const familyTrigger = page.getByTestId("nav-section-family-trigger");
    await familyTrigger.click();
    await page.waitForTimeout(300); // Wait for animation

    // Family items should now be hidden
    await expect(dashboardPage.navMembers).not.toBeVisible();
    await expect(dashboardPage.navTasks).not.toBeVisible();
    await expect(dashboardPage.navShoppingLists).not.toBeVisible();
    await expect(dashboardPage.navRewards).not.toBeVisible();

    // Click to expand again
    await familyTrigger.click();
    await page.waitForTimeout(300); // Wait for animation

    // Family items should be visible again
    await expect(dashboardPage.navMembers).toBeVisible();
    await expect(dashboardPage.navTasks).toBeVisible();
    await expect(dashboardPage.navShoppingLists).toBeVisible();
    await expect(dashboardPage.navRewards).toBeVisible();
  });

  test("should expand and collapse personal section", async ({ page }) => {
    await setViewport(page, "desktop");

    // Personal section should exist
    await expect(dashboardPage.navPersonalSection).toBeVisible();

    // Personal items should be visible by default (sections start expanded)
    await expect(dashboardPage.navDiary).toBeVisible();
    await expect(dashboardPage.navChat).toBeVisible();
    await expect(dashboardPage.navSettings).toBeVisible();

    // Click to collapse personal section
    const personalTrigger = page.getByTestId("nav-section-personal-trigger");
    await personalTrigger.click();
    await page.waitForTimeout(300); // Wait for animation

    // Personal items should now be hidden
    await expect(dashboardPage.navDiary).not.toBeVisible();
    await expect(dashboardPage.navChat).not.toBeVisible();
    await expect(dashboardPage.navSettings).not.toBeVisible();

    // Click to expand again
    await personalTrigger.click();
    await page.waitForTimeout(300); // Wait for animation

    // Personal items should be visible again
    await expect(dashboardPage.navDiary).toBeVisible();
    await expect(dashboardPage.navChat).toBeVisible();
    await expect(dashboardPage.navSettings).toBeVisible();
  });

  test("should navigate to family members page", async ({ page }) => {
    // Family section is expanded by default
    await dashboardPage.navMembers.click();

    await expect(page).toHaveURL(/\/app\/family/, { timeout: 5000 });
  });

  test("should navigate to tasks page", async ({ page }) => {
    // Family section is expanded by default
    await dashboardPage.navTasks.click();

    await expect(page).toHaveURL(/\/app\/tasks/, { timeout: 5000 });
  });

  test("should navigate to shopping lists page", async ({ page }) => {
    // Family section is expanded by default
    await dashboardPage.navShoppingLists.click();

    await expect(page).toHaveURL(/\/app\/shopping-lists/, { timeout: 5000 });
  });

  test("should navigate to rewards page", async ({ page }) => {
    // Family section is expanded by default
    await dashboardPage.navRewards.click();

    await expect(page).toHaveURL(/\/app\/rewards/, { timeout: 5000 });
  });

  test("should navigate to diary page", async ({ page }) => {
    // Personal section is expanded by default
    await dashboardPage.navDiary.click();

    await expect(page).toHaveURL(/\/app\/diary/, { timeout: 5000 });
  });

  test("should navigate to chat page", async ({ page }) => {
    // Personal section is expanded by default
    await dashboardPage.navChat.click();

    await expect(page).toHaveURL(/\/app\/chat/, { timeout: 5000 });
  });

  test("should navigate to settings page", async ({ page }) => {
    // Personal section is expanded by default
    await dashboardPage.navSettings.click();

    await expect(page).toHaveURL(/\/app\/settings/, { timeout: 5000 });
  });

  test("should display user profile information", async ({ page }) => {
    await setViewport(page, "desktop");

    // User profile should be visible
    await expect(dashboardPage.desktopUserProfile).toBeVisible();
    await expect(dashboardPage.userName).toBeVisible();
    await expect(dashboardPage.userFamily).toBeVisible();

    // Check user info
    await expect(dashboardPage.userName).toContainText("John Doe");
    await expect(dashboardPage.userFamily).toContainText("The Doe Family");
  });

  test("should show disabled calendar with 'Soon' badge", async ({ page }) => {
    const initialUrl = page.url();
    await dashboardPage.navCalendar.click();

    // Calendar is disabled, so should not navigate
    await expect(page).toHaveURL(initialUrl, { timeout: 5000 });

    // Check for 'Soon' badge - target the badge specifically
    const soonBadge = page.getByTestId("nav-calendar").locator('[data-slot="badge"]');
    await expect(soonBadge).toContainText("Soon");
  });


  test("should highlight active navigation item", async ({ page }) => {
    await setViewport(page, "desktop");

    // Navigate to tasks page
    await dashboardPage.navTasks.click();
    await expect(page).toHaveURL(/\/app\/tasks/, { timeout: 5000 });

    // Tasks nav item should have active styling
    const tasksNav = dashboardPage.navTasks;
    await expect(tasksNav).toHaveClass(/bg-primary/);
  });


  test("should display content area with proper padding", async ({ page }) => {
    await setViewport(page, "desktop");

    // Main content should exist
    await expect(dashboardPage.mainContent).toBeVisible();
    await expect(dashboardPage.pageContent).toBeVisible();

    // Content should have proper left padding for sidebar
    const mainContent = dashboardPage.mainContent;
    const classes = await mainContent.getAttribute("class");
    expect(classes).toContain("pl-72"); // Desktop padding
  });
});
