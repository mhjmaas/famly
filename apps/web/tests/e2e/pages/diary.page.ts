import type { Locator, Page } from "@playwright/test";

export class DiaryPage {
    readonly page: Page;

    // Header elements
    readonly pageTitle: Locator;
    readonly pageDescription: Locator;

    // Search and filter elements
    readonly searchInput: Locator;
    readonly searchInputMobile: Locator;
    readonly datePicker: Locator;
    readonly datePickerMobile: Locator;
    readonly clearFiltersButton: Locator;
    readonly activeFilters: Locator;

    // Entry form elements
    readonly entryForm: Locator;
    readonly entryInput: Locator;
    readonly submitButton: Locator;

    // Entry list elements
    readonly entriesList: Locator;
    readonly entryCards: Locator;
    readonly entryGroups: Locator;
    readonly emptyState: Locator;

    // Scroll button
    readonly scrollTopButton: Locator;

    // Mobile add button
    readonly mobileAddButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Header
        this.pageTitle = page.getByTestId("diary-title");
        this.pageDescription = page.getByTestId("diary-description");

        // Search and filters
        this.searchInput = page.getByTestId("diary-search-input");
        this.searchInputMobile = page.getByTestId("diary-search-input-mobile");
        this.datePicker = page.getByTestId("diary-date-picker");
        this.datePickerMobile = page.getByTestId("diary-date-picker-mobile");
        this.clearFiltersButton = page.getByTestId("diary-clear-filters");
        this.activeFilters = page.getByTestId("diary-active-filters");

        // Entry form
        this.entryForm = page.getByTestId("diary-entry-form");
        this.entryInput = page.getByTestId("diary-entry-input");
        this.submitButton = page.getByTestId("diary-submit-button");

        // Entry list
        this.entriesList = page.getByTestId("diary-entries-list");
        this.entryCards = page.getByTestId("diary-entry-card");
        this.entryGroups = page.getByTestId("diary-entry-group");
        this.emptyState = page.getByTestId("diary-empty-state");

        // Scroll button
        this.scrollTopButton = page.getByTestId("diary-scroll-top-button");

        // Mobile
        this.mobileAddButton = page.getByTestId("diary-mobile-add-button");
    }

    /**
     * Navigate to the diary page
     */
    async goto(locale = "en-US") {
        await this.page.goto(`/${locale}/app/diary`);
        await this.page.waitForLoadState("networkidle");
    }

    /**
     * Create a new diary entry
     */
    async createEntry(content: string) {
        await this.entryInput.fill(content);
        await this.submitButton.click();
        // Wait for the entry to be created
        await this.page.waitForResponse(
            (response) =>
                response.url().includes("/v1/diary") && response.request().method() === "POST"
        );
    }

    /**
     * Search for entries
     */
    async search(query: string) {
        // Use desktop search input if visible, otherwise mobile
        const searchInput = await this.searchInput.isVisible()
            ? this.searchInput
            : this.searchInputMobile;
        await searchInput.fill(query);
    }

    /**
     * Clear search input
     */
    async clearSearch() {
        const searchInput = await this.searchInput.isVisible()
            ? this.searchInput
            : this.searchInputMobile;
        await searchInput.clear();
    }

    /**
     * Open date picker
     */
    async openDatePicker() {
        const picker = await this.datePicker.isVisible()
            ? this.datePicker
            : this.datePickerMobile;
        await picker.click();
    }

    /**
     * Clear all filters
     */
    async clearFilters() {
        await this.clearFiltersButton.click();
    }

    /**
     * Get the number of entry cards displayed
     */
    async getEntryCount(): Promise<number> {
        return await this.entryCards.count();
    }

    /**
     * Get the number of entry groups displayed
     */
    async getGroupCount(): Promise<number> {
        return await this.entryGroups.count();
    }

    /**
     * Check if empty state is visible
     */
    async isEmptyStateVisible(): Promise<boolean> {
        return await this.emptyState.isVisible();
    }

    /**
     * Get entry content by index
     */
    async getEntryContent(index: number): Promise<string> {
        const entry = this.entryCards.nth(index);
        const content = entry.getByTestId("diary-entry-content");
        return await content.textContent() || "";
    }

    /**
     * Scroll to top using the FAB button
     */
    async scrollToTop() {
        await this.scrollTopButton.click();
    }

    /**
     * Wait for entries to load
     */
    async waitForEntries() {
        await this.page.waitForResponse(
            (response) =>
                response.url().includes("/v1/diary") && response.request().method() === "GET"
        );
    }

    /**
     * Check if submit button is disabled
     */
    async isSubmitDisabled(): Promise<boolean> {
        return await this.submitButton.isDisabled();
    }

    /**
     * Click mobile add button (triggers scroll to form)
     */
    async clickMobileAddButton() {
        await this.mobileAddButton.click();
    }
}
