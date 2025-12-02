import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Settings Page
 */
export class SettingsPage {
    readonly page: Page;

    // Header elements
    readonly pageTitle: Locator;
    readonly pageDescription: Locator;

    // Tab controls
    readonly featuresTab: Locator;
    readonly aiSettingsTab: Locator;

    // Features Tab - Feature toggles
    readonly featureToggleTasks: Locator;
    readonly featureToggleRewards: Locator;
    readonly featureToggleShoppingLists: Locator;
    readonly featureToggleRecipes: Locator;
    readonly featureToggleLocations: Locator;
    readonly featureToggleMemories: Locator;
    readonly featureToggleDiary: Locator;
    readonly featureToggleChat: Locator;
    readonly featureToggleAiIntegration: Locator;

    // Feature switches
    readonly featureSwitchTasks: Locator;
    readonly featureSwitchRewards: Locator;
    readonly featureSwitchShoppingLists: Locator;
    readonly featureSwitchRecipes: Locator;
    readonly featureSwitchLocations: Locator;
    readonly featureSwitchMemories: Locator;
    readonly featureSwitchDiary: Locator;
    readonly featureSwitchChat: Locator;
    readonly featureSwitchAiIntegration: Locator;

    // AI Settings Tab - Form inputs
    readonly aiNameInput: Locator;
    readonly apiEndpointInput: Locator;
    readonly apiSecretInput: Locator;
    readonly modelNameInput: Locator;
    readonly providerSelect: Locator;
    readonly saveAiSettingsButton: Locator;
    readonly resetAiSettingsButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Header
        this.pageTitle = page.locator("h1").filter({ hasText: "Settings" });
        this.pageDescription = page.locator("p.text-muted-foreground").first();

        // Tabs
        this.featuresTab = page.getByTestId("features-tab");
        this.aiSettingsTab = page.getByTestId("ai-settings-tab");

        // Feature toggles (container divs)
        this.featureToggleTasks = page.getByTestId("feature-toggle-tasks");
        this.featureToggleRewards = page.getByTestId("feature-toggle-rewards");
        this.featureToggleShoppingLists = page.getByTestId("feature-toggle-shoppingLists");
        this.featureToggleRecipes = page.getByTestId("feature-toggle-recipes");
        this.featureToggleLocations = page.getByTestId("feature-toggle-locations");
        this.featureToggleMemories = page.getByTestId("feature-toggle-memories");
        this.featureToggleDiary = page.getByTestId("feature-toggle-diary");
        this.featureToggleChat = page.getByTestId("feature-toggle-chat");
        this.featureToggleAiIntegration = page.getByTestId("feature-toggle-aiIntegration");

        // Feature switches (actual switch elements)
        this.featureSwitchTasks = page.getByTestId("feature-switch-tasks");
        this.featureSwitchRewards = page.getByTestId("feature-switch-rewards");
        this.featureSwitchShoppingLists = page.getByTestId("feature-switch-shoppingLists");
        this.featureSwitchRecipes = page.getByTestId("feature-switch-recipes");
        this.featureSwitchLocations = page.getByTestId("feature-switch-locations");
        this.featureSwitchMemories = page.getByTestId("feature-switch-memories");
        this.featureSwitchDiary = page.getByTestId("feature-switch-diary");
        this.featureSwitchChat = page.getByTestId("feature-switch-chat");
        this.featureSwitchAiIntegration = page.getByTestId("feature-switch-aiIntegration");

        // AI Settings inputs
        this.aiNameInput = page.getByTestId("ai-name-input");
        this.apiEndpointInput = page.getByTestId("api-endpoint-input");
        this.apiSecretInput = page.getByTestId("api-secret-input");
        this.modelNameInput = page.getByTestId("model-name-input");
        this.providerSelect = page.getByTestId("provider-select");
        this.saveAiSettingsButton = page.getByTestId("save-ai-settings-button");
        this.resetAiSettingsButton = page.getByTestId("reset-ai-settings-button");
    }

    /**
     * Navigate to settings page
     */
    async gotoSettings(locale = "en-US") {
        await this.page.goto(`/${locale}/app/settings`);
        await this.page.waitForLoadState("networkidle");
    }

    /**
     * Switch to Features tab
     */
    async switchToFeaturesTab() {
        await this.featuresTab.click();
        await this.featureToggleTasks.waitFor({ state: "visible" });
    }

    /**
     * Switch to AI Settings tab
     */
    async switchToAISettingsTab() {
        await this.aiSettingsTab.click();
        await this.aiNameInput.waitFor({ state: "visible" });
    }

    /**
     * Toggle a feature by name
     */
    async toggleFeature(featureName: string) {
        const switchLocator = this.page.getByTestId(`feature-switch-${featureName}`);
        await switchLocator.click();
    }

    /**
     * Check if a feature is enabled
     */
    async isFeatureEnabled(featureName: string): Promise<boolean> {
        const switchLocator = this.page.getByTestId(`feature-switch-${featureName}`);
        const dataState = await switchLocator.getAttribute("data-state");
        return dataState === "checked";
    }

    /**
     * Fill AI settings form
     * Note: apiSecret field is disabled and cannot be filled
     */
    async fillAISettings(data: {
        aiName?: string;
        apiEndpoint?: string;
        apiSecret?: string;
        modelName?: string;
        provider?: string;
    }) {
        if (data.aiName !== undefined) {
            await this.aiNameInput.clear();
            await this.aiNameInput.fill(data.aiName);
        }
        if (data.apiEndpoint !== undefined) {
            await this.apiEndpointInput.clear();
            await this.apiEndpointInput.fill(data.apiEndpoint);
        }
        // apiSecret field is disabled and read-only, skip filling it
        if (data.modelName !== undefined) {
            await this.modelNameInput.clear();
            await this.modelNameInput.fill(data.modelName);
        }
        if (data.provider !== undefined) {
            await this.selectProvider(data.provider);
        }
    }

    /**
     * Select AI provider from dropdown
     */
    async selectProvider(provider: string) {
        await this.providerSelect.click();
        // Wait for dropdown menu to appear
        const option = this.page.getByRole("option", { name: provider });
        await option.click();
    }

    /**
     * Save AI settings
     */
    async saveAISettings() {
        await this.saveAiSettingsButton.click();
    }

    /**
     * Reset AI settings to default
     */
    async resetAISettings() {
        await this.resetAiSettingsButton.click();
    }

    /**
     * Wait for toast message
     */
    async waitForToast(timeout = 5000) {
        const toast = this.page.locator('[data-sonner-toast]').first();
        await toast.waitFor({ state: "visible", timeout });
        return toast;
    }

    /**
     * Get toast text content
     */
    async getToastText(): Promise<string | null> {
        const toast = await this.waitForToast();
        return await toast.textContent();
    }

    /**
     * Get selected provider value
     */
    async getSelectedProvider(): Promise<string | null> {
        // Get the text content directly from the SelectTrigger
        const text = await this.providerSelect.textContent();
        // Return the trimmed text, or null if empty/placeholder
        return text?.trim() || null;
    }
}
