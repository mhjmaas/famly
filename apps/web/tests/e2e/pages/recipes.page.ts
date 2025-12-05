import type { Locator, Page } from "@playwright/test";

export class RecipesPage {
  readonly page: Page;

  // Header elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly createRecipeButton: Locator;
  readonly createRecipeButtonMobile: Locator;

  // Search elements
  readonly searchContainer: Locator;
  readonly searchInput: Locator;
  readonly searchClearButton: Locator;
  readonly searchResultsCount: Locator;

  // Grid and cards
  readonly recipesGrid: Locator;
  readonly recipeCards: Locator;

  // Empty states
  readonly emptyState: Locator;
  readonly emptyStateCreateButton: Locator;
  readonly emptySearchState: Locator;

  // Loading and error states
  readonly loadingState: Locator;
  readonly errorState: Locator;

  // Create/Edit Recipe Dialog
  readonly createDialog: Locator;
  readonly createDialogTitle: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly durationInput: Locator;
  readonly addTagsButton: Locator;
  readonly tagsInput: Locator;
  readonly addTagButton: Locator;
  readonly tagBadges: Locator;
  readonly dialogCancelButton: Locator;
  readonly dialogSubmitButton: Locator;
  readonly dialogError: Locator;

  // Breadcrumbs (detail page)
  readonly breadcrumbNavigation: Locator;
  readonly breadcrumbRecipes: Locator;
  readonly breadcrumbCurrentRecipe: Locator;

  // Detail page elements
  readonly detailPage: Locator;
  readonly detailBackButton: Locator;
  readonly detailTitle: Locator;
  readonly detailDescription: Locator;
  readonly detailDuration: Locator;
  readonly detailCreatedBy: Locator;
  readonly detailCreatedAt: Locator;
  readonly detailTags: Locator;
  readonly detailEditButton: Locator;
  readonly detailDeleteButton: Locator;
  readonly detailNotFound: Locator;

  // Steps elements
  readonly stepsContainer: Locator;
  readonly stepsTitle: Locator;
  readonly stepsProgress: Locator;
  readonly stepsResetButton: Locator;
  readonly stepsCelebration: Locator;
  readonly stepsEmpty: Locator;
  readonly stepsList: Locator;
  readonly addStepForm: Locator;
  readonly addStepInput: Locator;
  readonly addStepButton: Locator;

  // Edit dialog (detail page)
  readonly editDialog: Locator;
  readonly editDialogTitle: Locator;
  readonly editNameInput: Locator;
  readonly editDescriptionInput: Locator;
  readonly editDurationInput: Locator;
  readonly editAddTagsButton: Locator;
  readonly editTagsInput: Locator;
  readonly editAddTagButton: Locator;
  readonly editTagBadges: Locator;
  readonly editCancelButton: Locator;
  readonly editSubmitButton: Locator;

  // Image upload elements
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly imagePreview: Locator;
  readonly removeImageButton: Locator;
  readonly uploadError: Locator;
  readonly imageUrlInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements
    this.pageTitle = page.getByTestId("recipes-title");
    this.pageDescription = page.getByTestId("recipes-description");
    this.createRecipeButton = page.getByTestId("recipes-create-button");
    this.createRecipeButtonMobile = page.getByTestId(
      "recipes-create-button-mobile"
    );

    // Search elements
    this.searchContainer = page.getByTestId("recipes-search");
    this.searchInput = page.getByTestId("recipes-search-input");
    this.searchClearButton = page.getByTestId("recipes-search-clear");
    this.searchResultsCount = page.getByTestId("recipes-search-results-count");

    // Grid and cards
    this.recipesGrid = page.getByTestId("recipes-grid");
    this.recipeCards = page.locator('[data-testid^="recipe-card-"]');

    // Empty states
    this.emptyState = page.getByTestId("recipes-empty-state");
    this.emptyStateCreateButton = page.getByTestId(
      "recipes-empty-create-button"
    );
    this.emptySearchState = page.getByTestId("recipes-empty-search");

    // Loading and error states
    this.loadingState = page.getByTestId("recipes-loading");
    this.errorState = page.getByTestId("recipes-error");

    // Create/Edit Recipe Dialog
    this.createDialog = page.getByTestId("create-recipe-dialog");
    this.createDialogTitle = page.getByTestId("create-recipe-dialog-title");
    this.nameInput = page.getByTestId("create-recipe-name-input");
    this.descriptionInput = page.getByTestId("create-recipe-description-input");
    this.durationInput = page.getByTestId("create-recipe-duration-input");
    this.addTagsButton = page.getByTestId("create-recipe-add-tags-button");
    this.tagsInput = page.getByTestId("create-recipe-tags-input");
    this.addTagButton = page.getByTestId("create-recipe-add-tag-button");
    this.tagBadges = page.locator('[data-testid="create-recipe-tag-badge"]');
    this.dialogCancelButton = page.getByTestId("create-recipe-cancel-button");
    this.dialogSubmitButton = page.getByTestId("create-recipe-submit-button");
    this.dialogError = page.getByTestId("create-recipe-error");

    // Image upload elements
    this.fileInput = page.getByTestId("create-recipe-file-input");
    this.uploadButton = page.getByTestId("create-recipe-upload-button");
    this.imagePreview = page.getByTestId("create-recipe-image-preview");
    this.removeImageButton = page.getByTestId(
      "create-recipe-remove-image-button"
    );
    this.uploadError = page.getByTestId("create-recipe-upload-error");
    this.imageUrlInput = page.getByTestId("create-recipe-image-url-input");

    // Breadcrumbs (detail page)
    this.breadcrumbNavigation = page.getByTestId("breadcrumb-navigation");
    this.breadcrumbRecipes = page.getByTestId("breadcrumb-recipes");
    this.breadcrumbCurrentRecipe = page.getByTestId(
      "breadcrumb-current-recipe"
    );

    // Detail page elements
    this.detailPage = page.getByTestId("recipe-detail-page");
    this.detailBackButton = page.getByTestId("recipe-detail-back-button");
    this.detailTitle = page.getByTestId("recipe-detail-title");
    this.detailDescription = page.getByTestId("recipe-detail-description");
    this.detailDuration = page.getByTestId("recipe-detail-duration");
    this.detailCreatedBy = page.getByTestId("recipe-detail-created-by");
    this.detailCreatedAt = page.getByTestId("recipe-detail-created-at");
    this.detailTags = page.getByTestId("recipe-detail-tags");
    this.detailEditButton = page.getByTestId("recipe-detail-edit-button");
    this.detailDeleteButton = page.getByTestId("recipe-detail-delete-button");
    this.detailNotFound = page.getByTestId("recipe-detail-not-found");

    // Steps elements
    this.stepsContainer = page.getByTestId("recipe-steps");
    this.stepsTitle = page.getByTestId("recipe-steps-title");
    this.stepsProgress = page.getByTestId("recipe-steps-progress");
    this.stepsResetButton = page.getByTestId("recipe-steps-reset-button");
    this.stepsCelebration = page.getByTestId("recipe-steps-celebration");
    this.stepsEmpty = page.getByTestId("recipe-steps-empty");
    this.stepsList = page.getByTestId("recipe-steps-list");
    this.addStepForm = page.getByTestId("recipe-add-step-form");
    this.addStepInput = page.getByTestId("recipe-add-step-input");
    this.addStepButton = page.getByTestId("recipe-add-step-button");

    // Edit dialog (detail page)
    this.editDialog = page.getByTestId("edit-recipe-dialog");
    this.editDialogTitle = page.getByTestId("edit-recipe-dialog-title");
    this.editNameInput = page.getByTestId("edit-recipe-name-input");
    this.editDescriptionInput = page.getByTestId(
      "edit-recipe-description-input"
    );
    this.editDurationInput = page.getByTestId("edit-recipe-duration-input");
    this.editAddTagsButton = page.getByTestId("edit-recipe-add-tags-button");
    this.editTagsInput = page.getByTestId("edit-recipe-tags-input");
    this.editAddTagButton = page.getByTestId("edit-recipe-add-tag-button");
    this.editTagBadges = page.locator('[data-testid="edit-recipe-tag-badge"]');
    this.editCancelButton = page.getByTestId("edit-recipe-cancel-button");
    this.editSubmitButton = page.getByTestId("edit-recipe-submit-button");
  }

  // Navigation helpers
  async gotoRecipes(locale = "en-US") {
    await this.page.goto(`/${locale}/app/recipes`);
  }

  async gotoRecipeDetail(recipeId: string, locale = "en-US") {
    await this.page.goto(`/${locale}/app/recipes/${recipeId}`);
  }

  // Create recipe dialog helpers
  async openCreateRecipeDialog() {
    await this.createRecipeButton.click();
  }

  async fillRecipeForm({
    name,
    description,
    duration,
    tags,
  }: {
    name?: string;
    description?: string;
    duration?: string;
    tags?: string[];
  }) {
    if (name !== undefined) {
      await this.nameInput.fill(name);
    }
    if (description !== undefined) {
      await this.descriptionInput.fill(description);
    }
    if (duration !== undefined) {
      await this.durationInput.fill(duration);
    }
    if (tags !== undefined && tags.length > 0) {
      // Click "Add Tags" button to show tag input
      await this.addTagsButton.click();
      // Add each tag
      for (const tag of tags) {
        await this.tagsInput.fill(tag);
        await this.addTagButton.click();
      }
    }
  }

  async submitRecipeForm() {
    await this.dialogSubmitButton.click();
  }

  async cancelRecipeForm() {
    await this.dialogCancelButton.click();
  }

  // Search helpers
  async searchRecipes(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchClearButton.click();
  }

  // Recipe card helpers
  getRecipeCard(recipeId: string) {
    return this.page.getByTestId(`recipe-card-${recipeId}`);
  }

  getRecipeCardTitle(recipeId: string) {
    return this.page.getByTestId(`recipe-card-title-${recipeId}`);
  }

  getRecipeCardMenu(recipeId: string) {
    return this.page.getByTestId(`recipe-card-menu-${recipeId}`);
  }

  getRecipeCardEditButton(recipeId: string) {
    return this.page.getByTestId(`recipe-card-edit-${recipeId}`);
  }

  getRecipeCardDeleteButton(recipeId: string) {
    return this.page.getByTestId(`recipe-card-delete-${recipeId}`);
  }

  async openRecipeCardMenu(recipeId: string) {
    await this.getRecipeCardMenu(recipeId).click();
  }

  async clickRecipeCard(recipeId: string) {
    await this.getRecipeCard(recipeId).click();
  }

  // Step helpers
  getStep(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}`);
  }

  getStepCheckbox(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}-checkbox`);
  }

  getStepText(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}-text`);
  }

  getStepEditButton(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}-edit-button`);
  }

  getStepDeleteButton(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}-delete-button`);
  }

  getStepEditInput(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}-edit-input`);
  }

  getStepSaveButton(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}-save-button`);
  }

  getStepCancelButton(stepIndex: number) {
    return this.page.getByTestId(`recipe-step-${stepIndex}-cancel-button`);
  }

  async toggleStepCompletion(stepIndex: number) {
    await this.getStepCheckbox(stepIndex).click();
  }

  async addStep(stepText: string) {
    await this.addStepInput.fill(stepText);
    await this.addStepButton.click();
  }

  async editStep(stepIndex: number, newText: string) {
    await this.getStepEditButton(stepIndex).click();
    await this.getStepEditInput(stepIndex).fill(newText);
    await this.getStepSaveButton(stepIndex).click();
  }

  async deleteStep(stepIndex: number) {
    await this.getStepDeleteButton(stepIndex).click();
  }

  // Assertion helpers
  async getRecipeCount(): Promise<number> {
    return this.recipeCards.count();
  }

  async isEmptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async isEmptySearchStateVisible(): Promise<boolean> {
    return this.emptySearchState.isVisible();
  }

  async getRecipeName(recipeId: string): Promise<string> {
    return (await this.getRecipeCardTitle(recipeId).textContent()) || "";
  }

  async getStepCount(): Promise<number> {
    // Match recipe-step-{number} exactly (not recipe-step-{number}-editing etc.)
    return this.page.locator('[data-testid^="recipe-step-"]').evaluateAll(
      (elements) =>
        elements.filter((el) => {
          const testId = el.getAttribute("data-testid") || "";
          // Match recipe-step-{digits} exactly
          return /^recipe-step-\d+$/.test(testId);
        }).length
    );
  }

  // Edit dialog helpers (detail page)
  async openEditDialog() {
    await this.detailEditButton.click();
  }

  async fillEditForm({
    name,
    description,
    duration,
    tags,
  }: {
    name?: string;
    description?: string;
    duration?: string;
    tags?: string[];
  }) {
    if (name !== undefined) {
      await this.editNameInput.fill(name);
    }
    if (description !== undefined) {
      await this.editDescriptionInput.fill(description);
    }
    if (duration !== undefined) {
      await this.editDurationInput.fill(duration);
    }
    if (tags !== undefined && tags.length > 0) {
      // Click "Add Tags" button if not already showing tags input
      const addTagsButtonVisible = await this.editAddTagsButton.isVisible();
      if (addTagsButtonVisible) {
        await this.editAddTagsButton.click();
      }
      // Add each tag
      for (const tag of tags) {
        await this.editTagsInput.fill(tag);
        await this.editAddTagButton.click();
      }
    }
  }

  async submitEditForm() {
    await this.editSubmitButton.click();
  }

  async deleteRecipe() {
    await this.detailDeleteButton.click();
  }

  async goBackToRecipes() {
    // On desktop, use breadcrumbs; on mobile, use back button
    const breadcrumbVisible = await this.breadcrumbRecipes.isVisible();
    if (breadcrumbVisible) {
      await this.breadcrumbRecipes.click();
    } else {
      await this.detailBackButton.click();
    }
  }

  // Image upload helpers

  /**
   * Upload an image file via file input
   */
  async uploadImage(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
    // Wait for preview to appear
    await this.imagePreview.waitFor({ state: "visible" });
  }

  /**
   * Remove uploaded image
   */
  async removeUploadedImage(): Promise<void> {
    await this.removeImageButton.click();
    await this.imagePreview.waitFor({ state: "hidden" });
  }

  /**
   * Get upload error message
   */
  async getUploadError(): Promise<string | null> {
    if (!(await this.uploadError.isVisible())) {
      return null;
    }
    return await this.uploadError.textContent();
  }

  /**
   * Check if image preview is visible
   */
  async hasImagePreview(): Promise<boolean> {
    return await this.imagePreview.isVisible();
  }
}
