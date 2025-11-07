import type { Locator, Page } from "@playwright/test";

export interface CreateRewardInput {
  name: string;
  karmaCost: number;
  description?: string;
  imageUrl?: string;
}

/**
 * Page Object for Rewards Page
 */
export class RewardsPage {
  readonly page: Page;

  // Header elements
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly createRewardButton: Locator;

  // Karma balance card
  readonly karmaBalanceCard: Locator;

  // Empty state
  readonly emptyState: Locator;
  readonly emptyStateCreateButton: Locator;

  // Rewards grid
  readonly rewardsGrid: Locator;
  readonly rewardCards: Locator;
  readonly rewardNames: Locator;
  readonly rewardFavouriteButtons: Locator;
  readonly rewardClaimButtons: Locator;
  readonly rewardActionsButtons: Locator;
  readonly progressBars: Locator;

  // Reward dialog
  readonly rewardDialog: Locator;
  readonly nameInput: Locator;
  readonly karmaCostInput: Locator;
  readonly descriptionInput: Locator;
  readonly imageUrlInput: Locator;
  readonly fileInput: Locator;
  readonly uploadButton: Locator;
  readonly imagePreview: Locator;
  readonly removeImageButton: Locator;
  readonly uploadError: Locator;
  readonly dialogCancelButton: Locator;
  readonly dialogSubmitButton: Locator;

  // Claim confirmation sheet
  readonly claimSheet: Locator;
  readonly claimConfirmButton: Locator;
  readonly claimCancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator("h1").first();
    this.pageDescription = page.locator("p").first();
    this.createRewardButton = page.getByTestId("create-reward-button");

    // Karma balance
    this.karmaBalanceCard = page.getByTestId("karma-balance-card");

    // Empty state
    this.emptyState = page.getByTestId("rewards-empty");
    this.emptyStateCreateButton = this.emptyState.getByTestId("empty-state-create-button");

    // Rewards grid
    this.rewardsGrid = page.getByTestId("rewards-grid");
    this.rewardCards = page.getByTestId("reward-card");
    this.rewardNames = this.rewardCards.locator("h3");
    this.rewardFavouriteButtons = page.getByTestId("reward-favourite-button");
    this.rewardClaimButtons = page.getByTestId("reward-claim-button");
    this.rewardActionsButtons = page.getByTestId("reward-actions-button");
    this.progressBars = this.rewardCards.locator('[role="progressbar"]');

    // Dialog
    this.rewardDialog = page.getByTestId("reward-dialog");
    this.nameInput = page.getByTestId("reward-name-input");
    this.karmaCostInput = page.getByTestId("reward-karma-input");
    this.descriptionInput = page.getByTestId("reward-description-input");
    this.imageUrlInput = page.getByTestId("reward-image-url-input");
    this.fileInput = page.getByTestId("reward-file-input");
    this.uploadButton = page.getByTestId("reward-upload-button");
    this.imagePreview = page.getByTestId("reward-image-preview");
    this.removeImageButton = page.getByTestId("reward-remove-image-button");
    this.uploadError = page.getByTestId("reward-upload-error");
    this.dialogCancelButton = this.rewardDialog.getByRole("button", {
      name: /cancel|annuleren/i,
    });
    this.dialogSubmitButton = page.getByTestId("reward-dialog-submit");

    // Claim sheet
    this.claimSheet = page.getByTestId("claim-sheet");
    this.claimConfirmButton = page.getByTestId("claim-confirm-button");
    this.claimCancelButton = this.claimSheet.getByRole("button", {
      name: /cancel|annuleren/i,
    });
  }

  /**
   * Navigate to rewards page
   */
  async gotoRewards(locale = "en-US"): Promise<void> {
    await this.page.goto(`/${locale}/app/rewards`);
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Create a new reward
   */
  async createReward(data: CreateRewardInput): Promise<void> {
    await this.createRewardButton.click();
    await this.rewardDialog.waitFor({ state: "visible" });

    await this.nameInput.fill(data.name);
    await this.karmaCostInput.fill(data.karmaCost.toString());

    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }

    if (data.imageUrl) {
      await this.imageUrlInput.fill(data.imageUrl);
    }

    await this.dialogSubmitButton.click();
    await this.rewardDialog.waitFor({ state: "hidden" });
  }

  /**
   * Claim a reward by index
   */
  async claimReward(rewardIndex: number): Promise<void> {
    const claimButton = this.rewardClaimButtons.nth(rewardIndex);
    await claimButton.click();
    await this.claimSheet.waitFor({ state: "visible" });
    await this.claimConfirmButton.click();
    await this.claimSheet.waitFor({ state: "hidden" });
  }

  /**
   * Toggle favourite for a reward by index
   */
  async toggleFavourite(rewardIndex: number): Promise<void> {
    const favouriteButton = this.rewardFavouriteButtons.nth(rewardIndex);
    await favouriteButton.click();
  }

  /**
   * Edit a reward by index
   */
  async editReward(
    rewardIndex: number,
    data: Partial<CreateRewardInput>,
  ): Promise<void> {
    const actionsButton = this.rewardActionsButtons.nth(rewardIndex);
    await actionsButton.click();

    const editButton = this.page.getByRole("menuitem", { name: /edit|bewerken/i });
    await editButton.click();

    await this.rewardDialog.waitFor({ state: "visible" });

    if (data.name !== undefined) {
      await this.nameInput.fill(data.name);
    }
    if (data.karmaCost !== undefined) {
      await this.karmaCostInput.fill(data.karmaCost.toString());
    }
    if (data.description !== undefined) {
      await this.descriptionInput.fill(data.description);
    }
    if (data.imageUrl !== undefined) {
      await this.imageUrlInput.fill(data.imageUrl);
    }

    await this.dialogSubmitButton.click();
    await this.rewardDialog.waitFor({ state: "hidden" });
  }

  /**
   * Delete a reward by index
   */
  async deleteReward(rewardIndex: number): Promise<void> {
    const actionsButton = this.rewardActionsButtons.nth(rewardIndex);
    await actionsButton.click();

    const deleteButton = this.page.getByRole("menuitem", {
      name: /delete|verwijderen/i,
    });
    await deleteButton.click();

    // Handle browser confirm dialog
    this.page.once("dialog", (dialog) => dialog.accept());
  }

  /**
   * Get the count of rewards displayed
   */
  async getRewardCount(): Promise<number> {
    return await this.rewardCards.count();
  }

  /**
   * Check if a reward is pending by index
   */
  async isRewardPending(rewardIndex: number): Promise<boolean> {
    const claimButton = this.rewardClaimButtons.nth(rewardIndex);
    const text = await claimButton.textContent();
    return text?.toLowerCase().includes("pending") || text?.toLowerCase().includes("behandeling") || false;
  }

  /**
   * Check if a reward is favourited by index
   */
  async isRewardFavourited(rewardIndex: number): Promise<boolean> {
    const favouriteButton = this.rewardFavouriteButtons.nth(rewardIndex);
    const heartIcon = favouriteButton.locator("svg");
    const className = await heartIcon.getAttribute("class");
    return className?.includes("fill-red") || false;
  }

  /**
   * Check if progress bar is visible for a reward
   */
  async hasProgressBar(rewardIndex: number): Promise<boolean> {
    const card = this.rewardCards.nth(rewardIndex);
    const progressBar = card.locator('[role="progressbar"]');
    return await progressBar.isVisible();
  }

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
