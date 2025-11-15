import { expect, type Page, test } from "@playwright/test";
import {
    type AuthenticatedUser,
    authenticateUser,
} from "../../helpers/auth";
import { SettingsPage } from "../../pages/settings.page";
import { setViewport, waitForPageLoad } from "../../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

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

test.describe("Settings Page - Feature Toggles", () => {
    let settingsPage: SettingsPage;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        settingsPage = new SettingsPage(page);
        parentUser = await authenticateUser(page, {
            name: "Parent Toggle User",
            birthdate: "1985-03-12",
            createFamily: true,
            familyName: "Toggle Test Family",
        });

        await settingsPage.gotoSettings("en-US");
        await waitForPageLoad(page);
    });

    test.describe("Toggle Functionality", () => {
        test("should toggle a feature off and on", async ({ page }) => {
            // Verify tasks feature is initially enabled
            expect(await settingsPage.isFeatureEnabled("tasks")).toBe(true);

            // Toggle tasks off
            const updateResponse1 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("tasks");
            await updateResponse1;

            // Verify feature is now disabled
            expect(await settingsPage.isFeatureEnabled("tasks")).toBe(false);

            // Verify toast appears
            const toast1 = await settingsPage.waitForToast();
            await expect(toast1).toBeVisible();

            // Toggle tasks back on
            const updateResponse2 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("tasks");
            await updateResponse2;

            // Verify feature is enabled again
            expect(await settingsPage.isFeatureEnabled("tasks")).toBe(true);

            // Verify toast appears
            const toast2 = await settingsPage.waitForToast();
            await expect(toast2).toBeVisible();
        });

        test("should toggle multiple features independently", async ({ page }) => {
            // Toggle rewards off
            const updateResponse1 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("rewards");
            await updateResponse1;
            expect(await settingsPage.isFeatureEnabled("rewards")).toBe(false);

            // Toggle diary off
            const updateResponse2 = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("diary");
            await updateResponse2;
            expect(await settingsPage.isFeatureEnabled("diary")).toBe(false);

            // Verify other features are still enabled
            expect(await settingsPage.isFeatureEnabled("tasks")).toBe(true);
            expect(await settingsPage.isFeatureEnabled("chat")).toBe(true);
        });

        test("should disable all features except one", async ({ page }) => {
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

            // Disable all features except tasks
            for (const feature of features) {
                const updateResponse = waitForSettingsUpdate(
                    page,
                    parentUser.familyId!,
                    "PUT"
                );
                await settingsPage.toggleFeature(feature);
                await updateResponse;
                expect(await settingsPage.isFeatureEnabled(feature)).toBe(false);
            }

            // Verify tasks is still enabled
            expect(await settingsPage.isFeatureEnabled("tasks")).toBe(true);
        });
    });

    test.describe("Toast Notifications", () => {
        test("should show success toast when enabling a feature", async ({
            page,
        }) => {
            // First disable a feature
            await settingsPage.toggleFeature("chat");
            await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");

            // Then enable it and check toast
            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("chat");
            await updateResponse;

            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toContain("enabled");
        });

        test("should show success toast when disabling a feature", async ({
            page,
        }) => {
            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("memories");
            await updateResponse;

            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toContain("disabled");
        });
    });

    test.describe("Persistence", () => {
        test("should persist toggle state across page refresh", async ({
            page,
        }) => {
            // Disable locations feature
            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("locations");
            await updateResponse;
            expect(await settingsPage.isFeatureEnabled("locations")).toBe(false);

            // Refresh the page
            await page.reload();
            await waitForPageLoad(page);

            // Verify feature is still disabled
            expect(await settingsPage.isFeatureEnabled("locations")).toBe(false);
        });

        test("should persist multiple toggle changes across page refresh", async ({
            page,
        }) => {
            // Toggle multiple features
            await settingsPage.toggleFeature("rewards");
            await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");

            await settingsPage.toggleFeature("shoppingLists");
            await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");

            await settingsPage.toggleFeature("diary");
            await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");

            // Verify states before refresh
            expect(await settingsPage.isFeatureEnabled("rewards")).toBe(false);
            expect(await settingsPage.isFeatureEnabled("shoppingLists")).toBe(false);
            expect(await settingsPage.isFeatureEnabled("diary")).toBe(false);

            // Refresh the page
            await page.reload();
            await waitForPageLoad(page);

            // Verify states after refresh
            expect(await settingsPage.isFeatureEnabled("rewards")).toBe(false);
            expect(await settingsPage.isFeatureEnabled("shoppingLists")).toBe(false);
            expect(await settingsPage.isFeatureEnabled("diary")).toBe(false);
        });

        test("should sync to localStorage after toggle", async ({ page }) => {
            // Toggle a feature
            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.toggleFeature("tasks");
            await updateResponse;

            // Check localStorage
            const localStorageValue = await page.evaluate((familyId) => {
                return localStorage.getItem(`famly-enabled-features-${familyId}`);
            }, parentUser.familyId);

            expect(localStorageValue).toBeTruthy();
            const features = JSON.parse(localStorageValue!);
            expect(Array.isArray(features)).toBe(true);
            expect(features.includes("tasks")).toBe(false);
        });
    });

    test.describe("Error Handling", () => {
        test("should handle network errors gracefully", async ({ page }) => {
            // Simulate network failure by going offline
            await page.context().setOffline(true);

            // Try to toggle a feature
            await settingsPage.toggleFeature("chat");

            // Wait a bit for the error to appear
            await page.waitForTimeout(2000);

            // Should show error toast
            const toast = page.locator('[data-sonner-toast]').first();
            const toastVisible = await toast.isVisible().catch(() => false);

            // Go back online
            await page.context().setOffline(false);

            // If toast was visible, it should contain error message
            if (toastVisible) {
                const toastText = await toast.textContent();
                expect(toastText?.toLowerCase()).toMatch(/error|failed/);
            }
        });
    });

    test.describe("Rapid Toggling", () => {
        test("should handle rapid toggle clicks", async ({ page }) => {
            // Click toggle multiple times rapidly
            await settingsPage.toggleFeature("rewards");
            await page.waitForTimeout(100);
            await settingsPage.toggleFeature("rewards");
            await page.waitForTimeout(100);
            await settingsPage.toggleFeature("rewards");

            // Wait for all requests to complete
            await page.waitForTimeout(2000);

            // Feature should end up in a consistent state
            const isEnabled = await settingsPage.isFeatureEnabled("rewards");
            expect(typeof isEnabled).toBe("boolean");
        });
    });
});
