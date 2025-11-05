import { expect, test } from "@playwright/test";
import { authenticateUser } from "../helpers/auth";

test.describe("Tasks Page", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate and set up test data
    await authenticateUser(page, { createFamily: true });
  });

  test("should display tasks page with empty state", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Check page title
    await expect(page.locator("h1")).toContainText("Tasks");

    // Check empty state
    await expect(page.locator("text=No tasks yet")).toBeVisible();
    await expect(page.locator('button:has-text("Create Task")')).toBeVisible();
  });

  test("should open create task dialog", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Click create task button
    await page.locator('button:has-text("New Task")').click();

    // Check dialog is open
    await expect(page.locator("text=Create New Task")).toBeVisible();
    await expect(page.locator('input[placeholder*="Task Name"]')).toBeVisible();
  });

  test("should create a single task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Open create dialog
    await page.locator('button:has-text("New Task")').click();

    // Fill in task details
    await page.locator('input[placeholder*="Task Name"]').fill("Test Task");
    await page.locator('button:has-text("Create Task")').click();

    // Wait for task to appear
    await expect(page.locator("text=Test Task")).toBeVisible();
  });

  test("should add description to task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Open create dialog
    await page.locator('button:has-text("New Task")').click();

    // Fill task name
    await page.locator('input[placeholder*="Task Name"]').fill("Task with Description");

    // Add description
    await page.locator('button:has-text("Description")').click();
    await page.locator('textarea[placeholder*="Add any additional details"]').fill("This is a test description");

    // Create task
    await page.locator('button:has-text("Create Task")').click();

    // Verify task appears with description
    await expect(page.locator("text=Task with Description")).toBeVisible();
    await expect(page.locator("text=This is a test description")).toBeVisible();
  });

  test("should add due date to task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Open create dialog
    await page.locator('button:has-text("New Task")').click();

    // Fill task name
    await page.locator('input[placeholder*="Task Name"]').fill("Task with Due Date");

    // Add due date
    await page.locator('button:has-text("Due")').click();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];
    await page.locator('input[type="date"]').fill(dateString);

    // Create task
    await page.locator('button:has-text("Create Task")').click();

    // Verify task appears with due date badge
    await expect(page.locator("text=Task with Due Date")).toBeVisible();
  });

  test("should complete a task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Create a task first
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Task to Complete");
    await page.locator('button:has-text("Create Task")').click();

    // Wait for task to appear
    await expect(page.locator("text=Task to Complete")).toBeVisible();

    // Complete the task by clicking checkbox
    await page.locator('input[type="checkbox"]').first().click();

    // Verify task is marked as completed
    await expect(page.locator("text=Task completed")).toBeVisible();
  });

  test("should edit a task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Create a task first
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Original Task Name");
    await page.locator('button:has-text("Create Task")').click();

    // Wait for task to appear
    await expect(page.locator("text=Original Task Name")).toBeVisible();

    // Open task menu and click edit
    await page.locator('button[aria-label*="More"]').first().click();
    await page.locator("text=Edit").click();

    // Update task name
    await page.locator('input[placeholder*="Task Name"]').fill("Updated Task Name");
    await page.locator('button:has-text("Update Task")').click();

    // Verify task is updated
    await expect(page.locator("text=Updated Task Name")).toBeVisible();
  });

  test("should delete a task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Create a task first
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Task to Delete");
    await page.locator('button:has-text("Create Task")').click();

    // Wait for task to appear
    await expect(page.locator("text=Task to Delete")).toBeVisible();

    // Open task menu and click delete
    await page.locator('button[aria-label*="More"]').first().click();
    await page.locator("text=Delete").click();

    // Confirm deletion
    await page.locator('button:has-text("Delete This Task Only")').click();

    // Verify task is deleted
    await expect(page.locator("text=Task to Delete")).not.toBeVisible();
  });

  test("should filter tasks by status", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Create a completed task
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Completed Task");
    await page.locator('button:has-text("Create Task")').click();
    await expect(page.locator("text=Completed Task")).toBeVisible();

    // Complete the task
    await page.locator('input[type="checkbox"]').first().click();

    // Create an active task
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Active Task");
    await page.locator('button:has-text("Create Task")').click();

    // Filter by active
    await page.locator('button:has-text("Active")').click();

    // Verify only active task is shown
    await expect(page.locator("text=Active Task")).toBeVisible();
    await expect(page.locator("text=Completed Task")).not.toBeVisible();

    // Filter by completed
    await page.locator('button:has-text("Completed")').click();

    // Verify only completed task is shown
    await expect(page.locator("text=Completed Task")).toBeVisible();
    await expect(page.locator("text=Active Task")).not.toBeVisible();
  });

  test("should create a recurring task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Open create dialog
    await page.locator('button:has-text("New Task")').click();

    // Switch to recurring tab
    await page.locator('button:has-text("Recurring Task")').click();

    // Fill task name
    await page.locator('input[placeholder*="Task Name"]').fill("Weekly Chore");

    // Select days
    await page.locator('button:has-text("Mon")').click();
    await page.locator('button:has-text("Wed")').click();
    await page.locator('button:has-text("Fri")').click();

    // Create task
    await page.locator('button:has-text("Create Task")').click();

    // Verify recurring task appears
    await expect(page.locator("text=Weekly Chore")).toBeVisible();
    await expect(page.locator("text=Recurring")).toBeVisible();
  });

  test("should claim an unassigned task", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Create an unassigned task
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Unassigned Task");
    await page.locator('button:has-text("Create Task")').click();

    // Wait for task to appear
    await expect(page.locator("text=Unassigned Task")).toBeVisible();

    // Claim the task
    await page.locator('button:has-text("Claim Task")').click();

    // Verify task is claimed
    await expect(page.locator("text=You've claimed")).toBeVisible();
  });

  test("should display task with karma reward", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Create a task with karma
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Reward Task");
    await page.locator('button:has-text("Karma")').click();
    await page.locator('input[type="number"]').fill("25");
    await page.locator('button:has-text("Create Task")').click();

    // Verify karma is displayed
    await expect(page.locator("text=Reward Task")).toBeVisible();
    await expect(page.locator("text=25")).toBeVisible();

    // Complete task and verify karma message
    await page.locator('input[type="checkbox"]').first().click();
    await expect(page.locator("text=You earned 25 karma points")).toBeVisible();
  });

  test("should handle task creation errors gracefully", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Open create dialog
    await page.locator('button:has-text("New Task")').click();

    // Try to create task without name
    await page.locator('button:has-text("Create Task")').click();

    // Verify error message
    await expect(page.locator("text=required")).toBeVisible();

    // Dialog should still be open
    await expect(page.locator("text=Create New Task")).toBeVisible();
  });

  test("should persist task data after page reload", async ({ page }) => {
    await page.goto("/en/app/tasks");

    // Create a task
    await page.locator('button:has-text("New Task")').click();
    await page.locator('input[placeholder*="Task Name"]').fill("Persistent Task");
    await page.locator('button:has-text("Create Task")').click();

    // Wait for task to appear
    await expect(page.locator("text=Persistent Task")).toBeVisible();

    // Reload page
    await page.reload();

    // Verify task still appears
    await expect(page.locator("text=Persistent Task")).toBeVisible();
  });
});
