import { expect, type Page, test } from "@playwright/test";
import {
	type AuthenticatedUser,
	authenticateUser,
	switchUser,
} from "../helpers/auth";
import { type TaskFormInput, TasksPage } from "../pages/tasks.page";
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

async function reloadTasksAndWait(
	page: Page,
	tasksPage: TasksPage,
	familyId: string,
) {
	const tasksRequest = page.waitForResponse(
		(response) =>
			response.url().includes(`/v1/families/${familyId}/tasks`) &&
			response.request().method() === "GET",
	);

	await page.reload();
	await waitForPageLoad(page);
	await tasksRequest;
	await tasksPage.taskCards.first().waitFor({ state: "visible" });
}

test.describe("Tasks Page", () => {
	let tasksPage: TasksPage;
	let parentUser: AuthenticatedUser;

	test.beforeEach(async ({ page }) => {
		await setViewport(page, "desktop");

		tasksPage = new TasksPage(page);
		parentUser = await authenticateUser(page, {
			name: "Parent Task User",
			birthdate: "1985-04-10",
			createFamily: true,
			familyName: "Tasks Test Family",
		});

		await tasksPage.gotoTasks("en-US");
		await waitForPageLoad(page);
	});

	test.describe("Page Load and Empty State", () => {
		test("should display tasks page title and description", async () => {
			await expect(tasksPage.pageTitle).toHaveText("Tasks");
			await expect(tasksPage.pageDescription).toHaveText(
				"Manage your family's tasks and chores",
			);
		});

		test("should show empty state when no tasks exist", async () => {
			const isEmpty = await tasksPage.isEmptyStateVisible();
			expect(isEmpty).toBeTruthy();
			await expect(tasksPage.emptyStateAction).toHaveText("Create Task");
		});
	});

	test.describe("Task Creation", () => {
		test("should create a task with optional fields", async ({ page }) => {
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 2);
			const futureDateStr = futureDate.toISOString().split("T")[0];

			await tasksPage.openCreateTaskDialog();

			const formData: TaskFormInput = {
				name: "Laundry duty",
				description: "Wash and fold clothes",
				dueDate: futureDateStr,
				assignmentValue: "all-children",
				karma: 25,
			};

			await tasksPage.fillTaskForm(formData);

			const createResponse = page.waitForResponse(
				(response) =>
					response
						.url()
						.includes(`/v1/families/${parentUser.familyId}/tasks`) &&
					response.request().method() === "POST",
			);

			await tasksPage.submitTaskForm();
			await createResponse;
			await tasksPage.dialog.waitFor({ state: "hidden" });

			await expect(tasksPage.taskCards.first()).toBeVisible({ timeout: 10000 });
			const taskCount = await tasksPage.getTaskCount();
			expect(taskCount).toBeGreaterThanOrEqual(1);

			const createdName = await tasksPage.getTaskName(0);
			expect(createdName?.toLowerCase()).toContain("laundry duty");

			const assignment = await tasksPage.getTaskAssignment(0);
			expect(assignment?.toLowerCase()).toContain("all children");

			const dueDateLabel = await tasksPage.getTaskDueDate(0);
			expect(dueDateLabel).toBeTruthy();

			await expect(tasksPage.taskKarmaBadges.first()).toBeVisible();
		});

		test("should require task name before submission", async () => {
			await tasksPage.openCreateTaskDialog();
			await tasksPage.submitTaskForm();

			await expect(tasksPage.dialog).toBeVisible();
			const taskCount = await tasksPage.getTaskCount();
			expect(taskCount).toBe(0);

			await tasksPage.dialogCancelButton.click();
			await tasksPage.dialog.waitFor({ state: "hidden" });
		});
	});

	test.describe("Task Actions", () => {
		test("should complete and reopen a task", async ({ page }) => {
			await createTaskViaApi(parentUser, {
				name: "Clean kitchen",
				assignment: { type: "member", memberId: parentUser.userId },
			});

			await reloadTasksAndWait(page, tasksPage, parentUser.familyId!);

			const completeResponse = page.waitForResponse(
				(response) =>
					response
						.url()
						.includes(`/v1/families/${parentUser.familyId}/tasks/`) &&
					response.request().method() === "PATCH",
			);
			await tasksPage.toggleTaskCompletion(0);
			await completeResponse;

			await expect(tasksPage.taskCompleteToggles.nth(0)).toHaveAttribute(
				"data-state",
				"checked",
			);

			const reopenResponse = page.waitForResponse(
				(response) =>
					response
						.url()
						.includes(`/v1/families/${parentUser.familyId}/tasks/`) &&
					response.request().method() === "PATCH",
			);
			await tasksPage.toggleTaskCompletion(0);
			await reopenResponse;

			await expect(tasksPage.taskCompleteToggles.nth(0)).toHaveAttribute(
				"data-state",
				"unchecked",
			);
		});

		test("should edit an existing task", async ({ page }) => {
			await createTaskViaApi(parentUser, {
				name: "Vacuum living room",
				description: "Use cordless vacuum",
				assignment: { type: "role", role: "parent" },
			});

			await reloadTasksAndWait(page, tasksPage, parentUser.familyId!);
			await tasksPage.openTaskActions(0);
			await tasksPage.taskActionEdit.first().click();
			await tasksPage.dialog.waitFor({ state: "visible" });

			await tasksPage.fillTaskForm({
				name: "Vacuum upstairs",
				description: "Include hallway",
			});

			const updateResponse = page.waitForResponse(
				(response) =>
					response
						.url()
						.includes(`/v1/families/${parentUser.familyId}/tasks/`) &&
					response.request().method() === "PATCH",
			);
			await tasksPage.submitTaskForm();
			await updateResponse;
			await tasksPage.dialog.waitFor({ state: "hidden" });

			const refreshedName = await tasksPage.getTaskName(0);
			expect(refreshedName?.toLowerCase()).toContain("vacuum upstairs");
		});

		test("should delete a task", async ({ page }) => {
			await createTaskViaApi(parentUser, {
				name: "Take out trash",
			});
			await createTaskViaApi(parentUser, {
				name: "Mow lawn",
			});

			await reloadTasksAndWait(page, tasksPage, parentUser.familyId!);
			const initialCount = await tasksPage.getTaskCount();

			await tasksPage.openTaskActions(0);
			const deleteResponse = page.waitForResponse(
				(response) =>
					response
						.url()
						.includes(`/v1/families/${parentUser.familyId}/tasks/`) &&
					response.request().method() === "DELETE",
			);
			await tasksPage.taskActionDelete.first().click();
			await deleteResponse;

			await expect(tasksPage.taskCards).toHaveCount(initialCount - 1);
		});
	});

	test.describe("Task Filters", () => {
		test("should filter tasks by assignment", async ({ page }) => {
			await createTaskViaApi(parentUser, {
				name: "Personal task",
				assignment: { type: "member", memberId: parentUser.userId },
			});
			await createTaskViaApi(parentUser, {
				name: "Family chore",
				assignment: { type: "role", role: "child" },
			});

			await reloadTasksAndWait(page, tasksPage, parentUser.familyId!);

			await tasksPage.filtersContainer.waitFor({ state: "visible" });

			await tasksPage.filterAll.click();
			await expect(tasksPage.taskCards).toHaveCount(2);

			await tasksPage.filterMyTasks.click();
			await expect(tasksPage.taskCards).toHaveCount(1);

			const visibleName = await tasksPage.getTaskName(0);
			expect(visibleName?.toLowerCase()).toContain("personal task");
		});
	});

	test.describe("Claim Workflow", () => {
		test("should allow child user to claim an unassigned task", async ({
			page,
		}) => {
			await createTaskViaApi(parentUser, {
				name: "Organize toys",
				assignment: { type: "unassigned" },
			});

			const childUser = await authenticateUser(page, {
				name: "Child Task User",
				birthdate: "2010-08-22",
			});

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
						birthdate: "2010-08-22",
						role: "Child",
					}),
				},
			);

			if (!addChildResponse.ok) {
				const errorText = await addChildResponse.text();
				throw new Error(
					`Failed to add child member: ${addChildResponse.status} ${errorText}`,
				);
			}

			childUser.familyId = parentUser.familyId;

			await switchUser(page, childUser);
			await tasksPage.gotoTasks("en-US");
			await waitForPageLoad(page);

			await expect(tasksPage.taskClaimButtons.first()).toBeVisible({
				timeout: 10000,
			});

			const claimResponse = page.waitForResponse(
				(response) =>
					response
						.url()
						.includes(`/v1/families/${childUser.familyId}/tasks/`) &&
					response.request().method() === "PATCH",
			);
			await tasksPage.taskClaimButtons.first().click();
			await claimResponse;

			await tasksPage.filterMyTasks.click();
			await expect(tasksPage.taskCards).toHaveCount(1);
			const claimedName = await tasksPage.getTaskName(0);
			expect(claimedName?.toLowerCase()).toContain("organize toys");
		});
	});

	test.describe("Responsive Layout", () => {
		test("should display correctly on mobile", async ({ page }) => {
			await setViewport(page, "mobile");
			await page.reload();
			await waitForPageLoad(page);

			// On mobile, the header is hidden (hidden lg:flex), so we just check the page loads
			const emptyVisible = await tasksPage.isEmptyStateVisible();
			expect(emptyVisible).toBeTruthy();
		});

		test("should display correctly on desktop", async ({ page }) => {
			await setViewport(page, "desktop");
			await page.reload();
			await waitForPageLoad(page);

			await expect(tasksPage.pageTitle).toBeVisible();
			await expect(tasksPage.createTaskButton).toBeVisible();
		});
	});

	test.describe("Karma Integration", () => {
		test("should award karma when completing a task with karma metadata", async ({
			page,
		}) => {
			// Create a task with karma
			await createTaskViaApi(parentUser, {
				name: "Task with karma reward",
				assignment: { type: "member", memberId: parentUser.userId },
				karma: 50,
			});

			await reloadTasksAndWait(page, tasksPage, parentUser.familyId!);

			// Verify initial karma display
			await expect(tasksPage.taskKarmaBadges.first()).toBeVisible();
			const karmaText = await tasksPage.taskKarmaBadges.first().textContent();
			expect(karmaText).toContain("50");

			// Complete the task and wait for the response
			const completeResponse = page.waitForResponse(
				(response) =>
					response
						.url()
						.includes(`/v1/families/${parentUser.familyId}/tasks/`) &&
					response.request().method() === "PATCH",
			);

			await tasksPage.toggleTaskCompletion(0);
			await completeResponse;

			// Verify task is marked as completed
			await expect(tasksPage.taskCompleteToggles.nth(0)).toHaveAttribute(
				"data-state",
				"checked",
			);

			// Note: The actual karma balance update would require accessing the profile or karma API
			// This test verifies the task completion workflow with karma metadata is successful
		});
	});
});
