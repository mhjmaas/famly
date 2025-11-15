import { expect, test } from "@playwright/test";
import {
    type AuthenticatedUser,
    authenticateUser,
    switchUser,
} from "../../helpers/auth";
import { SettingsPage } from "../../pages/settings.page";
import { setViewport, waitForPageLoad } from "../../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

test.describe("Settings Page - Page Load", () => {
    let settingsPage: SettingsPage;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        settingsPage = new SettingsPage(page);
        parentUser = await authenticateUser(page, {
            name: "Parent Settings User",
            birthdate: "1985-06-15",
            createFamily: true,
            familyName: "Settings Test Family",
        });
    });

    test.describe("Parent Access", () => {
        test("should load settings page for parent user", async ({ page }) => {
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Verify page title and description are visible
            await expect(settingsPage.pageTitle).toBeVisible();
            await expect(settingsPage.pageDescription).toBeVisible();

            // Verify tabs are visible
            await expect(settingsPage.featuresTab).toBeVisible();
            await expect(settingsPage.aiSettingsTab).toBeVisible();

            // Verify features tab is active by default
            await expect(settingsPage.featureToggleTasks).toBeVisible();
        });

        test("should display all feature toggles on Features tab", async ({
            page,
        }) => {
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Verify all 9 feature toggles are visible
            await expect(settingsPage.featureToggleTasks).toBeVisible();
            await expect(settingsPage.featureToggleRewards).toBeVisible();
            await expect(settingsPage.featureToggleShoppingLists).toBeVisible();
            await expect(settingsPage.featureToggleRecipes).toBeVisible();
            await expect(settingsPage.featureToggleLocations).toBeVisible();
            await expect(settingsPage.featureToggleMemories).toBeVisible();
            await expect(settingsPage.featureToggleDiary).toBeVisible();
            await expect(settingsPage.featureToggleChat).toBeVisible();
            await expect(settingsPage.featureToggleAiIntegration).toBeVisible();

            // Verify all features are enabled by default
            expect(await settingsPage.isFeatureEnabled("tasks")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("rewards")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("shoppingLists")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("recipes")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("locations")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("memories")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("diary")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("chat")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("aiIntegration")).toBe(true);
        });

        test("should display AI settings form on AI Settings tab", async ({
            page,
        }) => {
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Switch to AI Settings tab
            await settingsPage.switchToAISettingsTab();

            // Verify all form fields are visible
            await expect(settingsPage.aiNameInput).toBeVisible();
            await expect(settingsPage.apiEndpointInput).toBeVisible();
            await expect(settingsPage.apiSecretInput).toBeVisible();
            await expect(settingsPage.modelNameInput).toBeVisible();

            // Verify buttons are visible
            await expect(settingsPage.saveAiSettingsButton).toBeVisible();
            await expect(settingsPage.resetAiSettingsButton).toBeVisible();
        });
    });

    test.describe("Child Access Restriction", () => {
        test("should redirect child user to dashboard", async ({ page }) => {
            // Create child user
            const childUser = await authenticateUser(page, {
                name: "Child Settings User",
                birthdate: "2012-08-20",
            });

            // Add child to family
            const addChildResponse = await fetch(
                `${API_URL}/v1/families/${parentUser.familyId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${parentUser.sessionToken}`,
                    },
                    body: JSON.stringify({
                        email: childUser.email,
                        password: childUser.password,
                        name: childUser.name,
                        birthdate: "2012-08-20",
                        role: "Child",
                    }),
                }
            );

            expect(addChildResponse.ok).toBeTruthy();
            childUser.familyId = parentUser.familyId;

            // Switch to child user and try to access settings
            await switchUser(page, childUser);
            await page.goto("/en-US/app/settings");
            await waitForPageLoad(page);

            // Should be redirected to dashboard
            expect(page.url()).toContain("/app");
            expect(page.url()).not.toContain("/settings");
        });
    });

    test.describe("Tab Switching", () => {
        test("should switch between tabs correctly", async ({ page }) => {
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Features tab should be active by default
            await expect(settingsPage.featureToggleTasks).toBeVisible();

            // Switch to AI Settings tab
            await settingsPage.switchToAISettingsTab();
            await expect(settingsPage.aiNameInput).toBeVisible();
            await expect(settingsPage.featureToggleTasks).not.toBeVisible();

            // Switch back to Features tab
            await settingsPage.switchToFeaturesTab();
            await expect(settingsPage.featureToggleTasks).toBeVisible();
            await expect(settingsPage.aiNameInput).not.toBeVisible();
        });

        test("should maintain tab state when navigating away and back", async ({
            page,
        }) => {
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Switch to AI Settings tab
            await settingsPage.switchToAISettingsTab();
            await expect(settingsPage.aiNameInput).toBeVisible();

            // Navigate to another page
            await page.goto("/en-US/app");
            await waitForPageLoad(page);

            // Navigate back to settings
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Should default back to Features tab
            await expect(settingsPage.featureToggleTasks).toBeVisible();
        });
    });

    test.describe("Responsive Layout", () => {
        test("should display correctly on mobile", async ({ page }) => {
            await setViewport(page, "mobile");
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Tabs should be visible on mobile
            await expect(settingsPage.featuresTab).toBeVisible();
            await expect(settingsPage.aiSettingsTab).toBeVisible();

            // Feature toggles should be visible
            await expect(settingsPage.featureToggleTasks).toBeVisible();
        });

        test("should display correctly on tablet", async ({ page }) => {
            await setViewport(page, "tablet");
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // Page should render properly
            await expect(settingsPage.featuresTab).toBeVisible();
            await expect(settingsPage.featureToggleTasks).toBeVisible();
        });

        test("should display correctly on desktop", async ({ page }) => {
            await setViewport(page, "desktop");
            await settingsPage.gotoSettings("en-US");
            await waitForPageLoad(page);

            // All elements should be visible
            await expect(settingsPage.pageTitle).toBeVisible();
            await expect(settingsPage.pageDescription).toBeVisible();
            await expect(settingsPage.featuresTab).toBeVisible();
            await expect(settingsPage.featureToggleTasks).toBeVisible();
        });
    });
});
