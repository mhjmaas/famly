import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Family Member Detail Page
 */
export class FamilyMemberDetailPage {
    readonly page: Page;

    // Header elements
    readonly memberName: Locator;
    readonly memberAge: Locator;
    readonly memberAvatar: Locator;
    readonly memberKarma: Locator;

    // Navigation
    readonly breadcrumbFamilyMembers: Locator;
    readonly breadcrumbCurrentMember: Locator;
    readonly backToFamilyButton: Locator;

    // Tabs
    readonly giveKarmaTab: Locator;

    // Actions dropdown
    readonly actionsButton: Locator;
    readonly actionEditMember: Locator;
    readonly actionRemoveMember: Locator;

    // Karma Card
    readonly karmaCard: Locator;
    readonly karmaAmountInput: Locator;
    readonly karmaAmountLabel: Locator;
    readonly karmaDescriptionInput: Locator;
    readonly karmaDescriptionLabel: Locator;
    readonly giveKarmaButton: Locator;

    // Activity Timeline
    readonly activityTimeline: Locator;
    readonly activityEvents: Locator;

    // Dialogs
    readonly editRoleDialog: Locator;
    readonly removeMemberDialog: Locator;

    constructor(page: Page) {
        this.page = page;

        // Header elements
        this.memberName = page.getByTestId("member-detail-name");
        this.memberAge = page.getByTestId("member-detail-age");
        this.memberAvatar = page.getByTestId("member-detail-avatar");
        this.memberKarma = page.getByTestId("member-detail-karma");

        // Navigation
        this.breadcrumbFamilyMembers = page.getByTestId("breadcrumb-family-members");
        this.breadcrumbCurrentMember = page.getByTestId("breadcrumb-current-member");
        this.backToFamilyButton = page.getByTestId("back-to-family-button");

        // Tabs
        this.giveKarmaTab = page.getByTestId("give-karma-tab");

        // Actions dropdown
        this.actionsButton = page.getByTestId("member-actions-button");
        this.actionEditMember = page.getByTestId("action-edit-member");
        this.actionRemoveMember = page.getByTestId("action-remove-member");

        // Karma Card
        this.karmaCard = page.getByTestId("member-karma-card");
        this.karmaAmountInput = page.getByTestId("karma-amount-input");
        this.karmaAmountLabel = page.getByTestId("karma-amount-label");
        this.karmaDescriptionInput = page.getByTestId("karma-description-input");
        this.karmaDescriptionLabel = page.getByTestId("karma-description-label");
        this.giveKarmaButton = page.getByTestId("give-karma-button");

        // Activity Timeline
        this.activityTimeline = page.getByTestId("activity-timeline");
        this.activityEvents = page.locator("[data-testid='activity-event']");

        // Dialogs
        this.editRoleDialog = page.getByRole("dialog", { name: /edit.*role/i });
        this.removeMemberDialog = page.getByRole("alertdialog", {
            name: /remove.*member/i,
        });
    }

    /**
     * Navigate to member detail page
     */
    async goto(memberId: string, lang = "en-US") {
        await this.page.goto(`/${lang}/app/family/${memberId}`);
    }

    /**
     * Grant karma to member
     */
    async grantKarma(amount: number, description: string) {
        await this.karmaAmountInput.fill(amount.toString());
        await this.karmaDescriptionInput.fill(description);
        await this.giveKarmaButton.click();
    }

    /**
     * Open actions dropdown
     */
    async openActionsMenu() {
        await this.actionsButton.click();
    }

    /**
     * Click edit member action
     */
    async clickEditMember() {
        await this.openActionsMenu();
        await this.actionEditMember.click();
    }

    /**
     * Click remove member action
     */
    async clickRemoveMember() {
        await this.openActionsMenu();
        await this.actionRemoveMember.click();
    }

    /**
     * Navigate back to family page using breadcrumb
     */
    async navigateToFamilyViaBreadcrumb() {
        await this.breadcrumbFamilyMembers.click();
    }

    /**
     * Navigate back to family page using back button (mobile)
     */
    async navigateToFamilyViaBackButton() {
        await this.backToFamilyButton.click();
    }

    /**
     * Get displayed karma amount
     */
    async getKarmaAmount(): Promise<string> {
        const text = await this.memberKarma.textContent();
        const match = text?.match(/[-]?\d+/); // Match optional minus sign followed by digits
        return match?.[0] || "0";
    }

    /**
     * Wait for activity timeline to load
     */
    async waitForActivityTimeline() {
        await this.activityTimeline.waitFor({ state: "visible" });
    }

    /**
     * Wait for at least one activity event to be visible
     */
    async waitForActivityEvent() {
        await this.activityEvents.first().waitFor({ state: "visible" });
    }

    /**
     * Get number of activity events displayed
     */
    async getActivityEventCount(): Promise<number> {
        return await this.activityEvents.count();
    }
}
