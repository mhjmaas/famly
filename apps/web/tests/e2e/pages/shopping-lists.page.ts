import type { Locator, Page } from "@playwright/test";

export interface ShoppingListFormInput {
    name?: string;
    tags?: string[];
}

/**
 * Page Object for Shopping Lists Page
 */
export class ShoppingListsPage {
    readonly page: Page;

    // Header elements
    readonly pageContainer: Locator;
    readonly pageHeader: Locator;
    readonly pageTitle: Locator;
    readonly pageDescription: Locator;
    readonly createButton: Locator;

    // Empty state
    readonly emptyState: Locator;
    readonly emptyStateCreateButton: Locator;

    // List container
    readonly listContainer: Locator;
    readonly listCards: Locator;

    // Card elements (use .nth() to target specific cards)
    readonly listNames: Locator;
    readonly listTags: Locator;
    readonly cardTagBadges: Locator;
    readonly listItemCounts: Locator;
    readonly checkAllButtons: Locator;
    readonly menuButtons: Locator;
    readonly menuContainers: Locator;
    readonly editActions: Locator;
    readonly deleteActions: Locator;

    // Date separators (for completed/history lists)
    readonly dateSeparators: Locator;

    // Item elements
    readonly listItems: Locator;
    readonly itemCheckboxes: Locator;
    readonly itemNames: Locator;

    // Add item input
    readonly addItemInputs: Locator;
    readonly addItemButtons: Locator;

    // Create/Edit dialog
    readonly dialog: Locator;
    readonly dialogTitle: Locator;
    readonly nameInput: Locator;
    readonly addTagsButton: Locator;
    readonly tagsInput: Locator;
    readonly tagBadges: Locator;
    readonly tagRemoveButtons: Locator;
    readonly dialogCancelButton: Locator;
    readonly dialogSubmitButton: Locator;

    // Delete dialog
    readonly deleteDialog: Locator;
    readonly deleteCancelButton: Locator;
    readonly deleteConfirmButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Header
        this.pageContainer = page.getByTestId("shopping-lists-page");
        this.pageHeader = page.getByTestId("shopping-lists-header");
        this.pageTitle = page.getByTestId("shopping-lists-title");
        this.pageDescription = page.getByTestId("shopping-lists-description");
        this.createButton = page.getByTestId("shopping-lists-create-button");

        // Empty state
        this.emptyState = page.getByTestId("shopping-lists-empty");
        this.emptyStateCreateButton = page.getByTestId("shopping-lists-empty-create");

        // List
        this.listContainer = page.getByTestId("shopping-lists-list");
        this.listCards = page.getByTestId("shopping-list-card");

        // Card elements
        this.listNames = page.getByTestId("shopping-list-name");
        this.listTags = page.getByTestId("shopping-list-tags");
        this.cardTagBadges = page.getByTestId("shopping-list-tag");
        this.listItemCounts = page.getByTestId("shopping-list-item-count");
        this.checkAllButtons = page.getByTestId("shopping-list-check-all");
        this.menuButtons = page.getByTestId("shopping-list-menu-button");
        this.menuContainers = page.getByTestId("shopping-list-menu");
        this.editActions = page.getByTestId("shopping-list-action-edit");
        this.deleteActions = page.getByTestId("shopping-list-action-delete");

        // Date separators
        this.dateSeparators = page.getByTestId("shopping-lists-date-separator");

        // Items
        this.listItems = page.getByTestId("shopping-list-item");
        this.itemCheckboxes = page.getByTestId("shopping-list-item-checkbox");
        this.itemNames = page.getByTestId("shopping-list-item-name");

        // Add item
        this.addItemInputs = page.getByTestId("shopping-list-add-item-input");
        this.addItemButtons = page.getByTestId("shopping-list-add-item-button");

        // Dialog
        this.dialog = page.getByTestId("shopping-list-dialog");
        this.dialogTitle = page.getByTestId("shopping-list-dialog-title");
        this.nameInput = page.getByTestId("shopping-list-name-input");
        this.addTagsButton = page.getByTestId("shopping-list-add-tags-button");
        this.tagsInput = page.getByTestId("shopping-list-tags-input");
        this.tagBadges = page.getByTestId("shopping-list-tag-badge");
        this.tagRemoveButtons = page.getByTestId("shopping-list-tag-remove");
        this.dialogCancelButton = page.getByTestId("shopping-list-dialog-cancel");
        this.dialogSubmitButton = page.getByTestId("shopping-list-dialog-submit");

        // Delete dialog
        this.deleteDialog = page.getByTestId("shopping-list-delete-dialog");
        this.deleteCancelButton = page.getByTestId("shopping-list-delete-cancel");
        this.deleteConfirmButton = page.getByTestId("shopping-list-delete-confirm");
    }

    /**
     * Navigate to shopping lists page
     */
    async gotoShoppingLists(locale = "en-US") {
        await this.page.goto(`/${locale}/app/shopping-lists`);
        await this.page.waitForLoadState("networkidle");
    }

    /**
     * Open the create shopping list dialog
     */
    async openCreateDialog() {
        // Try desktop button first, then empty state button
        const desktopButton = this.createButton;
        if (await desktopButton.isVisible()) {
            await desktopButton.click();
        } else {
            await this.emptyStateCreateButton.click();
        }
        await this.dialog.waitFor({ state: "visible" });
    }

    /**
     * Open actions menu for a shopping list card
     */
    async openListMenu(listIndex = 0) {
        await this.menuButtons.nth(listIndex).click();
        await this.menuContainers.first().waitFor({ state: "visible" });
    }

    /**
     * Fill shopping list form with provided data
     */
    async fillListForm({ name, tags }: ShoppingListFormInput) {
        if (typeof name === "string") {
            await this.nameInput.fill(name);
        }

        if (tags && tags.length > 0) {
            // Show tags input if not visible
            const tagsInputVisible = await this.tagsInput.isVisible().catch(() => false);
            if (!tagsInputVisible) {
                await this.addTagsButton.click();
            }

            for (const tag of tags) {
                await this.tagsInput.fill(tag);
                await this.tagsInput.press("Enter");
            }
        }
    }

    /**
     * Submit the dialog form
     */
    async submitDialog() {
        await this.dialogSubmitButton.click();
        await this.dialog.waitFor({ state: "hidden" });
    }

    /**
     * Cancel the dialog
     */
    async cancelDialog() {
        await this.dialogCancelButton.click();
        await this.dialog.waitFor({ state: "hidden" });
    }

    /**
     * Add an item to a shopping list
     */
    async addItem(listIndex: number, itemName: string) {
        const input = this.addItemInputs.nth(listIndex);
        const button = this.addItemButtons.nth(listIndex);
        await input.fill(itemName);
        await button.click();
    }

    /**
     * Toggle item checkbox
     */
    async toggleItem(itemIndex: number) {
        await this.itemCheckboxes.nth(itemIndex).click();
    }

    /**
     * Click edit action from menu
     */
    async clickEditAction() {
        await this.editActions.first().click();
        await this.dialog.waitFor({ state: "visible" });
    }

    /**
     * Click delete action from menu
     */
    async clickDeleteAction() {
        await this.deleteActions.first().click();
        await this.deleteDialog.waitFor({ state: "visible" });
    }

    /**
     * Confirm deletion
     */
    async confirmDelete() {
        await this.deleteConfirmButton.click();
        await this.deleteDialog.waitFor({ state: "hidden" });
    }

    /**
     * Cancel deletion
     */
    async cancelDelete() {
        await this.deleteCancelButton.click();
        await this.deleteDialog.waitFor({ state: "hidden" });
    }

    /**
     * Get the count of shopping list cards
     */
    async getListCount(): Promise<number> {
        return this.listCards.count();
    }

    /**
     * Get the count of items in a specific list
     */
    async getItemCount(listIndex: number): Promise<number> {
        const card = this.listCards.nth(listIndex);
        return card.getByTestId("shopping-list-item").count();
    }

    /**
     * Check if empty state is visible
     */
    async isEmptyStateVisible(): Promise<boolean> {
        return this.emptyState.isVisible();
    }

    /**
     * Wait for page to load
     */
    async waitForPageLoad() {
        await this.pageContainer.waitFor({ state: "visible" });
    }
}
