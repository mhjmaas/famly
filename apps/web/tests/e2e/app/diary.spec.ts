import { expect, test } from "@playwright/test";
import { type AuthenticatedUser, authenticateUser } from "../helpers/auth";
import { DiaryPage } from "../pages/diary.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function createDiaryEntryViaApi(
    user: AuthenticatedUser,
    data: {
        date: string;
        entry: string;
    }
): Promise<{ _id: string }> {
    const response = await fetch(`${API_URL}/v1/diary`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.sessionToken}`,
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Failed to create diary entry via API: ${response.status} ${error}`
        );
    }

    return await response.json();
}

async function deleteDiaryEntryViaApi(
    user: AuthenticatedUser,
    entryId: string
): Promise<void> {
    const response = await fetch(`${API_URL}/v1/diary/${entryId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${user.sessionToken}`,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Failed to delete diary entry via API: ${response.status} ${error}`
        );
    }
}

async function getDiaryEntriesViaApi(
    user: AuthenticatedUser
): Promise<Array<{ _id: string }>> {
    const response = await fetch(`${API_URL}/v1/diary`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${user.sessionToken}`,
        },
    });

    if (!response.ok) {
        return [];
    }

    return await response.json();
}

async function cleanupDiaryEntries(user: AuthenticatedUser): Promise<void> {
    const entries = await getDiaryEntriesViaApi(user);
    for (const entry of entries) {
        await deleteDiaryEntryViaApi(user, entry._id);
    }
}

test.describe("Diary Page", () => {
    let diaryPage: DiaryPage;
    let user: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        diaryPage = new DiaryPage(page);
        user = await authenticateUser(page, {
            name: "Diary Test User",
            birthdate: "1990-05-15",
        });

        // Clean up any existing entries
        await cleanupDiaryEntries(user);

        await diaryPage.goto("en-US");
        await waitForPageLoad(page);
    });

    test.afterEach(async () => {
        // Clean up entries after each test
        if (user) {
            await cleanupDiaryEntries(user);
        }
    });

    test.describe("Page Load and Empty State", () => {
        test("should display diary page title and description", async () => {
            await expect(diaryPage.pageTitle).toHaveText("Personal Diary");
            await expect(diaryPage.pageDescription).toHaveText(
                "Write your thoughts and memories"
            );
        });

        test("should display empty state when no entries exist", async () => {
            await expect(diaryPage.emptyState).toBeVisible();
        });

        test("should display entry form", async () => {
            await expect(diaryPage.entryForm).toBeVisible();
            await expect(diaryPage.entryInput).toBeVisible();
            await expect(diaryPage.submitButton).toBeVisible();
        });

        test("should have submit button disabled when input is empty", async () => {
            expect(await diaryPage.isSubmitDisabled()).toBe(true);
        });
    });

    test.describe("Entry Creation", () => {
        test("should create a new diary entry", async ({ page }) => {
            const entryContent = "This is my first diary entry for testing!";

            await diaryPage.entryInput.fill(entryContent);
            expect(await diaryPage.isSubmitDisabled()).toBe(false);

            // Start waiting for response before clicking
            const responsePromise = page.waitForResponse(
                (response) =>
                    response.url().includes("/v1/diary") &&
                    response.request().method() === "POST"
            );

            await diaryPage.submitButton.click();

            // Wait for the POST response
            await responsePromise;

            // Entry should now be visible
            const entryCount = await diaryPage.getEntryCount();
            expect(entryCount).toBe(1);

            // Empty state should be hidden
            await expect(diaryPage.emptyState).not.toBeVisible();
        });

        test("should clear input after creating entry", async ({ page }) => {
            await diaryPage.entryInput.fill("Test entry content");

            // Start waiting for response before clicking
            const responsePromise = page.waitForResponse(
                (response) =>
                    response.url().includes("/v1/diary") &&
                    response.request().method() === "POST"
            );

            await diaryPage.submitButton.click();

            await responsePromise;

            // Input should be cleared
            await expect(diaryPage.entryInput).toHaveValue("");
        });

        test("should display entry content correctly", async ({ page }) => {
            const entryContent = "My unique test entry content 12345";

            await diaryPage.entryInput.fill(entryContent);

            // Start waiting for response before clicking
            const responsePromise = page.waitForResponse(
                (response) =>
                    response.url().includes("/v1/diary") &&
                    response.request().method() === "POST"
            );

            await diaryPage.submitButton.click();

            await responsePromise;

            const displayedContent = await diaryPage.getEntryContent(0);
            expect(displayedContent).toBe(entryContent);
        });
    });

    test.describe("Search Functionality", () => {
        test.beforeEach(async () => {
            // Create test entries via API
            const today = new Date().toISOString().split("T")[0];
            await createDiaryEntryViaApi(user, {
                date: today,
                entry: "First entry about apples",
            });
            await createDiaryEntryViaApi(user, {
                date: today,
                entry: "Second entry about oranges",
            });
            await createDiaryEntryViaApi(user, {
                date: today,
                entry: "Third entry about apples and bananas",
            });
        });

        test("should filter entries by search query", async ({ page }) => {
            await page.reload();
            await waitForPageLoad(page);

            // Initially should have 3 entries
            let entryCount = await diaryPage.getEntryCount();
            expect(entryCount).toBe(3);

            // Search for "apples"
            await diaryPage.search("apples");

            // Wait for filter to apply
            await page.waitForTimeout(300);

            // Should show 2 entries (first and third)
            entryCount = await diaryPage.getEntryCount();
            expect(entryCount).toBe(2);
        });

        test("should show no results message when search has no matches", async ({
            page,
        }) => {
            await page.reload();
            await waitForPageLoad(page);

            await diaryPage.search("nonexistent content xyz");
            await page.waitForTimeout(300);

            await expect(diaryPage.emptyState).toBeVisible();
        });

        test("should show active filter indicator when searching", async ({
            page,
        }) => {
            await page.reload();
            await waitForPageLoad(page);

            await diaryPage.search("apples");
            await page.waitForTimeout(300);

            await expect(diaryPage.activeFilters).toBeVisible();
        });

        test("should clear search and show all entries", async ({ page }) => {
            await page.reload();
            await waitForPageLoad(page);

            await diaryPage.search("apples");
            await page.waitForTimeout(300);

            let entryCount = await diaryPage.getEntryCount();
            expect(entryCount).toBe(2);

            await diaryPage.clearSearch();
            await page.waitForTimeout(300);

            entryCount = await diaryPage.getEntryCount();
            expect(entryCount).toBe(3);
        });
    });

    test.describe("Date Filtering", () => {
        test("should open date picker", async () => {
            await diaryPage.openDatePicker();

            // Calendar should be visible (we show 2 months for range mode on desktop)
            await expect(diaryPage.page.locator('[role="grid"]').first()).toBeVisible();
        });
    });

    test.describe("Responsive Layout", () => {
        test("should show desktop header on large screens", async ({ page }) => {
            await setViewport(page, "desktop");
            await page.reload();
            await waitForPageLoad(page);

            await expect(diaryPage.pageTitle).toBeVisible();
            await expect(diaryPage.searchInput).toBeVisible();
        });

        test("should show mobile layout on small screens", async ({ page }) => {
            await setViewport(page, "mobile");
            await page.reload();
            await waitForPageLoad(page);

            // Desktop title should be hidden
            await expect(diaryPage.pageTitle).not.toBeVisible();

            // Mobile search should be visible
            await expect(diaryPage.searchInputMobile).toBeVisible();
        });

        test("should show mobile add button on small screens", async ({ page }) => {
            await setViewport(page, "mobile");
            await page.reload();
            await waitForPageLoad(page);

            await expect(diaryPage.mobileAddButton).toBeVisible();
        });
    });
});

test.describe("Diary Page - Unauthenticated", () => {
    test("should redirect to signin when not authenticated", async ({ page }) => {
        // Clear any existing auth
        await page.context().clearCookies();

        await page.goto("/en-US/app/diary");

        // Should redirect to signin
        await expect(page).toHaveURL(/\/signin/);
    });
});
