import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Contribution Goal functionality
 * Can be used on both Dashboard and Member Detail pages
 */
export class ContributionGoalPage {
    readonly page: Page;

    // Contribution Goal Card
    readonly contributionGoalCard: Locator;
    readonly emptyGoalState: Locator;
    readonly setGoalButton: Locator;
    readonly editGoalButton: Locator;
    readonly deleteGoalButton: Locator;
    readonly goalCardActionsButton: Locator;

    // Goal Progress
    readonly goalTitle: Locator;
    readonly currentKarma: Locator;
    readonly goalProgress: Locator;
    readonly progressPercentage: Locator;
    readonly deductionsSummary: Locator;

    // Deductions List
    readonly deductionsList: Locator;
    readonly deductionItems: Locator;

    // Quick Deduction Form
    readonly quickDeductionForm: Locator;
    readonly deductionReasonInput: Locator;
    readonly deductionAmountSelect: Locator;
    readonly deductButton: Locator;

    // Edit/Create Dialog
    readonly editGoalDialog: Locator;
    readonly goalTitleInput: Locator;
    readonly goalDescriptionInput: Locator;
    readonly goalMaxKarmaInput: Locator;
    readonly goalRecurringToggle: Locator;
    readonly saveGoalButton: Locator;
    readonly cancelButton: Locator;

    // Delete Dialog
    readonly deleteGoalDialog: Locator;
    readonly confirmDeleteButton: Locator;

    // Dashboard Section
    readonly dashboardContributionGoalSection: Locator;

    // Member Detail View
    readonly memberContributionGoalView: Locator;

    constructor(page: Page) {
        this.page = page;

        // Contribution Goal Card
        this.contributionGoalCard = page.getByTestId("contribution-goal-card");
        this.emptyGoalState = page.getByTestId("empty-goal-state");
        this.setGoalButton = page.getByTestId("set-goal-button");
        this.editGoalButton = page.getByTestId("edit-goal-button");
        this.deleteGoalButton = page.getByTestId("delete-goal-button");
        this.goalCardActionsButton = page.getByTestId("goal-card-actions");

        // Goal Progress
        this.goalTitle = page.getByTestId("contribution-goal-card").locator("h3").first();
        this.currentKarma = page.getByTestId("current-karma");
        this.goalProgress = page.getByTestId("goal-progress");
        this.progressPercentage = page.getByTestId("progress-percentage");
        this.deductionsSummary = page.getByTestId("deductions-summary");

        // Deductions List
        this.deductionsList = page.getByTestId("deductions-list");
        this.deductionItems = this.deductionsList.locator("[data-testid^='deduction-']");

        // Quick Deduction Form
        this.quickDeductionForm = page.getByTestId("quick-deduction-form");
        this.deductionReasonInput = page.getByTestId("deduction-reason-input");
        this.deductionAmountSelect = page.getByTestId("deduction-amount-select");
        this.deductButton = page.getByTestId("deduct-button");

        // Edit/Create Dialog
        this.editGoalDialog = page.getByTestId("edit-goal-dialog");
        this.goalTitleInput = page.getByTestId("goal-title-input");
        this.goalDescriptionInput = page.getByTestId("goal-description-input");
        this.goalMaxKarmaInput = page.getByTestId("goal-max-karma-input");
        this.goalRecurringToggle = page.getByTestId("goal-recurring-toggle");
        this.saveGoalButton = page.getByTestId("save-goal-button");
        this.cancelButton = this.editGoalDialog.getByRole("button", { name: /cancel/i });

        // Delete Dialog
        this.deleteGoalDialog = page.getByTestId("delete-goal-dialog");
        this.confirmDeleteButton = page.getByTestId("confirm-delete-button");

        // Dashboard Section
        this.dashboardContributionGoalSection = page.getByTestId(
            "dashboard-contribution-goal-section",
        );

        // Member Detail View
        this.memberContributionGoalView = page.getByTestId(
            "member-contribution-goal-view",
        );
    }

    /**
     * Navigate to member detail page with contribution goal tab
     */
    async gotoMemberDetail(memberId: string, lang = "en-US") {
        await this.page.goto(`/${lang}/app/family/${memberId}`);
    }

    /**
     * Navigate to dashboard
     */
    async gotoDashboard(lang = "en-US") {
        await this.page.goto(`/${lang}/app`);
    }

    /**
     * Create a new contribution goal
     */
    async createGoal(title: string, description: string, maxKarma: number, recurring = false) {
        await this.setGoalButton.click();
        await this.goalTitleInput.fill(title);
        await this.goalDescriptionInput.fill(description);
        await this.goalMaxKarmaInput.fill(maxKarma.toString());
        const isChecked = await this.goalRecurringToggle.isChecked();
        if (recurring !== isChecked) {
            await this.goalRecurringToggle.click();
        }
        await this.saveGoalButton.click();
        // Wait for dialog to close
        await this.editGoalDialog.waitFor({ state: "hidden" });
    }

    /**
     * Edit an existing contribution goal
     */
    async editGoal(title?: string, description?: string, maxKarma?: number, recurring?: boolean) {
        // Open the actions menu and click edit
        await this.goalCardActionsButton.click();
        await this.editGoalButton.click();
        await this.editGoalDialog.waitFor({ state: "visible" });

        if (title !== undefined) {
            await this.goalTitleInput.fill(title);
        }
        if (description !== undefined) {
            await this.goalDescriptionInput.fill(description);
        }
        if (maxKarma !== undefined) {
            await this.goalMaxKarmaInput.fill(maxKarma.toString());
        }
        if (recurring !== undefined) {
            const isChecked = await this.goalRecurringToggle.isChecked();
            if (recurring !== isChecked) {
                await this.goalRecurringToggle.click();
            }
        }

        await this.saveGoalButton.click();
        // Wait for dialog to close
        await this.editGoalDialog.waitFor({ state: "hidden" });
    }

    /**
     * Delete a contribution goal
     */
    async deleteGoal() {
        // Open the actions menu and click delete
        await this.goalCardActionsButton.click();
        await this.deleteGoalButton.click();
        await this.deleteGoalDialog.waitFor({ state: "visible" });
        await this.confirmDeleteButton.click();
        // Wait for dialog to close
        await this.deleteGoalDialog.waitFor({ state: "hidden" });
    }

    /**
     * Add a deduction to the contribution goal
     */
    async addDeduction(reason: string, amount: string = "1") {
        await this.deductionReasonInput.fill(reason);
        await this.deductionAmountSelect.click();
        await this.page.getByRole("option", { name: amount }).click();
        await this.deductButton.click();
        // Wait for deduction to be added (toast notification)
        await this.page.waitForTimeout(500);
    }

    /**
     * Get the current karma value
     */
    async getCurrentKarma(): Promise<number> {
        const text = await this.currentKarma.textContent();
        return parseInt(text || "0", 10);
    }

    /**
     * Get the progress percentage
     */
    async getProgressPercentage(): Promise<number> {
        const text = await this.progressPercentage.textContent();
        const match = text?.match(/(\d+)%/);
        return match ? parseInt(match[1], 10) : 0;
    }

    /**
     * Get the number of deductions
     */
    async getDeductionsCount(): Promise<number> {
        const isVisible = await this.deductionsList.isVisible();
        if (!isVisible) return 0;
        return await this.deductionItems.count();
    }

    /**
     * Check if empty state is visible
     */
    async isEmptyStateVisible(): Promise<boolean> {
        return await this.emptyGoalState.isVisible();
    }

    /**
     * Check if goal card is visible
     */
    async isGoalCardVisible(): Promise<boolean> {
        return await this.contributionGoalCard.isVisible();
    }

    /**
     * Check if quick deduction form is visible
     */
    async isQuickDeductionFormVisible(): Promise<boolean> {
        return await this.quickDeductionForm.isVisible();
    }

    /**
     * Wait for goal to be loaded
     */
    async waitForGoalToLoad() {
        await this.page.waitForLoadState("networkidle");
        await this.page.waitForTimeout(500);
    }
}
