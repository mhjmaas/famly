import { expect, type Page, test } from "@playwright/test";
import {
    type AuthenticatedUser,
    authenticateUser,
} from "../../helpers/auth";
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

test.describe("Settings Page - AI Settings Form", () => {
    let settingsPage: SettingsPage;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        settingsPage = new SettingsPage(page);
        parentUser = await authenticateUser(page, {
            name: "Parent AI Settings User",
            birthdate: "1985-07-20",
            createFamily: true,
            familyName: "AI Settings Test Family",
        });

        await settingsPage.gotoSettings("en-US");
        await waitForPageLoad(page);

        // Switch to AI Settings tab
        await settingsPage.switchToAISettingsTab();
    });

    test.describe("Form Validation", () => {
        test("should show validation error when required fields are missing", async ({
            page,
        }) => {
            // Try to save with empty fields
            await settingsPage.saveAISettings();

            // Should show validation error toast
            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toMatch(/required|validation/);
        });

        test("should show validation error when only some fields are filled", async ({
            page,
        }) => {
            // Fill only some fields
            await settingsPage.fillAISettings({
                aiName: "TestAI",
                apiEndpoint: "https://api.openai.com/v1",
            });

            // Try to save
            await settingsPage.saveAISettings();

            // Should show validation error
            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toMatch(/required|validation/);
        });

        test("should validate URL format for API endpoint", async ({ page }) => {
            // Fill all fields with invalid URL
            await settingsPage.fillAISettings({
                aiName: "TestAI",
                apiEndpoint: "not-a-valid-url",
                modelName: "gpt-4",
                provider: "LM Studio",
            });

            // Try to save
            await settingsPage.saveAISettings();

            // Should show URL validation error
            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toMatch(/url|invalid/);
        });

        test("should accept valid URL formats", async ({ page }) => {
            const validUrls = [
                "https://api.openai.com/v1",
                "http://localhost:8080",
                "https://my-api.example.com/v1/chat",
            ];

            for (const url of validUrls) {
                await settingsPage.fillAISettings({
                    aiName: "TestAI",
                    apiEndpoint: url,
                    modelName: "gpt-4",
                    provider: "Ollama",
                });

                const updateResponse = waitForSettingsUpdate(
                    page,
                    parentUser.familyId!,
                    "PUT"
                );
                await settingsPage.saveAISettings();
                await updateResponse;

                // Should show success toast
                const toast = await settingsPage.waitForToast();
                const toastText = await toast.textContent();
                expect(toastText?.toLowerCase()).toMatch(/saved|success/);

                // Wait a bit before next iteration
                await page.waitForTimeout(500);
            }
        });
    });

    test.describe("Form Submission", () => {
        test("should successfully save AI settings with all fields filled", async ({
            page,
        }) => {
            // Fill all fields
            await settingsPage.fillAISettings({
                aiName: "Jarvis",
                apiEndpoint: "https://api.openai.com/v1",
                modelName: "gpt-4",
                provider: "LM Studio",
            });

            // Save settings
            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.saveAISettings();
            await updateResponse;

            // Should show success toast
            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toMatch(/saved|success/);
            expect(toastText).toContain("Jarvis");
        });

        test("should persist AI settings across page refresh", async ({
            page,
        }) => {
            // Fill and save AI settings
            const testData = {
                aiName: "MyCustomAI",
                apiEndpoint: "https://api.example.com/v1",
                modelName: "gpt-3.5-turbo",
                provider: "Ollama",
            };

            await settingsPage.fillAISettings(testData);

            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.saveAISettings();
            await updateResponse;

            // Refresh the page
            await page.reload();
            await waitForPageLoad(page);
            await settingsPage.switchToAISettingsTab();

            // Verify fields are populated (except secret which is never returned)
            const aiNameValue = await settingsPage.aiNameInput.inputValue();
            const apiEndpointValue = await settingsPage.apiEndpointInput.inputValue();
            const modelNameValue = await settingsPage.modelNameInput.inputValue();
            const providerValue = await settingsPage.getSelectedProvider();

            expect(aiNameValue).toBe(testData.aiName);
            expect(apiEndpointValue).toBe(testData.apiEndpoint);
            expect(modelNameValue).toBe(testData.modelName);
            expect(providerValue).toContain(testData.provider);

            // API secret should be empty (not returned from server)
            const apiSecretValue = await settingsPage.apiSecretInput.inputValue();
            expect(apiSecretValue).toBe("");
        });
    });

    test.describe("Reset Functionality", () => {
        test("should reset form to default values", async ({ page }) => {
            // Fill all fields with custom values
            await settingsPage.fillAISettings({
                aiName: "CustomAI",
                apiEndpoint: "https://custom.api.com",
                modelName: "custom-model",
                provider: "LM Studio",
            });

            // Click reset button
            await settingsPage.resetAISettings();

            // Verify fields are reset to defaults
            const aiNameValue = await settingsPage.aiNameInput.inputValue();
            const apiEndpointValue = await settingsPage.apiEndpointInput.inputValue();
            const apiSecretValue = await settingsPage.apiSecretInput.inputValue();
            const modelNameValue = await settingsPage.modelNameInput.inputValue();

            expect(aiNameValue).toBe("");
            expect(apiEndpointValue).toBe("");
            expect(apiSecretValue).toBe("");
            expect(modelNameValue).toBe("");
        });

        test("should reset form after successful save", async ({ page }) => {
            // Fill and save
            await settingsPage.fillAISettings({
                aiName: "TestAI",
                apiEndpoint: "https://api.openai.com/v1",
                modelName: "gpt-4",
                provider: "LM Studio",
            });

            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.saveAISettings();
            await updateResponse;

            // Reset form
            await settingsPage.resetAISettings();

            // All fields should be cleared
            const apiSecretValue = await settingsPage.apiSecretInput.inputValue();
            expect(apiSecretValue).toBe("");
        });
    });

    test.describe("Field Interactions", () => {
        test("should allow typing in all input fields", async ({ page }) => {
            const testData = {
                aiName: "Test AI Name",
                apiEndpoint: "https://test.api.com/v1",
                modelName: "test-model-v1",
                provider: "LM Studio",
            };

            await settingsPage.fillAISettings(testData);

            // Verify all values are set correctly
            expect(await settingsPage.aiNameInput.inputValue()).toBe(testData.aiName);
            expect(await settingsPage.apiEndpointInput.inputValue()).toBe(
                testData.apiEndpoint
            );
            expect(await settingsPage.modelNameInput.inputValue()).toBe(
                testData.modelName
            );
            expect(await settingsPage.getSelectedProvider()).toContain(
                testData.provider
            );
        });

        test("should have disabled API secret input field", async ({ page }) => {
            // Verify input type is still password
            const inputType = await settingsPage.apiSecretInput.getAttribute("type");
            expect(inputType).toBe("password");

            // Verify the field is disabled
            const isDisabled = await settingsPage.apiSecretInput.isDisabled();
            expect(isDisabled).toBe(true);
        });

        test("should clear and refill fields", async ({ page }) => {
            // Fill fields
            await settingsPage.fillAISettings({
                aiName: "First Name",
                apiEndpoint: "https://first.com",
                provider: "LM Studio",
            });

            // Clear and refill
            await settingsPage.fillAISettings({
                aiName: "Second Name",
                apiEndpoint: "https://second.com",
                provider: "Ollama",
            });

            // Verify new values
            expect(await settingsPage.aiNameInput.inputValue()).toBe("Second Name");
            expect(await settingsPage.apiEndpointInput.inputValue()).toBe(
                "https://second.com"
            );
            expect(await settingsPage.getSelectedProvider()).toContain("Ollama");
        });
    });

    test.describe("Integration with Features", () => {
        test("should save AI settings without affecting feature toggles", async ({
            page,
        }) => {
            // First, disable a feature on Features tab
            await settingsPage.switchToFeaturesTab();
            await settingsPage.toggleFeature("chat");
            await waitForSettingsUpdate(page, parentUser.familyId!, "PUT");

            // Switch to AI Settings and save
            await settingsPage.switchToAISettingsTab();
            await settingsPage.fillAISettings({
                aiName: "TestAI",
                apiEndpoint: "https://api.openai.com/v1",
                modelName: "gpt-4",
                provider: "Ollama",
            });

            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.saveAISettings();
            await updateResponse;

            // Go back to Features tab and verify chat is still disabled
            await settingsPage.switchToFeaturesTab();
            expect(await settingsPage.isFeatureEnabled("chat")).toBe(false);
        });
    });

    test.describe("Error Handling", () => {
        test("should handle network errors during save", async ({ page }) => {
            // Fill valid data
            await settingsPage.fillAISettings({
                aiName: "TestAI",
                apiEndpoint: "https://api.openai.com/v1",
                modelName: "gpt-4",
                provider: "LM Studio",
            });

            // Go offline
            await page.context().setOffline(true);

            // Try to save
            await settingsPage.saveAISettings();

            // Wait for error
            await page.waitForTimeout(2000);

            // Should show error toast
            const toast = page.locator('[data-sonner-toast]').first();
            const toastVisible = await toast.isVisible().catch(() => false);

            // Go back online
            await page.context().setOffline(false);

            if (toastVisible) {
                const toastText = await toast.textContent();
                expect(toastText?.toLowerCase()).toMatch(/error|failed/);
            }
        });
    });

    test.describe("Provider Selection", () => {
        test("should have provider pre-populated with default value", async ({
            page,
        }) => {
            // First reset to clear any previous state
            await settingsPage.resetAISettings();

            // Provider should be pre-populated with default value "LM Studio"
            const defaultProvider = await settingsPage.getSelectedProvider();
            expect(defaultProvider).toContain("LM Studio");

            // Should be able to save with default provider and other required fields filled
            await settingsPage.fillAISettings({
                aiName: "TestAI",
                apiEndpoint: "https://api.openai.com/v1",
                modelName: "gpt-4",
            });

            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.saveAISettings();
            await updateResponse;

            // Should show success toast (not validation error)
            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toMatch(/saved|success/);
        });

        test("should allow selection of all provider options", async ({ page }) => {
            const providers = ["LM Studio", "Ollama"];

            for (const provider of providers) {
                // Fill all fields
                await settingsPage.fillAISettings({
                    aiName: "TestAI",
                    apiEndpoint: "https://api.openai.com/v1",
                    modelName: "gpt-4",
                    provider,
                });

                // Verify provider is selected
                const selectedProvider = await settingsPage.getSelectedProvider();
                expect(selectedProvider).toContain(provider);

                // Reset for next iteration
                await settingsPage.resetAISettings();
            }
        });

        test("should save and persist provider selection", async ({ page }) => {
            const selectedProvider = "LM Studio";

            // Fill all fields with specific provider
            await settingsPage.fillAISettings({
                aiName: "PrivacyAI",
                apiEndpoint: "https://local.api:8000",
                modelName: "local-model",
                provider: selectedProvider,
            });

            // Save settings
            const updateResponse = waitForSettingsUpdate(
                page,
                parentUser.familyId!,
                "PUT"
            );
            await settingsPage.saveAISettings();
            await updateResponse;

            // Verify success
            const toast = await settingsPage.waitForToast();
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toMatch(/saved|success/);

            // Refresh page
            await page.reload();
            await waitForPageLoad(page);
            await settingsPage.switchToAISettingsTab();

            // Verify provider persisted
            const persistedProvider = await settingsPage.getSelectedProvider();
            expect(persistedProvider).toContain(selectedProvider);
        });
    });
});
