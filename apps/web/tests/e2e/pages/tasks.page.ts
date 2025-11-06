import type { Locator, Page } from "@playwright/test";

export interface TaskFormInput {
  name?: string;
  description?: string;
  dueDate?: string;
  assignmentValue?: string;
  assignmentLabel?: string;
  karma?: number;
}

/**
 * Page Object for Tasks Page
 */
export class TasksPage {
  readonly page: Page;

  // Header elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly createTaskButton: Locator;

  // Filter controls
  readonly filtersContainer: Locator;
  readonly filterMyTasks: Locator;
  readonly filterAll: Locator;
  readonly filterActive: Locator;
  readonly filterCompleted: Locator;

  // Empty state
  readonly emptyStateCard: Locator;
  readonly emptyStateAction: Locator;

  // Task list
  readonly tasksList: Locator;
  readonly taskCards: Locator;
  readonly taskNames: Locator;
  readonly taskDescriptions: Locator;
  readonly taskMeta: Locator;
  readonly taskAssignments: Locator;
  readonly taskDueDates: Locator;
  readonly taskClaimButtons: Locator;
  readonly taskCompleteToggles: Locator;
  readonly taskActionsButtons: Locator;
  readonly taskActionsMenu: Locator;
  readonly taskActionEdit: Locator;
  readonly taskActionDelete: Locator;
  readonly taskKarmaBadges: Locator;

  // Creation / edit dialog
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly addDescriptionButton: Locator;
  readonly addDueDateButton: Locator;
  readonly dueDateInput: Locator;
  readonly addAssignmentButton: Locator;
  readonly assignmentSelect: Locator;
  readonly addKarmaButton: Locator;
  readonly karmaInput: Locator;
  readonly dialogCancelButton: Locator;
  readonly dialogSubmitButton: Locator;

  // Delete dialog
  readonly deleteDialog: Locator;
  readonly deleteDialogCancel: Locator;
  readonly deleteDialogDeleteOne: Locator;
  readonly deleteDialogDeleteAll: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.getByTestId("tasks-title");
    this.pageDescription = page.getByTestId("tasks-description");
    this.createTaskButton = page.getByTestId("tasks-create-button");

    // Filters
    this.filtersContainer = page.getByTestId("tasks-filters");
    this.filterMyTasks = page.getByTestId("tasks-filter-my");
    this.filterAll = page.getByTestId("tasks-filter-all");
    this.filterActive = page.getByTestId("tasks-filter-active");
    this.filterCompleted = page.getByTestId("tasks-filter-completed");

    // Empty state
    this.emptyStateCard = page.getByTestId("tasks-empty");
    this.emptyStateAction = page.getByTestId("tasks-empty-create");

    // Task list
    this.tasksList = page.getByTestId("tasks-list");
    this.taskCards = page.getByTestId("task-card");
    this.taskNames = page.getByTestId("task-name");
    this.taskDescriptions = page.getByTestId("task-description");
    this.taskMeta = page.getByTestId("task-meta");
    this.taskAssignments = page.getByTestId("task-assignment");
    this.taskDueDates = page.getByTestId("task-due-date");
    this.taskClaimButtons = page.getByTestId("task-claim-button");
    this.taskCompleteToggles = page.getByTestId("task-complete-toggle");
    this.taskActionsButtons = page.getByTestId("task-actions-button");
    this.taskActionsMenu = page.getByTestId("task-actions-menu");
    this.taskActionEdit = page.getByTestId("task-action-edit");
    this.taskActionDelete = page.getByTestId("task-action-delete");
    this.taskKarmaBadges = page.getByTestId("task-karma");

    // Dialog
    this.dialog = page.getByTestId("task-dialog");
    this.dialogTitle = page.getByTestId("task-dialog-title");
    this.nameInput = page.getByTestId("task-name-input");
    this.descriptionInput = page.getByTestId("task-description-input");
    this.addDescriptionButton = page.getByTestId("task-add-description");
    this.addDueDateButton = page.getByTestId("task-add-due-date");
    this.dueDateInput = page.getByTestId("task-due-date-input");
    this.addAssignmentButton = page.getByTestId("task-add-assignment");
    this.assignmentSelect = page.getByTestId("task-assignment-select");
    this.addKarmaButton = page.getByTestId("task-add-karma");
    this.karmaInput = page.getByTestId("task-karma-input");
    this.dialogCancelButton = page.getByTestId("task-dialog-cancel");
    this.dialogSubmitButton = page.getByTestId("task-dialog-submit");

    // Delete dialog
    this.deleteDialog = page.getByTestId("task-delete-dialog");
    this.deleteDialogCancel = page.getByTestId("task-delete-cancel");
    this.deleteDialogDeleteOne = page.getByTestId("task-delete-one");
    this.deleteDialogDeleteAll = page.getByTestId("task-delete-all");
  }

  /**
   * Navigate to tasks page
   */
  async gotoTasks(locale = "en-US") {
    await this.page.goto(`/${locale}/app/tasks`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Open the create task dialog
   */
  async openCreateTaskDialog() {
    await this.createTaskButton.click();
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Open actions menu for a task card
   */
  async openTaskActions(taskIndex = 0) {
    await this.taskActionsButtons.nth(taskIndex).click();
    await this.taskActionsMenu.first().waitFor({ state: "visible" });
  }

  /**
   * Fill task form with provided data.
   * Only fields explicitly provided will be touched.
   */
  async fillTaskForm({
    name,
    description,
    dueDate,
    assignmentValue,
    assignmentLabel,
    karma,
  }: TaskFormInput) {
    if (typeof name === "string") {
      await this.nameInput.first().fill(name);
    }

    if (description !== undefined) {
      const descriptionInputVisible = await this.descriptionInput
        .first()
        .isVisible()
        .catch(() => false);
      if (!descriptionInputVisible) {
        await this.addDescriptionButton.first().click();
      }
      await this.descriptionInput.first().fill(description);
    }

    if (dueDate !== undefined) {
      const dueDateInputVisible = await this.dueDateInput
        .first()
        .isVisible()
        .catch(() => false);
      if (!dueDateInputVisible) {
        await this.addDueDateButton.first().click();
      }
      await this.dueDateInput.first().fill(dueDate);
    }

    if (assignmentValue !== undefined || assignmentLabel !== undefined) {
      const assignmentVisible = await this.assignmentSelect
        .first()
        .isVisible()
        .catch(() => false);
      if (!assignmentVisible) {
        await this.addAssignmentButton.first().click();
      }
      await this.assignmentSelect.first().click();

      const labelFromValue: Record<string, string> = {
        unassigned: "Unassigned",
        "all-parents": "All Parents",
        "all-children": "All Children",
      };
      const expectedLabel =
        assignmentLabel ??
        (assignmentValue ? labelFromValue[assignmentValue] : undefined);

      let optionClicked = false;

      if (assignmentValue !== undefined) {
        const optionByValue = this.page
          .locator(`[data-value="${assignmentValue}"]`)
          .first();
        try {
          await optionByValue.waitFor({ state: "visible", timeout: 2000 });
          await optionByValue.click();
          optionClicked = true;
        } catch {
          // Fall back to label-based selection below
        }
      }

      if (!optionClicked && expectedLabel) {
        const optionByLabel = this.page
          .getByRole("option", { name: new RegExp(expectedLabel, "i") })
          .first();
        await optionByLabel.waitFor({ state: "visible" });
        await optionByLabel.click();
        optionClicked = true;
      }

      if (!optionClicked) {
        throw new Error(
          `Assignment option not found for value "${assignmentValue}" or label "${expectedLabel ?? assignmentLabel}"`,
        );
      }
    }

    if (karma !== undefined) {
      const karmaVisible = await this.karmaInput
        .first()
        .isVisible()
        .catch(() => false);
      if (!karmaVisible) {
        await this.addKarmaButton.first().click();
      }
      await this.karmaInput.first().fill(String(karma));
    }
  }

  /**
   * Submit task dialog form
   */
  async submitTaskForm() {
    await this.dialogSubmitButton.click();
  }

  /**
   * Toggle task completion
   */
  async toggleTaskCompletion(taskIndex = 0) {
    await this.taskCompleteToggles.nth(taskIndex).click();
  }

  /**
   * Get current count of tasks rendered
   */
  async getTaskCount(): Promise<number> {
    return this.taskCards.count();
  }

  /**
   * Check if empty state is visible
   */
  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyStateCard.isVisible().catch(() => false);
  }

  /**
   * Get the text of a task name by index
   */
  async getTaskName(index = 0): Promise<string | null> {
    return this.taskNames.nth(index).textContent();
  }

  /**
   * Get assignment label for a task card
   */
  async getTaskAssignment(index = 0): Promise<string | null> {
    return this.taskAssignments.nth(index).textContent();
  }

  /**
   * Get due date badge text for a task card
   */
  async getTaskDueDate(index = 0): Promise<string | null> {
    return this.taskDueDates.nth(index).textContent();
  }
}
