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
    readonly memberActionsButton: Locator;

    // Member actions dropdown
    readonly actionGiveKarma: Locator;
    readonly actionEditRole: Locator;
    readonly actionRemoveMember: Locator;

    // Dialogs
    readonly dialog: Locator;
    readonly alertDialog: Locator;

    // Give Karma Dialog elements
    readonly karmaTypePositive: Locator;
    readonly karmaTypeNegative: Locator;
    readonly karmaAmountInput: Locator;
    readonly karmaMessageInput: Locator;
    readonly karmaSubmitButton: Locator;
    readonly karmaCancelButton: Locator;

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
        this.memberActionsButton = page.getByTestId("member-actions-button");

        // Member actions
        this.actionGiveKarma = page.getByTestId("action-give-karma");
        this.actionEditRole = page.getByTestId("action-edit-role");
        this.actionRemoveMember = page.getByTestId("action-remove-member");

        // Dialogs
        this.dialog = page.getByRole("dialog");
        this.alertDialog = page.getByRole("alertdialog");

        // Give Karma Dialog elements
        this.karmaTypePositive = page.getByTestId("karma-type-positive");
        this.karmaTypeNegative = page.getByTestId("karma-type-negative");
        this.karmaAmountInput = page.getByTestId("karma-amount-input");
        this.karmaMessageInput = page.getByTestId("karma-message-input");
        this.karmaSubmitButton = page.getByTestId("karma-submit-button");
        this.karmaCancelButton = page.getByTestId("karma-cancel-button");

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
     * Open actions menu for a specific member (by index)
     */
    async openMemberActions(memberIndex = 0) {
        await this.memberActionsButton.nth(memberIndex).click();
        // Wait for dropdown menu to appear after opening actions
        await this.page.locator('[role="menu"]').first().waitFor({ state: "visible", timeout: 2000 });
    }

    /**
     * Click give karma action
     */
    async clickGiveKarma() {
        await this.actionGiveKarma.click();
        await this.dialog.waitFor({ state: "visible", timeout: 5000 });
    }

    /**
     * Click edit role action
     */
    async clickEditRole() {
        await this.actionEditRole.click();
        await this.dialog.waitFor({ state: "visible", timeout: 5000 });
    }

    /**
     * Click remove member action
     */
    async clickRemoveMember() {
        await this.actionRemoveMember.click();
        await this.alertDialog.waitFor({ state: "visible", timeout: 5000 });
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
     * Fill give karma form
     */
    async fillGiveKarmaForm(data: {
        type: "positive" | "negative";
        amount: number;
        message: string;
    }) {
        // Select karma type
        const radioButton = data.type === "positive" ? this.karmaTypePositive : this.karmaTypeNegative;
        await radioButton.click();

        // Wait a bit for the state to update
        await this.page.waitForTimeout(100);

        // Fill amount
        await this.karmaAmountInput.fill(data.amount.toString());

        // Fill message
        await this.karmaMessageInput.fill(data.message);
    }

    /**
     * Submit give karma form
     */
    async submitGiveKarma() {
        await this.karmaSubmitButton.click();
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
