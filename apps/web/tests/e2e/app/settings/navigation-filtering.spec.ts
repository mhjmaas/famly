import { expect, type Page, test } from "@playwright/test";
import {
    type AuthenticatedUser,
    authenticateUser,
} from "../../helpers/auth";
import { DashboardPage } from "../../pages/dashboard.page";
import { SettingsPage } from "../../pages/settings.page";
import { setViewport, waitForPageLoad } from "../../setup/test-helpers";

async function waitForSettingsUpdate(
    page: Page,
    familyId: string,
    method: "GET" | "PUT" = "PUT"
) {
    return page.waitForResponse(
        (response) =>
            response.url().includes(`/v1/families/${familyId}/settings`) &&
            response.request().method() === method
    );
}

test.describe("Settings Page - Navigation Filtering", () => {
    let settingsPage: SettingsPage;
    let dashboardPage: DashboardPage;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        settingsPage = new SettingsPage(page);
        dashboardPage = new DashboardPage(page);
        parentUser = await authenticateUser(page, {
            name: "Parent Nav Filter User",
            birthdate: "1985-09-10",
            createFamily: true,
            familyName: "Nav Filter Test Family",
        });
    });

    test.describe("Navigation Updates After Toggle", () => {
        test("should hide navigation item when feature is disabled", async ({
            page,
        }) => {
            // Navigate to settings
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Disable tasks feature
            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("tasks");
            await updateResponse;

            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // Tasks navigation item should not be visible
            await expect(dashboardPage.navTasks).not.toBeVisible();
        });

        test("should show navigation item when feature is re-enabled", async ({
            page,
        }) => {
            // Navigate to settings and disable tasks
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            const updateResponse1 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("tasks");
            await updateResponse1;

            // Navigate to dashboard - tasks should be hidden
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            await expect(dashboardPage.navTasks).not.toBeVisible();

            // Go back to settings and re-enable tasks
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            const updateResponse2 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("tasks");
            await updateResponse2;

            // Navigate to dashboard - tasks should be visible again
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            await expect(dashboardPage.navTasks).toBeVisible();
        });

        test("should update navigation for multiple disabled features", async ({
            page,
        }) => {
            // Navigate to settings
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Disable multiple features
            const features = ["tasks", "rewards", "diary"];
            for (const feature of features) {
                const updateResponse = waitForSettingsUpdate(
                    page,
                    parentUser.familyId!,
                    "PUT"
                );
                await settingsPage.toggleFeature(feature);
                await updateResponse;
                await page.waitForTimeout(500);
            }

            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // All disabled features should not be visible in navigation
            await expect(dashboardPage.navTasks).not.toBeVisible();
            await expect(dashboardPage.navRewards).not.toBeVisible();
            await expect(dashboardPage.navDiary).not.toBeVisible();
        });
    });

    test.describe("Settings Navigation Always Visible", () => {
        test("should always show settings link in navigation", async ({
            page,
        }) => {
            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // Settings should be visible
            await expect(dashboardPage.navSettings).toBeVisible();

            // Disable all features
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            const features = [
                "tasks",
                "rewards",
                "shoppingLists",
                "recipes",
                "locations",
                "memories",
                "diary",
                "chat",
                "aiIntegration",
            ];

            for (const feature of features) {
                const updateResponse = waitForSettingsUpdate(
                    page,
                    parentUser.familyId!,
                    "PUT"
                );
                await settingsPage.toggleFeature(feature);
                await updateResponse;
                await page.waitForTimeout(300);
            }

            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // Settings should still be visible
            await expect(dashboardPage.navSettings).toBeVisible();
        });

        test("should always show dashboard link in navigation", async ({
            page,
        }) => {
            // Navigate to settings and disable all features
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            const features = ["tasks", "rewards", "diary", "chat"];
            for (const feature of features) {
                const updateResponse = waitForSettingsUpdate(
                    page,
                    parentUser.familyId!,
                    "PUT"
                );
                await settingsPage.toggleFeature(feature);
                await updateResponse;
                await page.waitForTimeout(300);
            }

            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // Dashboard link should be visible
            await expect(dashboardPage.navDashboard).toBeVisible();
        });
    });

    test.describe("Direct URL Access to Disabled Features", () => {
        test("should redirect to dashboard when accessing disabled feature via URL", async ({
            page,
        }) => {
            // Disable tasks feature
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            await settingsPage.toggleFeature("tasks");
            await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");

            // Try to access tasks page directly
            await page.goto("/en-US/app/tasks");
            await waitForPageLoad(page);

            // Should be redirected to dashboard
            expect(page.url()).toContain("/app");
            expect(page.url()).not.toContain("/tasks");
        });

        test("should redirect for multiple disabled features", async ({
            page,
        }) => {
            // Disable multiple features
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            const features = ["rewards", "diary", "chat"];
            for (const feature of features) {
                await settingsPage.toggleFeature(feature);
                await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");
                await page.waitForTimeout(300);
            }

            // Try to access each disabled feature
            const routes = ["/app/rewards", "/app/diary", "/app/chat"];
            for (const route of routes) {
                await page.goto(`/en-US${route}`);
                await waitForPageLoad(page);

                // Should be redirected to dashboard
                expect(page.url()).toContain("/app");
                expect(page.url()).not.toContain(route.split("/").pop());
            }
        });

        test("should allow access to enabled features", async ({ page }) => {
            // Disable some features but leave others enabled
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            await settingsPage.toggleFeature("rewards");
            await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");

            // Access an enabled feature (tasks)
            await page.goto("/en-US/app/tasks");
            await waitForPageLoad(page);

            // Should stay on tasks page
            expect(page.url()).toContain("/tasks");
        });
    });

    test.describe("Navigation Persistence", () => {
        test("should maintain navigation state across page refreshes", async ({
            page,
        }) => {
            // Disable features
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            const updateResponse1 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("tasks");
            await updateResponse1;

            const updateResponse2 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("rewards");
            await updateResponse2;

            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // Verify navigation items are hidden
            await expect(dashboardPage.navTasks).not.toBeVisible();
            await expect(dashboardPage.navRewards).not.toBeVisible();

            // Refresh page
            await page.reload();
            await waitForPageLoad(page);

            // Navigation items should still be hidden
            await expect(dashboardPage.navTasks).not.toBeVisible();
            await expect(dashboardPage.navRewards).not.toBeVisible();
        });
    });

    test.describe("Feature Combinations", () => {
        test("should handle all features disabled except one", async ({
            page,
        }) => {
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Disable all features except tasks
            const features = [
                "rewards",
                "shoppingLists",
                "recipes",
                "locations",
                "memories",
                "diary",
                "chat",
                "aiIntegration",
            ];

            for (const feature of features) {
                await settingsPage.toggleFeature(feature);
                await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");
                await page.waitForTimeout(200);
            }

            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // Only tasks should be visible in navigation
            await expect(dashboardPage.navTasks).toBeVisible();

            // Other features should not be visible
            await expect(dashboardPage.navRewards).not.toBeVisible();
            await expect(dashboardPage.navDiary).not.toBeVisible();
        });

        test("should handle all features enabled", async ({ page }) => {
            // Ensure all features are enabled
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Navigate to dashboard
            await dashboardPage.gotoApp("en-US");
            await waitForPageLoad(page);

            // All navigation items should be visible
            await expect(dashboardPage.navTasks).toBeVisible();
            await expect(dashboardPage.navRewards).toBeVisible();
            await expect(dashboardPage.navDiary).toBeVisible();
        });
    });
});
