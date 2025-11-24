import { expect, test } from "@playwright/test";
import { createFamilyWithMembers, switchUser } from "../helpers/auth";
import { ContributionGoalPage } from "../pages/contribution-goal.page";
import { waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

test.describe("Contribution Goals", () => {
    let contributionGoalPage: ContributionGoalPage;
    let parentUserId: string;
    let childUserId: string;
    let familyId: string;
    let parentSessionToken: string;
    let parentUser: any;
    let childUser: any;

    test.beforeEach(async ({ page }) => {
        contributionGoalPage = new ContributionGoalPage(page);

        // Create a family with parent and child
        const familySetup = await createFamilyWithMembers(
            page,
            {
                name: "Parent User",
                familyName: "Test Family",
            },
            {
                name: "Child User",
                birthdate: "2010-01-15",
            }
        );

        parentUser = familySetup.parentUser;
        childUser = familySetup.childUser;
        parentUserId = familySetup.parentUser.userId;
        parentSessionToken = familySetup.parentUser.sessionToken;
        childUserId = familySetup.childMemberId;
        familyId = familySetup.familyId;

        // Switch to parent user (createFamilyWithMembers leaves us as child)
        await switchUser(page, parentUser);
    });

    test.describe("Parent creates contribution goal for child", () => {
        test("should create a contribution goal successfully", async ({ page }) => {
            // Navigate to child's member detail page
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            // Wait for the contribution goal tab to be visible (indicates parent role is loaded)
            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });

            // Click on contribution goal tab
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            // Verify empty state is visible
            await expect(contributionGoalPage.emptyGoalState).toBeVisible();
            await expect(contributionGoalPage.setGoalButton).toBeVisible();

            // Create a new contribution goal
            await contributionGoalPage.createGoal(
                "Weekly Chores",
                "Complete all assigned chores this week",
                100
            );

            // Wait for goal to be created
            await contributionGoalPage.waitForGoalToLoad();

            // Verify goal card is now visible
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible();
            await expect(contributionGoalPage.emptyGoalState).not.toBeVisible();

            // Verify goal details
            const goalTitle = await contributionGoalPage.goalTitle.textContent();
            expect(goalTitle).toContain("Weekly Chores");

            // Verify current karma equals max karma (no deductions yet)
            const currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(100);

            // Verify progress is at 100%
            const progressPercentage = await contributionGoalPage.getProgressPercentage();
            expect(progressPercentage).toBe(100);

            // Verify no deductions yet
            const deductionsCount = await contributionGoalPage.getDeductionsCount();
            expect(deductionsCount).toBe(0);

            // Verify quick deduction form is visible (parent only)
            await expect(contributionGoalPage.quickDeductionForm).toBeVisible();
            await expect(contributionGoalPage.deductionReasonInput).toBeVisible();
            await expect(contributionGoalPage.deductionAmountSelect).toBeVisible();
            await expect(contributionGoalPage.deductButton).toBeVisible();

        });

        test("should create goal with minimum required fields", async ({ page }) => {
            // Navigate to child's member detail page
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            // Wait for the contribution goal tab to be visible
            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });

            // Click on contribution goal tab
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            // Create goal with just title and maxKarma (description is optional)
            await contributionGoalPage.createGoal("Minimal Goal", "", 50);
            await contributionGoalPage.waitForGoalToLoad();

            // Verify goal was created
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible();

            const goalTitle = await contributionGoalPage.goalTitle.textContent();
            expect(goalTitle).toContain("Minimal Goal");

            const currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(50);
        });

        test("should create goal with minimum and maximum karma values", async ({ page }) => {
            // Navigate to child's member detail page
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            // Wait for the contribution goal tab to be visible
            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });

            // Click on contribution goal tab
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            // Create goal with minimum karma value (1)
            await contributionGoalPage.createGoal("Min Karma Goal", "Testing minimum", 1);
            await contributionGoalPage.waitForGoalToLoad();

            // Verify goal was created with minimum karma
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible();
            let currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(1);

            // Delete the goal
            await contributionGoalPage.deleteGoal();

            // Create goal with maximum karma value (10000)
            await contributionGoalPage.createGoal("Max Karma Goal", "Testing maximum", 10000);
            await contributionGoalPage.waitForGoalToLoad();

            // Verify goal was created with maximum karma
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible();
            currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(10000);
        });

        test("should create a recurring contribution goal", async ({ page }) => {
            // Navigate to child's member detail page
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            // Create goal with recurring enabled
            await contributionGoalPage.createGoal(
                "Recurring Goal",
                "Auto repeat weekly",
                120,
                true
            );
            await contributionGoalPage.waitForGoalToLoad();

            // Open edit dialog to verify recurring toggle is on
            await contributionGoalPage.goalCardActionsButton.click();
            await contributionGoalPage.editGoalButton.click();
            await contributionGoalPage.editGoalDialog.waitFor({ state: "visible" });

            await expect(contributionGoalPage.goalRecurringToggle).toBeChecked();

            // Close dialog
            await contributionGoalPage.cancelButton.click();
            await contributionGoalPage.editGoalDialog.waitFor({ state: "hidden" });
        });

        test("should prevent creating duplicate goal for same member", async ({ page }) => {
            // Navigate to child's member detail page
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            // Wait for the contribution goal tab to be visible
            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });

            // Click on contribution goal tab
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            // Create first goal
            await contributionGoalPage.createGoal(
                "First Goal",
                "Description",
                100
            );
            await contributionGoalPage.waitForGoalToLoad();

            // Verify goal was created
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible();

            // Try to create another goal (set goal button should not be visible)
            await expect(contributionGoalPage.setGoalButton).not.toBeVisible();

            // The only way to change the goal is via edit button (in menu)
            await expect(contributionGoalPage.goalCardActionsButton).toBeVisible();
        });

        test("should display goal on dashboard", async ({ page }) => {
            // First create a goal via API for the parent user
            const createGoalResponse = await fetch(
                `${API_URL}/v1/families/${familyId}/contribution-goals`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${parentSessionToken}`,
                    },
                    body: JSON.stringify({
                        memberId: parentUserId,
                        title: "Parent's Weekly Goal",
                        description: "Stay organized",
                        maxKarma: 150,
                    }),
                }
            );

            if (!createGoalResponse.ok) {
                throw new Error(`Failed to create goal: ${createGoalResponse.status}`);
            }

            // Navigate to dashboard
            await contributionGoalPage.gotoDashboard();
            await waitForPageLoad(page);

            // Verify goal is displayed on dashboard
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible({ timeout: 10000 });

            const goalTitle = await contributionGoalPage.goalTitle.textContent();
            expect(goalTitle).toContain("Parent's Weekly Goal");

            const currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(150);
        });
    });

    test.describe("Child views contribution goal on dashboard", () => {
        test("should display child's goal on their dashboard", async ({ page }) => {
            // Create a goal for the child as parent
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal(
                "Child's Weekly Goal",
                "Complete homework and chores",
                75
            );
            await contributionGoalPage.waitForGoalToLoad();

            // Switch to child user
            await switchUser(page, childUser);

            // Navigate to dashboard as child
            await contributionGoalPage.gotoDashboard();
            await waitForPageLoad(page);

            // Verify goal is displayed on child's dashboard
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible({ timeout: 10000 });

            const goalTitle = await contributionGoalPage.goalTitle.textContent();
            expect(goalTitle).toContain("Child's Weekly Goal");

            // Verify child cannot see quick deduction form (child role)
            await expect(contributionGoalPage.quickDeductionForm).not.toBeVisible();
        });
    });

    test.describe("Parent adds deduction to contribution goal", () => {
        test("should add a deduction successfully", async ({ page }) => {
            // Create a goal first
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal("Weekly Goal", "Test deductions", 100);
            await contributionGoalPage.waitForGoalToLoad();

            // Add a deduction
            await contributionGoalPage.addDeduction("Forgot to clean room", "5");

            // Wait for deduction to be processed
            await contributionGoalPage.waitForGoalToLoad();

            // Verify current karma decreased
            const currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(95);

            // Verify progress percentage updated
            const progressPercentage = await contributionGoalPage.getProgressPercentage();
            expect(progressPercentage).toBe(95);
        });
    });

    test.describe("Deduction appears in deductions list", () => {
        test("should display deduction in the list", async ({ page }) => {
            // Create a goal
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal("Weekly Goal", "Test deductions list", 100);
            await contributionGoalPage.waitForGoalToLoad();

            // Add a deduction
            await contributionGoalPage.addDeduction("Late for dinner", "3");
            await contributionGoalPage.waitForGoalToLoad();

            // Verify deduction appears in list
            const deductionsCount = await contributionGoalPage.getDeductionsCount();
            expect(deductionsCount).toBe(1);

            // Verify deductions list is visible
            await expect(contributionGoalPage.deductionsList).toBeVisible();
        });
    });

    test.describe("Current karma updates correctly after deduction", () => {
        test("should update karma after multiple deductions", async ({ page }) => {
            // Create a goal
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal("Weekly Goal", "Multiple deductions test", 100);
            await contributionGoalPage.waitForGoalToLoad();

            // Add first deduction
            await contributionGoalPage.addDeduction("First issue", "10");
            await contributionGoalPage.waitForGoalToLoad();

            let currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(90);

            // Add second deduction
            await contributionGoalPage.addDeduction("Second issue", "5");
            await contributionGoalPage.waitForGoalToLoad();

            currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(85);

            // Add third deduction
            await contributionGoalPage.addDeduction("Third issue", "5");
            await contributionGoalPage.waitForGoalToLoad();

            currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(80);
        });
    });

    test.describe("Parent edits contribution goal", () => {
        test("should edit goal title, description, and maxKarma", async ({ page }) => {
            // Create a goal
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal("Original Title", "Original description", 100);
            await contributionGoalPage.waitForGoalToLoad();

            // Edit the goal
            await contributionGoalPage.editGoal("Updated Title", "Updated description", 150);
            await contributionGoalPage.waitForGoalToLoad();

            // Verify changes
            const goalTitle = await contributionGoalPage.goalTitle.textContent();
            expect(goalTitle).toContain("Updated Title");

            const currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(150);
        });
    });

    test.describe("Parent deletes contribution goal", () => {
        test("should delete goal successfully", async ({ page }) => {
            // Create a goal
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal("Goal to Delete", "This will be deleted", 100);
            await contributionGoalPage.waitForGoalToLoad();

            // Verify goal exists
            await expect(contributionGoalPage.contributionGoalCard).toBeVisible();

            // Delete the goal
            await contributionGoalPage.deleteGoal();
            await contributionGoalPage.waitForGoalToLoad();

            // Verify empty state is shown
            await expect(contributionGoalPage.emptyGoalState).toBeVisible();
            await expect(contributionGoalPage.contributionGoalCard).not.toBeVisible();
        });
    });

    test.describe("Progress percentage updates after deduction", () => {
        test("should show correct percentage after deductions", async ({ page }) => {
            // Create a goal
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal("Progress Test", "Testing progress", 100);
            await contributionGoalPage.waitForGoalToLoad();

            // Initial progress should be 100%
            let progressPercentage = await contributionGoalPage.getProgressPercentage();
            expect(progressPercentage).toBe(100);

            // Add 10% deduction
            await contributionGoalPage.addDeduction("First deduction", "10");
            await contributionGoalPage.waitForGoalToLoad();

            progressPercentage = await contributionGoalPage.getProgressPercentage();
            expect(progressPercentage).toBe(90);

            // Add another 10% deduction
            await contributionGoalPage.addDeduction("Second deduction", "10");
            await contributionGoalPage.waitForGoalToLoad();

            progressPercentage = await contributionGoalPage.getProgressPercentage();
            expect(progressPercentage).toBe(80);
        });
    });

    test.describe("Multiple deductions display correctly", () => {
        test("should show latest deduction and update karma correctly", async ({ page }) => {
            // Create a goal
            await contributionGoalPage.gotoMemberDetail(childUserId);
            await waitForPageLoad(page);

            await page.getByTestId("contribution-goal-tab").waitFor({ state: "visible", timeout: 10000 });
            await page.getByTestId("contribution-goal-tab").click();
            await waitForPageLoad(page);

            await contributionGoalPage.createGoal("Multiple Deductions", "Testing list", 100);
            await contributionGoalPage.waitForGoalToLoad();

            // Add multiple deductions
            await contributionGoalPage.addDeduction("First deduction", "5");
            await contributionGoalPage.waitForGoalToLoad();

            await contributionGoalPage.addDeduction("Second deduction", "10");
            await contributionGoalPage.waitForGoalToLoad();

            await contributionGoalPage.addDeduction("Third deduction", "3");
            await contributionGoalPage.waitForGoalToLoad();

            // Verify latest deduction is displayed (UI shows only 1 by default)
            const deductionsCount = await contributionGoalPage.getDeductionsCount();
            expect(deductionsCount).toBe(1);

            // Verify deductions summary shows total karma deducted
            const deductionsSummary = await contributionGoalPage.deductionsSummary.textContent();
            expect(deductionsSummary).toContain("18"); // 5 + 10 + 3 = 18 karma deducted

            // Verify final karma reflects all deductions
            const currentKarma = await contributionGoalPage.getCurrentKarma();
            expect(currentKarma).toBe(82);
        });
    });
});
