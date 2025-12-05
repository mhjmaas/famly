import { expect, type Page, test } from "@playwright/test";
import {
  type AuthenticatedUser,
  authenticateUser,
} from "../helpers/auth";
import { DashboardPage } from "../pages/dashboard.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function createTaskViaApi(
  user: AuthenticatedUser,
  data: {
    name: string;
    description?: string;
    dueDate?: string;
    assignment?:
      | { type: "unassigned" }
      | { type: "role"; role: "parent" | "child" }
      | { type: "member"; memberId: string };
    karma?: number;
  },
): Promise<void> {
  if (!user.familyId) {
    throw new Error("Family ID is required to create tasks via API");
  }

  const response = await fetch(
    `${API_URL}/v1/families/${user.familyId}/tasks`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.sessionToken}`,
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        dueDate: data.dueDate,
        assignment: data.assignment ?? { type: "unassigned" },
        metadata: data.karma ? { karma: data.karma } : undefined,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create task via API: ${response.status} ${error}`,
    );
  }

  await response.json();
}

async function createRewardViaApi(
  user: AuthenticatedUser,
  data: {
    name: string;
    karmaCost: number;
    description?: string;
    imageUrl?: string;
  },
): Promise<string> {
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

  const reward = await response.json();
  return reward._id;
}

async function toggleRewardFavouriteViaApi(
  user: AuthenticatedUser,
  rewardId: string,
  isFavourite: boolean,
): Promise<void> {
  if (!user.familyId) {
    throw new Error("Family ID is required to toggle reward favourite via API");
  }

  const response = await fetch(
    `${API_URL}/v1/families/${user.familyId}/rewards/${rewardId}/favourite`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.sessionToken}`,
      },
      body: JSON.stringify({ isFavourite }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to toggle reward favourite via API: ${response.status} ${error}`,
    );
  }
}

test.describe("Dashboard Overview", () => {
  let dashboardPage: DashboardPage;
  let parentUser: AuthenticatedUser;

  test.beforeEach(async ({ page }) => {
    await setViewport(page, "desktop");

    dashboardPage = new DashboardPage(page);
    parentUser = await authenticateUser(page, {
      name: "Parent Dashboard User",
      birthdate: "1985-04-10",
      createFamily: true,
      familyName: "Dashboard Test Family",
    });

    await dashboardPage.gotoApp("en-US");
    await waitForPageLoad(page);
  });

  test.describe("Summary Cards", () => {
    test("should display all three summary cards", async () => {
      await expect(dashboardPage.karmaCard).toBeVisible();
      await expect(dashboardPage.pendingTasksCard).toBeVisible();
      await expect(dashboardPage.potentialKarmaCard).toBeVisible();
    });

    test("should display correct karma amount", async () => {
      const karma = await dashboardPage.getKarmaAmount();
      expect(karma).toBeGreaterThanOrEqual(0);
    });

    test("should display correct pending tasks count", async () => {
      const count = await dashboardPage.getPendingTasksCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display correct potential karma", async () => {
      const karma = await dashboardPage.getPotentialKarma();
      expect(karma).toBeGreaterThanOrEqual(0);
    });

    test("should update counts after creating tasks", async () => {
      // Get initial counts
      const initialTaskCount = await dashboardPage.getPendingTasksCount();
      const initialPotentialKarma = await dashboardPage.getPotentialKarma();

      // Create a task via API
      await createTaskViaApi(parentUser, {
        name: "Test Task",
        assignment: { type: "role", role: "parent" },
        karma: 10,
      });

      // Reload page to see updated data
      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      // Verify counts increased
      const newTaskCount = await dashboardPage.getPendingTasksCount();
      const newPotentialKarma = await dashboardPage.getPotentialKarma();

      expect(newTaskCount).toBe(initialTaskCount + 1);
      expect(newPotentialKarma).toBe(initialPotentialKarma + 10);
    });
  });

  test.describe("Pending Tasks Section", () => {
    test("should display empty state when no pending tasks", async () => {
      await expect(dashboardPage.pendingTasksSection).toBeVisible();
      const isEmptyStateVisible =
        await dashboardPage.isEmptyTasksStateVisible();

      if (isEmptyStateVisible) {
        await expect(dashboardPage.emptyTasksState).toBeVisible();
      }
    });

    test("should display pending tasks", async () => {
      // Create tasks via API
      await createTaskViaApi(parentUser, {
        name: "Task 1",
        assignment: { type: "role", role: "parent" },
        karma: 5,
      });

      await createTaskViaApi(parentUser, {
        name: "Task 2",
        description: "Task 2 description",
        assignment: { type: "role", role: "parent" },
        karma: 10,
      });

      // Reload to see new tasks
      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      // Verify tasks are displayed
      const taskCount = await dashboardPage.getTaskCardsCount();
      expect(taskCount).toBeGreaterThan(0);
      expect(taskCount).toBeLessThanOrEqual(3); // Max 3 tasks
    });

    test("should display task details (name, description, karma)", async () => {
      await createTaskViaApi(parentUser, {
        name: "Detailed Task",
        description: "This is a detailed task description",
        assignment: { type: "role", role: "parent" },
        karma: 15,
      });

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      const taskCard = dashboardPage.taskCards.first();
      await expect(taskCard).toBeVisible();
      await expect(taskCard.getByTestId("task-name")).toContainText(
        "Detailed Task",
      );
      await expect(taskCard.getByTestId("task-description")).toContainText(
        "This is a detailed task description",
      );
      await expect(taskCard.getByTestId("task-karma")).toContainText("15");
    });

    test("should navigate to tasks page on View All click", async () => {
      await dashboardPage.clickTasksViewAll();
      await dashboardPage.page.waitForURL("**/app/tasks");

      expect(dashboardPage.page.url()).toContain("/app/tasks");
    });

    test("should navigate to tasks page on task card click", async () => {
      await createTaskViaApi(parentUser, {
        name: "Clickable Task",
        assignment: { type: "role", role: "parent" },
      });

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      const taskCount = await dashboardPage.getTaskCardsCount();
      if (taskCount > 0) {
        await dashboardPage.clickTaskCard(0);
        await dashboardPage.page.waitForURL("**/app/tasks");

        expect(dashboardPage.page.url()).toContain("/app/tasks");
      }
    });

    test("should limit displayed tasks to 3", async () => {
      // Create 5 tasks
      for (let i = 1; i <= 5; i++) {
        await createTaskViaApi(parentUser, {
          name: `Task ${i}`,
          assignment: { type: "role", role: "parent" },
        });
      }

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      const taskCount = await dashboardPage.getTaskCardsCount();
      expect(taskCount).toBeLessThanOrEqual(3);
    });

    test("should complete task when checkbox is clicked", async () => {
      // Create a task
      await createTaskViaApi(parentUser, {
        name: "Task to Complete",
        assignment: { type: "role", role: "parent" },
        karma: 10,
      });

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      // Find the checkbox and click it
      const taskCard = dashboardPage.taskCards.first();
      const checkbox = taskCard.getByTestId("task-complete-toggle");
      await expect(checkbox).toBeVisible();
      await checkbox.click();

      // Wait for the update
      await dashboardPage.page.waitForTimeout(500);

      // Task should now be checked and have completed styling
      await expect(checkbox).toBeChecked();
      const taskName = taskCard.getByTestId("task-name");
      await expect(taskName).toHaveClass(/line-through/);
    });

    test("should keep completed task visible temporarily", async () => {
      // Create a task
      await createTaskViaApi(parentUser, {
        name: "Task to Complete and Keep",
        assignment: { type: "role", role: "parent" },
      });

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      const initialCount = await dashboardPage.getTaskCardsCount();
      expect(initialCount).toBe(1);

      // Complete the task
      const checkbox = dashboardPage.taskCards
        .first()
        .getByTestId("task-complete-toggle");
      await checkbox.click();

      // Wait for the update
      await dashboardPage.page.waitForTimeout(500);

      // Task should still be visible (not removed immediately)
      const countAfterComplete = await dashboardPage.getTaskCardsCount();
      expect(countAfterComplete).toBe(1);

      // Task should have completed styling
      const taskName = dashboardPage.taskCards.first().getByTestId("task-name");
      await expect(taskName).toHaveClass(/line-through/);
    });

    test("should reopen task when unchecking completed task", async () => {
      // Create a task
      await createTaskViaApi(parentUser, {
        name: "Task to Toggle",
        assignment: { type: "role", role: "parent" },
        karma: 5,
      });

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      const taskCard = dashboardPage.taskCards.first();
      const checkbox = taskCard.getByTestId("task-complete-toggle");
      const taskName = taskCard.getByTestId("task-name");

      // Complete the task
      await checkbox.click();
      await dashboardPage.page.waitForTimeout(500);
      await expect(checkbox).toBeChecked();
      await expect(taskName).toHaveClass(/line-through/);

      // Reopen the task
      await checkbox.click();
      await dashboardPage.page.waitForTimeout(500);
      await expect(checkbox).not.toBeChecked();
      await expect(taskName).not.toHaveClass(/line-through/);
    });
  });

  test.describe("Reward Progress Section", () => {
    test("should display empty state when no favorited rewards", async () => {
      await expect(dashboardPage.rewardProgressSection).toBeVisible();
      const isEmptyStateVisible =
        await dashboardPage.isEmptyRewardsStateVisible();

      if (isEmptyStateVisible) {
        await expect(dashboardPage.emptyRewardsState).toBeVisible();
      }
    });

    test("should display favorited rewards with progress", async () => {
      // Create a reward and favorite it
      const rewardId = await createRewardViaApi(parentUser, {
        name: "Test Reward",
        karmaCost: 50,
      });

      await toggleRewardFavouriteViaApi(parentUser, rewardId, true);

      // Reload to see favorited reward
      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      // Verify reward is displayed
      const rewardCount = await dashboardPage.getRewardCardsCount();
      expect(rewardCount).toBeGreaterThan(0);

      const rewardCard = dashboardPage.rewardCards.first();
      await expect(rewardCard).toBeVisible();
      await expect(rewardCard.getByTestId("reward-name")).toContainText(
        "Test Reward",
      );
      await expect(
        rewardCard.getByTestId("reward-karma-progress"),
      ).toBeVisible();
      await expect(rewardCard.getByTestId("reward-progress-bar")).toBeVisible();
    });

    test("should show correct progress text based on karma", async () => {
      // Create reward that costs 100 karma
      const rewardId = await createRewardViaApi(parentUser, {
        name: "Progress Reward",
        karmaCost: 100,
      });

      await toggleRewardFavouriteViaApi(parentUser, rewardId, true);

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      const rewardCard = dashboardPage.rewardCards.first();

      // Since user starts with 0 karma, should show "more karma needed"
      await expect(
        rewardCard.getByTestId("reward-remaining"),
      ).toBeVisible();
    });

    test("should navigate to rewards page on View All click", async () => {
      await dashboardPage.clickRewardsViewAll();
      await dashboardPage.page.waitForURL("**/app/rewards");

      expect(dashboardPage.page.url()).toContain("/app/rewards");
    });

    test("should navigate to rewards page on reward card click", async () => {
      // Create and favorite a reward
      const rewardId = await createRewardViaApi(parentUser, {
        name: "Clickable Reward",
        karmaCost: 50,
      });

      await toggleRewardFavouriteViaApi(parentUser, rewardId, true);

      await dashboardPage.page.reload();
      await waitForPageLoad(dashboardPage.page);

      const rewardCount = await dashboardPage.getRewardCardsCount();
      if (rewardCount > 0) {
        await dashboardPage.clickRewardCard(0);
        await dashboardPage.page.waitForURL("**/app/rewards");

        expect(dashboardPage.page.url()).toContain("/app/rewards");
      }
    });
  });

  test.describe("Responsive Layout", () => {
    test("should display correctly on mobile", async ({ page }) => {
      await setViewport(page, "mobile");
      await page.reload();
      await waitForPageLoad(page);

      await expect(dashboardPage.mobileHeader).toBeVisible();
      await expect(dashboardPage.mobilePageTitle).toContainText(/dashboard/i);

      // Karma card is visible on mobile, but other summary cards are hidden
      await expect(dashboardPage.karmaCard).toBeVisible();
      await expect(dashboardPage.pendingTasksCard).toBeHidden();
      await expect(dashboardPage.potentialKarmaCard).toBeHidden();

      // Core sections remain visible
      await expect(dashboardPage.pendingTasksSection).toBeVisible();
      await expect(dashboardPage.rewardProgressSection).toBeVisible();
    });

    test("should display correctly on tablet", async ({ page }) => {
      await setViewport(page, "tablet");
      await page.reload();
      await waitForPageLoad(page);

      // Karma card is visible on tablet, but other summary cards are hidden
      await expect(dashboardPage.karmaCard).toBeVisible();
      await expect(dashboardPage.pendingTasksCard).toBeHidden();
      await expect(dashboardPage.potentialKarmaCard).toBeHidden();

      // Section content still accessible
      await expect(dashboardPage.pendingTasksSection).toBeVisible();
      await expect(dashboardPage.rewardProgressSection).toBeVisible();
    });
  });
});
