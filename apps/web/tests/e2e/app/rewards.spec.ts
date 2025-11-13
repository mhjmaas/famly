import { expect, type Page, test } from "@playwright/test";
import {
    type AuthenticatedUser,
    authenticateUser,
    switchUser,
} from "../helpers/auth";
import { RewardsPage } from "../pages/rewards.page";
import { TasksPage } from "../pages/tasks.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function createRewardViaApi(
    user: AuthenticatedUser,
    data: {
        name: string;
        karmaCost: number;
        description?: string;
        imageUrl?: string;
    },
): Promise<void> {
    if (!user.familyId) {
        throw new Error("Family ID is required to create rewards via API");
    }

    const response = await fetch(
        `${API_URL}/v1/families/${user.familyId}/rewards`,
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
            `Failed to create reward via API: ${response.status} ${error}`,
        );
    }

    await response.json();
}

async function reloadRewardsAndWait(
    page: Page,
    rewardsPage: RewardsPage,
    familyId: string,
) {
    const rewardsRequest = page.waitForResponse(
        (response) =>
            response.url().includes(`/v1/families/${familyId}/rewards`) &&
            response.request().method() === "GET",
    );

    await page.reload();
    await waitForPageLoad(page);
    await rewardsRequest;
    await rewardsPage.rewardCards.first().waitFor({ state: "visible" });
}

test.describe("Rewards Page", () => {
    let rewardsPage: RewardsPage;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        rewardsPage = new RewardsPage(page);
        parentUser = await authenticateUser(page, {
            name: "Parent Rewards User",
            birthdate: "1985-04-10",
            createFamily: true,
            familyName: "Rewards Test Family",
        });

        await rewardsPage.gotoRewards("en-US");
        await waitForPageLoad(page);
    });

    test.describe("Page Load and Empty State", () => {
        test("should display rewards page with karma balance", async () => {
            await expect(rewardsPage.karmaBalanceCard).toBeVisible();
        });

        test("should show empty state when no rewards exist", async () => {
            await expect(rewardsPage.emptyState).toBeVisible();
        });
    });

    test.describe("Parent - Create Reward", () => {
        test("should create a new reward successfully", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Extra Screen Time");
            await rewardsPage.karmaCostInput.fill("50");

            // Click the description toggle button to show the description field
            await page.getByTestId("reward-description-toggle").click();
            await rewardsPage.descriptionInput.fill("30 minutes of extra screen time");

            const createResponse = page.waitForResponse(
                (response) =>
                    response.url().includes(`/v1/families/${parentUser.familyId}/rewards`) &&
                    response.request().method() === "POST",
            );

            await rewardsPage.dialogSubmitButton.click();
            await createResponse;
            await rewardsPage.rewardDialog.waitFor({ state: "hidden" });

            await expect(rewardsPage.rewardCards.first()).toBeVisible({ timeout: 10000 });
            await expect(
                rewardsPage.rewardNames.filter({ hasText: "Extra Screen Time" }),
            ).toBeVisible();
        });

        test("should create reward with all optional fields", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Ice Cream Trip");
            await rewardsPage.karmaCostInput.fill("100");
            await rewardsPage.imageUrlInput.fill("https://placehold.co/400x300");

            // Click the description toggle button to show the description field
            await page.getByTestId("reward-description-toggle").click();
            await rewardsPage.descriptionInput.fill("Trip to the ice cream shop");

            const createResponse = page.waitForResponse(
                (response) =>
                    response.url().includes(`/v1/families/${parentUser.familyId}/rewards`) &&
                    response.request().method() === "POST",
            );

            await rewardsPage.dialogSubmitButton.click();
            await createResponse;

            await expect(
                rewardsPage.rewardNames.filter({ hasText: "Ice Cream Trip" }),
            ).toBeVisible();
        });
    });

    test.describe("Parent - Edit Reward", () => {
        test("should edit an existing reward", async ({ page }) => {
            // First create a reward via API
            await createRewardViaApi(parentUser, {
                name: "Test Reward",
                karmaCost: 25,
            });

            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);

            // Open edit dialog - wait for actions button to be visible first
            const actionsButton = rewardsPage.rewardActionsButtons.first();
            await actionsButton.waitFor({ state: "visible", timeout: 10000 });
            await actionsButton.click();
            await page.getByRole("menuitem", { name: /edit/i }).click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            // Verify form is pre-populated
            await expect(rewardsPage.nameInput).toHaveValue("Test Reward");
            await expect(rewardsPage.karmaCostInput).toHaveValue("25");

            // Update values
            await rewardsPage.nameInput.fill("Updated Reward");
            await rewardsPage.karmaCostInput.fill("30");

            const updateResponse = page.waitForResponse(
                (response) =>
                    response.url().includes(`/v1/families/${parentUser.familyId}/rewards/`) &&
                    response.request().method() === "PATCH",
            );

            await rewardsPage.dialogSubmitButton.click();
            await updateResponse;

            await expect(
                rewardsPage.rewardNames.filter({ hasText: "Updated Reward" }),
            ).toBeVisible();
        });
    });

    test.describe("Parent - Delete Reward", () => {
        test("should delete a reward", async ({ page }) => {
            // First create a reward via API
            await createRewardViaApi(parentUser, {
                name: "Reward to Delete",
                karmaCost: 10,
            });

            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);

            const initialCount = await rewardsPage.getRewardCount();

            const deleteResponse = page.waitForResponse(
                (response) =>
                    response.url().includes(`/v1/families/${parentUser.familyId}/rewards/`) &&
                    response.request().method() === "DELETE",
            );

            await rewardsPage.deleteReward(0);
            await deleteResponse;

            // Verify reward is removed
            const newCount = await rewardsPage.getRewardCount();
            expect(newCount).toBe(initialCount - 1);
        });
    });

    test.describe("Favourite Rewards", () => {
        test("should toggle favourite status", async ({ page }) => {
            // Create a reward via API
            await createRewardViaApi(parentUser, {
                name: "Favourite Test",
                karmaCost: 20,
            });

            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);

            const isFavouritedBefore = await rewardsPage.isRewardFavourited(0);

            const toggleResponse = page.waitForResponse(
                (response) =>
                    response.url().includes(`/v1/families/${parentUser.familyId}/rewards/`) &&
                    response.url().includes("/favourite") &&
                    response.request().method() === "POST",
            );

            await rewardsPage.toggleFavourite(0);
            await toggleResponse;

            const isFavouritedAfter = await rewardsPage.isRewardFavourited(0);
            expect(isFavouritedAfter).toBe(!isFavouritedBefore);
        });

        test("should show progress bar when reward is favourited", async ({ page }) => {
            // Create a reward via API
            await createRewardViaApi(parentUser, {
                name: "Progress Test",
                karmaCost: 100,
            });

            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);

            // Favourite the reward
            const isFavourited = await rewardsPage.isRewardFavourited(0);
            if (!isFavourited) {
                const toggleResponse = page.waitForResponse(
                    (response) =>
                        response.url().includes(`/v1/families/${parentUser.familyId}/rewards/`) &&
                        response.url().includes("/favourite") &&
                        response.request().method() === "POST",
                );

                await rewardsPage.toggleFavourite(0);
                await toggleResponse;
            }

            // Check if progress bar is visible
            const hasProgress = await rewardsPage.hasProgressBar(0);
            expect(hasProgress).toBe(true);
        });
    });

    test.describe("Claim Workflow", () => {
        test("should open claim confirmation sheet", async ({ page }) => {
            // Grant karma to user FIRST
            const grantResponse = await fetch(
                `${API_URL}/v1/families/${parentUser.familyId}/karma/grant`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${parentUser.sessionToken}`,
                    },
                    body: JSON.stringify({
                        userId: parentUser.userId,
                        amount: 10,
                        reason: "Test karma",
                    }),
                },
            );
            const response = await grantResponse.json();

            // Then create a reward via API with very low karma cost
            await createRewardViaApi(parentUser, {
                name: "Claimable Reward",
                karmaCost: 1,
            });

            // Reload to get updated karma balance and new reward
            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);

            // Click claim button - should be enabled since user has karma
            const claimButton = rewardsPage.rewardClaimButtons.first();
            await claimButton.waitFor({ state: "visible" });
            await claimButton.click();
            await expect(rewardsPage.claimSheet).toBeVisible();

            // Cancel the claim
            await rewardsPage.claimCancelButton.click();
            await expect(rewardsPage.claimSheet).not.toBeVisible();
        });

        test("should claim a reward successfully and complete full workflow", async ({ page }) => {
            // Grant karma to user FIRST
            const grantResponse = await fetch(
                `${API_URL}/v1/families/${parentUser.familyId}/karma/grant`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${parentUser.sessionToken}`,
                    },
                    body: JSON.stringify({
                        userId: parentUser.userId,
                        amount: 10,
                        reason: "Test karma",
                    }),
                },
            );
            await grantResponse.json();

            // Then create a reward via API with very low karma cost
            await createRewardViaApi(parentUser, {
                name: "Claim Test",
                karmaCost: 1,
            });

            // Reload to get updated karma balance and new reward
            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);

            // Open claim sheet - button should be enabled since user has karma
            const claimButton = rewardsPage.rewardClaimButtons.first();
            await claimButton.waitFor({ state: "visible" });
            await claimButton.click();
            await expect(rewardsPage.claimSheet).toBeVisible();

            await rewardsPage.claimConfirmButton.click();

            await expect(rewardsPage.claimSheet).not.toBeVisible();

            // Verify pending status
            const isPending = await rewardsPage.isRewardPending(0);
            expect(isPending).toBe(true);

            // Navigate to tasks page to verify task was created
            const tasksPage = new TasksPage(page);
            await tasksPage.gotoTasks("en-US");
            await waitForPageLoad(page);

            // Wait for tasks to load and verify task card exists
            await tasksPage.taskCards.first().waitFor({ state: "visible", timeout: 10000 });

            // Verify task name contains the reward name and parent's name
            const taskName = await tasksPage.getTaskName(0);
            expect(taskName).toContain("Claim Test");
            expect(taskName).toContain("Parent Rewards User");

            // Complete the task
            const completeResponse = page.waitForResponse(
                (response) =>
                    response.url().includes(`/v1/families/${parentUser.familyId}/tasks/`) &&
                    response.request().method() === "PATCH",
            );
            await tasksPage.toggleTaskCompletion(0);
            await completeResponse;

            // Verify task is marked as completed
            await expect(tasksPage.taskCompleteToggles.nth(0)).toHaveAttribute(
                "data-state",
                "checked",
            );

            // Navigate back to rewards page
            await rewardsPage.gotoRewards("en-US");
            await waitForPageLoad(page);
            await rewardsPage.rewardCards.first().waitFor({ state: "visible" });

            // Verify reward is claimable again (no longer pending)
            const isStillPending = await rewardsPage.isRewardPending(0);
            expect(isStillPending).toBe(false);

            // Verify claim count shows "1x claimed"
            const rewardCard = rewardsPage.rewardCards.first();
            const claimCountText = await rewardCard.textContent();
            expect(claimCountText).toContain("1");
            expect(claimCountText?.toLowerCase()).toMatch(/claimed|claim/);
        });
    });

    test.describe("Responsive Layout", () => {
        test.beforeEach(async () => {
            // Create a reward for responsive tests
            await createRewardViaApi(parentUser, {
                name: "Responsive Test",
                karmaCost: 20,
            });
        });

        test("should display correctly on mobile", async ({ page }) => {
            await setViewport(page, "mobile");
            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);
            await expect(rewardsPage.rewardsGrid).toBeVisible();
        });

        test("should display correctly on tablet", async ({ page }) => {
            await setViewport(page, "tablet");
            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);
            await expect(rewardsPage.rewardsGrid).toBeVisible();
        });

        test("should display correctly on desktop", async ({ page }) => {
            await setViewport(page, "desktop");
            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);
            await expect(rewardsPage.rewardsGrid).toBeVisible();
        });
    });
});

test.describe("Rewards Page - Child User", () => {
    let rewardsPage: RewardsPage;
    let childUser: AuthenticatedUser;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        rewardsPage = new RewardsPage(page);

        // Create parent user first and create family
        parentUser = await authenticateUser(page, {
            name: "Parent For Child Test",
            birthdate: "1985-04-10",
            createFamily: true,
            familyName: "Child Test Family",
        });

        // Create child user
        childUser = await authenticateUser(page, {
            name: "Child User",
            birthdate: "2015-06-20",
        });

        // Add child to parent's family
        const addChildResponse = await fetch(
            `${API_URL}/v1/families/${parentUser.familyId}/members`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parentUser.sessionToken}`,
                },
                body: JSON.stringify({
                    email: childUser.email,
                    password: childUser.password,
                    name: childUser.name,
                    birthdate: "2015-06-20",
                    role: "Child",
                }),
            },
        );

        if (!addChildResponse.ok) {
            throw new Error(`Failed to add child: ${await addChildResponse.text()}`);
        }

        childUser.familyId = parentUser.familyId;

        // Create a reward for child tests via API (as parent)
        await createRewardViaApi(parentUser, {
            name: "Child Test Reward",
            karmaCost: 10,
        });

        // Switch to child user
        await switchUser(page, childUser);
        await rewardsPage.gotoRewards("en-US");
        await waitForPageLoad(page);
        await rewardsPage.rewardCards.first().waitFor({ state: "visible" });
    });

    test("should not show action menu for child users", async () => {
        // Actions button should not be visible for child users
        const count = await rewardsPage.rewardActionsButtons.count();
        expect(count).toBe(0);
    });

    test("should allow child to favourite rewards", async ({ page }) => {
        const isFavouritedBefore = await rewardsPage.isRewardFavourited(0);

        const toggleResponse = page.waitForResponse(
            (response) =>
                response.url().includes(`/v1/families/${childUser.familyId}/rewards/`) &&
                response.url().includes("/favourite") &&
                response.request().method() === "POST",
        );

        await rewardsPage.toggleFavourite(0);
        await toggleResponse;

        const isFavouritedAfter = await rewardsPage.isRewardFavourited(0);
        expect(isFavouritedAfter).toBe(!isFavouritedBefore);
    });

    test("should allow child to claim rewards and verify task creation", async ({ page }) => {
        // Grant karma to child BEFORE they view the page
        const grantResponse = await fetch(
            `${API_URL}/v1/families/${childUser.familyId}/karma/grant`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${parentUser.sessionToken}`,
                },
                body: JSON.stringify({
                    userId: childUser.userId,
                    amount: 20,
                    reason: "Test karma for child",
                }),
            },
        );
        await grantResponse.json();

        // Reload to get updated karma balance
        await reloadRewardsAndWait(page, rewardsPage, childUser.familyId!);

        // Click claim button - should be enabled since child has karma
        const claimButton = rewardsPage.rewardClaimButtons.first();
        await claimButton.waitFor({ state: "visible" });
        await claimButton.click();
        await expect(rewardsPage.claimSheet).toBeVisible();

        // Confirm the claim
        await rewardsPage.claimConfirmButton.click();

        // Verify the claim sheet is invisible (closed)
        await expect(rewardsPage.claimSheet).not.toBeVisible();

        // Verify the reward shows as pending
        const isPending = await rewardsPage.isRewardPending(0);
        expect(isPending).toBe(true);

        // Navigate to tasks page to verify task was created
        const tasksPage = new TasksPage(page);
        await tasksPage.gotoTasks("en-US");
        await waitForPageLoad(page);

        // Wait for tasks to load and verify task card exists
        await tasksPage.taskCards.first().waitFor({ state: "visible", timeout: 10000 });

        // Verify task name contains the reward name and child's name
        const taskName = await tasksPage.getTaskName(0);
        expect(taskName).toContain("Child Test Reward");
        expect(taskName).toContain("Child User");

        // Verify task is assigned to parents (child can see it but shouldn't be able to complete it themselves)
        const assignment = await tasksPage.getTaskAssignment(0);
        expect(assignment?.toLowerCase()).toContain("parent");
    });
});

test.describe("Rewards Page - Parent User", () => {
    let rewardsPage: RewardsPage;
    let parentUser: AuthenticatedUser;

    test.beforeEach(async ({ page }) => {
        await setViewport(page, "desktop");

        rewardsPage = new RewardsPage(page);
        parentUser = await authenticateUser(page, {
            name: "Parent Image Upload User",
            birthdate: "1985-04-10",
            createFamily: true,
            familyName: "Image Upload Test Family",
        });

        await rewardsPage.gotoRewards("en-US");
        await waitForPageLoad(page);
    });

    test.describe("Image Upload", () => {
        test("should upload image when creating reward", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Reward with Image");
            await rewardsPage.karmaCostInput.fill("75");

            // Upload image (using a simple 1x1 PNG)
            const testImagePath = "tests/fixtures/test-image.png";
            await rewardsPage.uploadImage(testImagePath);

            // Verify preview is visible
            await expect(rewardsPage.imagePreview).toBeVisible();

            // Submit form and wait for API response
            const createResponse = page.waitForResponse(
                (response) =>
                    response.url().includes(`/v1/families/${parentUser.familyId}/rewards`) &&
                    response.request().method() === "POST",
            );

            await rewardsPage.dialogSubmitButton.click();
            await createResponse;
            await rewardsPage.rewardDialog.waitFor({ state: "hidden" });

            // Wait for reward card to be visible
            await expect(rewardsPage.rewardCards.first()).toBeVisible({ timeout: 10000 });

            // Verify the reward was created with the correct name
            await expect(
                rewardsPage.rewardNames.filter({ hasText: "Reward with Image" }),
            ).toBeVisible();
        });

        test.skip("should upload image when editing reward", async ({ page }) => {
            // Create reward via API first
            await createRewardViaApi(parentUser, {
                name: "Edit Image Reward",
                karmaCost: 50,
            });

            await reloadRewardsAndWait(page, rewardsPage, parentUser.familyId!);

            // Edit the reward (editReward already waits for dialog)
            await rewardsPage.editReward(0, {});

            // Upload image
            const testImagePath = "tests/fixtures/test-image.png";
            await rewardsPage.uploadImage(testImagePath);

            // Verify preview is visible
            await expect(rewardsPage.imagePreview).toBeVisible();

            // Submit form
            await rewardsPage.dialogSubmitButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "hidden" });

            // Verify image is displayed in card
            const rewardCard = rewardsPage.rewardCards.first();
            const image = rewardCard.locator("img").first();
            await expect(image).toBeVisible();
        });

        test("should show error for file exceeding size limit", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Large File Test");
            await rewardsPage.karmaCostInput.fill("50");

            // Try to upload a large file (>5MB mock)
            const largeFilePath = "tests/fixtures/test-image-large.png";

            // Set input files
            await rewardsPage.fileInput.setInputFiles(largeFilePath);

            // Verify error message appears
            await expect(rewardsPage.uploadError).toBeVisible();
            const errorText = await rewardsPage.getUploadError();
            expect(errorText?.toLowerCase()).toContain("5mb");
        });

        test("should show error for invalid file type", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Invalid Type Test");
            await rewardsPage.karmaCostInput.fill("50");

            // Try to upload a PDF file
            const invalidFilePath = "tests/fixtures/test-document.pdf";
            await rewardsPage.fileInput.setInputFiles(invalidFilePath);

            // Verify error message appears
            await expect(rewardsPage.uploadError).toBeVisible();
            const errorText = await rewardsPage.getUploadError();
            expect(errorText?.toLowerCase()).toMatch(/(jpeg|png|gif|webp|allowed)/i);
        });

        test("should remove uploaded image", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Remove Image Test");
            await rewardsPage.karmaCostInput.fill("50");

            // Upload image
            const testImagePath = "tests/fixtures/test-image.png";
            await rewardsPage.uploadImage(testImagePath);

            // Verify preview is visible
            await expect(rewardsPage.imagePreview).toBeVisible();

            // Remove image
            await rewardsPage.removeUploadedImage();

            // Verify preview is hidden
            await expect(rewardsPage.imagePreview).not.toBeVisible();

            // Verify upload button is visible again
            await expect(rewardsPage.uploadButton).toBeVisible();
        });

        test("should toggle between image upload and URL input", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Toggle Input Test");
            await rewardsPage.karmaCostInput.fill("50");

            // Initially, both upload button and URL input should be visible
            await expect(rewardsPage.uploadButton).toBeVisible();
            await expect(rewardsPage.imageUrlInput).toBeVisible();

            // Upload an image
            const testImagePath = "tests/fixtures/test-image.png";
            await rewardsPage.uploadImage(testImagePath);

            // Preview should be visible, URL input should be disabled or hidden
            await expect(rewardsPage.imagePreview).toBeVisible();

            // Remove the uploaded image
            await rewardsPage.removeUploadedImage();

            // URL input should be available again
            await expect(rewardsPage.imageUrlInput).toBeVisible();
            await expect(rewardsPage.imageUrlInput).toBeEnabled();

            // Now enter a URL instead
            await rewardsPage.imageUrlInput.fill("https://example.com/reward.jpg");

            // Submit the form
            await rewardsPage.dialogSubmitButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "hidden" });

            // Verify reward was created
            await expect(rewardsPage.rewardCards).toHaveCount(1);
        });

        test.skip("should display uploaded image in reward card", async ({ page }) => {
            await rewardsPage.createRewardButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "visible" });

            await rewardsPage.nameInput.fill("Display Image Test");
            await rewardsPage.karmaCostInput.fill("50");

            // Upload image
            const testImagePath = "tests/fixtures/test-image.png";
            await rewardsPage.uploadImage(testImagePath);

            // Submit form
            await rewardsPage.dialogSubmitButton.click();
            await rewardsPage.rewardDialog.waitFor({ state: "hidden" });

            // Verify reward card has image
            const rewardCard = rewardsPage.rewardCards.first();
            await expect(rewardCard).toBeVisible();

            // Check that image element exists and is visible
            const image = rewardCard.locator("img").first();
            await expect(image).toBeVisible();

            // Wait for image to load and verify it loaded successfully (not broken)
            await image.evaluate((img: HTMLImageElement) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = () => resolve(undefined);
                    img.onerror = () => resolve(undefined);
                });
            });

            const naturalWidth = await image.evaluate((img: HTMLImageElement) => img.naturalWidth);
            expect(naturalWidth).toBeGreaterThan(0);
        });
    });
});
