import { expect, type Page, test } from "@playwright/test";
import {
    type AuthenticatedUser,
    authenticateUser,
} from "../helpers/auth";
import { ShoppingListsPage } from "../pages/shopping-lists.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface ShoppingListApiData {
    name: string;
    tags?: string[];
    items?: Array<{ name: string }>;
}

async function createShoppingListViaApi(
    user: AuthenticatedUser,
    data: ShoppingListApiData,
): Promise<{ _id: string }> {
    if (!user.familyId) {
        throw new Error("Family ID is required to create shopping lists via API");
    }

    const response = await fetch(
        `${API_URL}/v1/families/${user.familyId}/shopping-lists`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.sessionToken}`,
            },
            body: JSON.stringify(data),
        },
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Failed to create shopping list via API: ${response.status} ${error}`,
        );
    }

    return response.json();
}

async function deleteShoppingListViaApi(
    user: AuthenticatedUser,
    listId: string,
): Promise<void> {
    if (!user.familyId) {
        throw new Error("Family ID is required to delete shopping lists via API");
    }

    const response = await fetch(
        `${API_URL}/v1/families/${user.familyId}/shopping-lists/${listId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${user.sessionToken}`,
            },
        },
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Failed to delete shopping list via API: ${response.status} ${error}`,
        );
    }
}

async function reloadAndWait(
    page: Page,
    shoppingListsPage: ShoppingListsPage,
    familyId: string,
) {
    const listsRequest = page.waitForResponse(
        (response) =>
            response.url().includes(`/v1/families/${familyId}/shopping-lists`) &&
            response.request().method() === "GET",
    );

    await page.reload();
    await waitForPageLoad(page);
    await listsRequest;
    await shoppingListsPage.waitForPageLoad();
}

test.describe("Shopping Lists Page", () => {
    let shoppingListsPage: ShoppingListsPage;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");
        shoppingListsPage = new ShoppingListsPage(page);

        // Create parent user with family
        parentUser = await authenticateUser(page, {
            createFamily: true,
            name: "Test Parent",
            familyName: "Test Family",
        });

        await shoppingListsPage.gotoShoppingLists();
        await shoppingListsPage.waitForPageLoad();
    });

    test.describe("Page Load", () => {
        test("should display page title and description", async () => {
            await expect(shoppingListsPage.pageTitle).toBeVisible();
            await expect(shoppingListsPage.pageTitle).toHaveText("Shopping Lists");
            await expect(shoppingListsPage.pageDescription).toBeVisible();
        });

        test("should show empty state when no lists exist", async () => {
            await expect(shoppingListsPage.emptyState).toBeVisible();
            await expect(shoppingListsPage.emptyStateCreateButton).toBeVisible();
        });

        test("should show create button in header on desktop", async () => {
            await expect(shoppingListsPage.createButton).toBeVisible();
        });
    });

    test.describe("Create Shopping List", () => {
        test("should open create dialog when clicking create button", async () => {
            await shoppingListsPage.openCreateDialog();
            await expect(shoppingListsPage.dialog).toBeVisible();
            await expect(shoppingListsPage.dialogTitle).toHaveText(
                "Create New Shopping List",
            );
        });

        test("should create a shopping list with name only", async () => {
            await shoppingListsPage.openCreateDialog();
            await shoppingListsPage.fillListForm({ name: "Weekly Groceries" });
            await shoppingListsPage.submitDialog();

            await expect(shoppingListsPage.listCards.first()).toBeVisible();
            await expect(shoppingListsPage.listNames.first()).toHaveText(
                "Weekly Groceries",
            );
        });

        test("should create a shopping list with tags", async () => {
            await shoppingListsPage.openCreateDialog();
            await shoppingListsPage.fillListForm({
                name: "Hardware Store",
                tags: ["DIY", "urgent"],
            });
            await shoppingListsPage.submitDialog();

            await expect(shoppingListsPage.listCards.first()).toBeVisible();
            await expect(shoppingListsPage.listNames.first()).toHaveText(
                "Hardware Store",
            );
            // Check for tags in the card (not dialog)
            await expect(shoppingListsPage.cardTagBadges.first()).toBeVisible();
        });

        test("should cancel dialog without creating list", async () => {
            await shoppingListsPage.openCreateDialog();
            await shoppingListsPage.fillListForm({ name: "Cancelled List" });
            await shoppingListsPage.cancelDialog();

            await expect(shoppingListsPage.emptyState).toBeVisible();
        });

        test("should not submit with empty name", async () => {
            await shoppingListsPage.openCreateDialog();
            await expect(shoppingListsPage.dialogSubmitButton).toBeDisabled();
        });
    });

    test.describe("Edit Shopping List", () => {
        test.beforeEach(async ({ page }) => {
            await createShoppingListViaApi(parentUser, {
                name: "Original Name",
                tags: ["original"],
            });
            await reloadAndWait(page, shoppingListsPage, parentUser.familyId!);
        });

        test("should open edit dialog from menu", async () => {
            await shoppingListsPage.openListMenu(0);
            await shoppingListsPage.clickEditAction();

            await expect(shoppingListsPage.dialog).toBeVisible();
            await expect(shoppingListsPage.dialogTitle).toHaveText(
                "Edit Shopping List",
            );
            await expect(shoppingListsPage.nameInput).toHaveValue("Original Name");
        });

        test("should update shopping list name", async () => {
            await shoppingListsPage.openListMenu(0);
            await shoppingListsPage.clickEditAction();

            await shoppingListsPage.nameInput.clear();
            await shoppingListsPage.nameInput.fill("Updated Name");
            await shoppingListsPage.submitDialog();

            await expect(shoppingListsPage.listNames.first()).toHaveText(
                "Updated Name",
            );
        });
    });

    test.describe("Delete Shopping List", () => {
        test.beforeEach(async ({ page }) => {
            await createShoppingListViaApi(parentUser, {
                name: "List to Delete",
            });
            await reloadAndWait(page, shoppingListsPage, parentUser.familyId!);
        });

        test("should open delete confirmation dialog", async () => {
            await shoppingListsPage.openListMenu(0);
            await shoppingListsPage.clickDeleteAction();

            await expect(shoppingListsPage.deleteDialog).toBeVisible();
        });

        test("should delete shopping list on confirm", async () => {
            await shoppingListsPage.openListMenu(0);
            await shoppingListsPage.clickDeleteAction();
            await shoppingListsPage.confirmDelete();

            await expect(shoppingListsPage.emptyState).toBeVisible();
        });

        test("should cancel deletion", async () => {
            await shoppingListsPage.openListMenu(0);
            await shoppingListsPage.clickDeleteAction();
            await shoppingListsPage.cancelDelete();

            await expect(shoppingListsPage.listCards.first()).toBeVisible();
        });
    });

    test.describe("Shopping List Items", () => {
        test.beforeEach(async ({ page }) => {
            await createShoppingListViaApi(parentUser, {
                name: "Groceries",
                items: [{ name: "Milk" }, { name: "Bread" }],
            });
            await reloadAndWait(page, shoppingListsPage, parentUser.familyId!);
        });

        test("should display items in shopping list", async () => {
            await expect(shoppingListsPage.listItems.first()).toBeVisible();
            const itemCount = await shoppingListsPage.getItemCount(0);
            expect(itemCount).toBe(2);
        });

        test("should add item via inline input", async () => {
            await shoppingListsPage.addItem(0, "Eggs");

            // Wait for the item to appear
            await expect(
                shoppingListsPage.page.getByText("Eggs"),
            ).toBeVisible();
        });

        test("should toggle item checked state", async () => {
            await shoppingListsPage.toggleItem(0);

            // The checkbox should be checked
            await expect(shoppingListsPage.itemCheckboxes.first()).toBeChecked();
        });

        test("should show item count", async () => {
            await expect(shoppingListsPage.listItemCounts.first()).toContainText(
                "0 of 2 items",
            );
        });
    });

    test.describe("Check All Items", () => {
        test.beforeEach(async ({ page }) => {
            await createShoppingListViaApi(parentUser, {
                name: "Quick List",
                items: [{ name: "Item 1" }, { name: "Item 2" }],
            });
            await reloadAndWait(page, shoppingListsPage, parentUser.familyId!);
        });

        test("should check all items when clicking check all", async () => {
            await shoppingListsPage.checkAllButtons.first().click();

            // Wait for items to be checked
            await expect(shoppingListsPage.itemCheckboxes.first()).toBeChecked();
            await expect(shoppingListsPage.itemCheckboxes.nth(1)).toBeChecked();
        });
    });

    test.describe("Completed Lists / History", () => {
        test("should move list to history section when all items are checked", async ({ page }) => {
            // Create a list with items
            await createShoppingListViaApi(parentUser, {
                name: "List to Complete",
                items: [{ name: "Item 1" }, { name: "Item 2" }],
            });
            await reloadAndWait(page, shoppingListsPage, parentUser.familyId!);

            // Verify no date separator initially (list is active)
            await expect(shoppingListsPage.dateSeparators).toHaveCount(0);

            // Check all items using the Check All button
            await shoppingListsPage.checkAllButtons.first().click();

            // Wait for items to be checked
            await expect(shoppingListsPage.itemCheckboxes.first()).toBeChecked();
            await expect(shoppingListsPage.itemCheckboxes.nth(1)).toBeChecked();

            // Verify the date separator appears (list moved to history)
            await expect(shoppingListsPage.dateSeparators.first()).toBeVisible();
            await expect(shoppingListsPage.dateSeparators.first()).toContainText("Completed");
        });

        test("should show completed list with muted styling", async ({ page }) => {
            // Create a list with items
            await createShoppingListViaApi(parentUser, {
                name: "Completed List",
                items: [{ name: "Done Item" }],
            });
            await reloadAndWait(page, shoppingListsPage, parentUser.familyId!);

            // Check all items
            await shoppingListsPage.checkAllButtons.first().click();
            await expect(shoppingListsPage.itemCheckboxes.first()).toBeChecked();

            // Verify the card has opacity styling (muted)
            const card = shoppingListsPage.listCards.first();
            await expect(card).toHaveClass(/opacity-60/);
        });
    });

    test.describe("Responsive Design", () => {
        test("should hide desktop create button on mobile", async ({ page }) => {
            await setViewport(page, "mobile");
            await page.reload();
            await shoppingListsPage.waitForPageLoad();

            await expect(shoppingListsPage.createButton).not.toBeVisible();
        });
    });
});
