import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Family Page
 */
export class FamilyPage {
    readonly page: Page;

    // Header elements
    readonly pageTitle: Locator;
    readonly pageDescription: Locator;
    readonly addMemberButton: Locator;
    readonly addMemberButtonMobile: Locator;
    readonly mobilePageTitle: Locator;

    // Empty state
    readonly emptyState: Locator;

    // Members grid
    readonly membersGrid: Locator;
    readonly memberCards: Locator;

    // Member card elements (use .first() or .nth() to access specific cards)
    readonly memberName: Locator;
    readonly memberAge: Locator;
    readonly memberRole: Locator;
    readonly memberKarma: Locator;
    readonly memberViewDetailsLink: Locator;

    // Dialogs
    readonly dialog: Locator;
    readonly alertDialog: Locator;

    // Add Member Dialog elements
    readonly addMemberEmail: Locator;
    readonly addMemberPassword: Locator;
    readonly addMemberName: Locator;
    readonly addMemberBirthdate: Locator;
    readonly addMemberRoleTrigger: Locator;
    readonly addMemberRoleParent: Locator;
    readonly addMemberRoleChild: Locator;
    readonly addMemberSubmit: Locator;
    readonly addMemberCancel: Locator;

    constructor(page: Page) {
        this.page = page;

        // Header
        this.pageTitle = page.getByTestId("family-title");
        this.pageDescription = page.getByTestId("family-description");
        this.addMemberButton = page.getByTestId("add-member-button");
        this.addMemberButtonMobile = page.getByTestId("add-member-button-mobile");
        this.mobilePageTitle = page.getByTestId("mobile-page-title");

        // Empty state
        this.emptyState = page.getByTestId("family-empty-state");

        // Members grid
        this.membersGrid = page.getByTestId("family-members-grid");
        this.memberCards = page.getByTestId("family-member-card");

        // Member card elements
        this.memberName = page.getByTestId("member-name");
        this.memberAge = page.getByTestId("member-age");
        this.memberRole = page.getByTestId("member-role");
        this.memberKarma = page.getByTestId("member-karma");
        this.memberViewDetailsLink = page.getByTestId("member-view-details-link");

        // Dialogs
        this.dialog = page.getByRole("dialog");
        this.alertDialog = page.getByRole("alertdialog");

        // Add Member Dialog elements
        this.addMemberEmail = page.getByTestId("add-member-email");
        this.addMemberPassword = page.getByTestId("add-member-password");
        this.addMemberName = page.getByTestId("add-member-name");
        this.addMemberBirthdate = page.getByTestId("add-member-birthdate");
        this.addMemberRoleTrigger = page.getByTestId("add-member-role-trigger");
        this.addMemberRoleParent = page.getByTestId("add-member-role-parent");
        this.addMemberRoleChild = page.getByTestId("add-member-role-child");
        this.addMemberSubmit = page.getByTestId("add-member-submit");
        this.addMemberCancel = page.getByTestId("add-member-cancel");
    }

    /**
     * Navigate to family page
     */
    async gotoFamily(locale = "en-US") {
        await this.page.goto(`/${locale}/app/family`);
        await this.page.waitForLoadState("networkidle");
    }

    /**
     * Check if page has loaded
     */
    async isPageLoaded(): Promise<boolean> {
        return this.pageTitle.isVisible();
    }

    /**
     * Get member count
     */
    async getMemberCount(): Promise<number> {
        return this.memberCards.count();
    }

    /**
     * Wait for member cards to be visible
     * @param timeout - Maximum time to wait in milliseconds (default: 10000)
     */
    async waitForMemberCards(timeout = 10000): Promise<void> {
        await this.memberCards.first().waitFor({ state: 'visible', timeout });
    }

    /**
     * Wait for a specific member card to be visible by index
     * @param index - Index of the member card (default: 0)
     * @param timeout - Maximum time to wait in milliseconds (default: 10000)
     */
    async waitForMemberCard(index = 0, timeout = 10000): Promise<void> {
        await this.memberCards.nth(index).waitFor({ state: 'visible', timeout });
    }

    /**
     * Check if empty state is visible
     */
    async hasEmptyState(): Promise<boolean> {
        return this.emptyState.isVisible().catch(() => false);
    }

    /**
     * Check if members grid is visible
     */
    async hasMembersGrid(): Promise<boolean> {
        return this.membersGrid.isVisible().catch(() => false);
    }

    /**
     * Open add member dialog
     */
    async openAddMemberDialog() {
        await this.addMemberButton.click();
        await this.dialog.waitFor({ state: "visible", timeout: 5000 });
    }

    /**
     * Click view details link for a member
     */
    async clickViewDetails(memberIndex = 0) {
        await this.memberViewDetailsLink.nth(memberIndex).click();
    }

    /**
     * Get member name by index
     */
    async getMemberName(memberIndex = 0): Promise<string | null> {
        return this.memberName.nth(memberIndex).textContent();
    }

    /**
     * Get member karma by index
     */
    async getMemberKarma(memberIndex = 0): Promise<number> {
        const karmaText = await this.memberKarma.nth(memberIndex).textContent();
        const match = karmaText?.match(/-?\d+/);
        return match ? Number.parseInt(match[0], 10) : 0;
    }

    /**
     * Get member role by index
     */
    async getMemberRole(memberIndex = 0): Promise<string | null> {
        return this.memberRole.nth(memberIndex).textContent();
    }

    /**
     * Fill add member form
     */
    async fillAddMemberForm(data: {
        email: string;
        password: string;
        name: string;
        birthdate: string;
        role?: "Parent" | "Child";
    }) {
        await this.addMemberEmail.fill(data.email);
        await this.addMemberPassword.fill(data.password);
        await this.addMemberName.fill(data.name);
        await this.addMemberBirthdate.fill(data.birthdate);

        if (data.role) {
            // Click the select trigger to open the dropdown
            await this.addMemberRoleTrigger.click();

            // Select the appropriate role option
            if (data.role === "Parent") {
                await this.addMemberRoleParent.click();
            } else {
                await this.addMemberRoleChild.click();
            }
        }
    }

    /**
     * Submit add member form
     */
    async submitAddMember() {
        await this.addMemberSubmit.click();
    }


    /**
     * Wait for dialog to close
     */
    async waitForDialogClose() {
        await this.dialog.waitFor({ state: "hidden", timeout: 5000 });
    }

    /**
     * Wait for alert dialog to close
     */
    async waitForAlertDialogClose() {
        await this.alertDialog.waitFor({ state: "hidden", timeout: 5000 });
    }

    /**
     * Cancel dialog
     */
    async cancelDialog() {
        await this.page.getByRole("button", { name: /cancel/i }).click();
        await this.waitForDialogClose();
    }

    /**
     * Check if validation error is visible
     */
    async hasValidationError(errorText: string): Promise<boolean> {
        return this.page.getByText(new RegExp(errorText, "i")).isVisible({ timeout: 2000 }).catch(() => false);
    }
}
