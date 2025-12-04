import { expect, type Page, test } from "@playwright/test";
import { type AuthenticatedUser, authenticateUser } from "../helpers/auth";
import { RecipesPage } from "../pages/recipes.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

interface CreateRecipeData {
  name: string;
  description: string;
  durationMinutes?: number;
  steps?: string[];
  tags?: string[];
}

async function createRecipeViaApi(
  user: AuthenticatedUser,
  data: CreateRecipeData
): Promise<{ _id: string }> {
  if (!user.familyId) {
    throw new Error("Family ID is required to create recipes via API");
  }

  const response = await fetch(
    `${API_URL}/v1/families/${user.familyId}/recipes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.sessionToken}`,
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description,
        durationMinutes: data.durationMinutes,
        steps: data.steps || ["Step 1"],
        tags: data.tags || [],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to create recipe via API: ${response.status} ${error}`
    );
  }

  return response.json();
}

async function deleteRecipeViaApi(
  user: AuthenticatedUser,
  recipeId: string
): Promise<void> {
  if (!user.familyId) {
    throw new Error("Family ID is required to delete recipes via API");
  }

  const response = await fetch(
    `${API_URL}/v1/families/${user.familyId}/recipes/${recipeId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.sessionToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to delete recipe via API: ${response.status} ${error}`
    );
  }
}

async function reloadRecipesAndWait(
  page: Page,
  recipesPage: RecipesPage,
  familyId: string
) {
  const recipesRequest = page.waitForResponse(
    (response) =>
      response.url().includes(`/v1/families/${familyId}/recipes`) &&
      response.request().method() === "GET"
  );

  await page.reload();
  await waitForPageLoad(page);
  await recipesRequest;
}

test.describe("Recipes Page", () => {
  let recipesPage: RecipesPage;
  let parentUser: AuthenticatedUser;

  test.beforeEach(async ({ page }) => {
    await setViewport(page, "desktop");

    recipesPage = new RecipesPage(page);
    parentUser = await authenticateUser(page, {
      name: "Parent Recipe User",
      birthdate: "1985-04-10",
      createFamily: true,
      familyName: "Recipes Test Family",
    });

    // Wait for recipes API call to complete when navigating
    const recipesRequest = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(`/v1/families/${parentUser.familyId}/recipes`) &&
        response.request().method() === "GET"
    );

    await recipesPage.gotoRecipes("en-US");
    await waitForPageLoad(page);
    await recipesRequest;
  });

  test.describe("Page Load and Empty State", () => {
    test("should display recipes page title and description", async () => {
      await expect(recipesPage.pageTitle).toHaveText("Recipes");
      await expect(recipesPage.pageDescription).toHaveText(
        "Manage your family's recipes"
      );
    });

    test("should show empty state when no recipes exist", async () => {
      await expect(recipesPage.emptyState).toBeVisible();
      await expect(recipesPage.emptyStateCreateButton).toBeVisible();
    });

    test("should show create button in header", async () => {
      await expect(recipesPage.createRecipeButton).toBeVisible();
    });
  });

  test.describe("Recipe Creation", () => {
    test("should open create recipe dialog", async () => {
      await recipesPage.openCreateRecipeDialog();
      await expect(recipesPage.createDialog).toBeVisible();
      await expect(recipesPage.createDialogTitle).toHaveText(
        "Create New Recipe"
      );
    });

    test("should create a recipe with required fields", async ({ page }) => {
      const uniqueName = `Test Recipe ${Date.now()}`;

      await recipesPage.openCreateRecipeDialog();
      await recipesPage.fillRecipeForm({
        name: uniqueName,
        description: "A test recipe description",
      });

      const createResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/recipes") &&
          response.request().method() === "POST"
      );

      await recipesPage.submitRecipeForm();
      await createResponse;

      // Dialog should close
      await expect(recipesPage.createDialog).not.toBeVisible();

      // Recipe should appear in grid
      await expect(recipesPage.recipesGrid).toBeVisible();
      // Verify the created recipe is visible by its name
      await expect(page.getByText(uniqueName)).toBeVisible();
    });

    test("should create a recipe with all fields", async ({ page }) => {
      const uniqueName = `Full Recipe ${Date.now()}`;

      await recipesPage.openCreateRecipeDialog();
      await recipesPage.fillRecipeForm({
        name: uniqueName,
        description: "A complete recipe",
        duration: "45",
        tags: ["dinner", "italian", "easy"],
      });

      const createResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/recipes") &&
          response.request().method() === "POST"
      );

      await recipesPage.submitRecipeForm();
      await createResponse;

      await expect(recipesPage.createDialog).not.toBeVisible();
      // Verify the created recipe is visible by its name
      await expect(page.getByText(uniqueName)).toBeVisible();
    });

    test("should disable submit button when name is empty", async () => {
      await recipesPage.openCreateRecipeDialog();
      await recipesPage.fillRecipeForm({
        description: "Description without name",
      });

      // Submit button should be disabled when name is empty
      await expect(recipesPage.dialogSubmitButton).toBeDisabled();
      await expect(recipesPage.createDialog).toBeVisible();
    });

    test("should cancel recipe creation", async () => {
      // Get initial count
      const initialCount = await recipesPage.getRecipeCount();

      await recipesPage.openCreateRecipeDialog();
      await recipesPage.fillRecipeForm({
        name: "Cancelled Recipe",
      });
      await recipesPage.cancelRecipeForm();

      await expect(recipesPage.createDialog).not.toBeVisible();
      // Count should remain the same after cancelling
      const afterCancelCount = await recipesPage.getRecipeCount();
      expect(afterCancelCount).toBe(initialCount);
    });
  });

  test.describe("Recipe Search", () => {
    let pastaRecipeName: string;
    let curryRecipeName: string;

    test.beforeEach(async ({ page }) => {
      // Generate completely unique names for each recipe (no shared parts)
      const pastaId = `${Date.now()}-pasta-${Math.random()
        .toString(36)
        .substring(7)}`;
      const curryId = `${Date.now()}-curry-${Math.random()
        .toString(36)
        .substring(7)}`;
      pastaRecipeName = `Spaghetti ${pastaId}`;
      curryRecipeName = `Tikka ${curryId}`;

      // Create test recipes with unique names
      await createRecipeViaApi(parentUser, {
        name: pastaRecipeName,
        description: "Italian pasta dish",
        tags: ["italian", "pasta"],
      });
      await createRecipeViaApi(parentUser, {
        name: curryRecipeName,
        description: "Indian curry dish",
        tags: ["indian", "curry"],
      });

      await reloadRecipesAndWait(page, recipesPage, parentUser.familyId!);
    });

    test("should filter recipes by search query", async ({ page }) => {
      // Search for the unique pasta recipe by its full unique name
      await recipesPage.searchRecipes(pastaRecipeName);

      // Wait for search API response
      await page.waitForResponse(
        (response) =>
          response.url().includes("/recipes/search") &&
          response.request().method() === "POST"
      );

      // Verify the pasta recipe is visible
      await expect(page.getByText(pastaRecipeName)).toBeVisible();
    });

    test("should show no results message for non-matching search", async () => {
      const nonExistentSearch = `nonexistent-${Date.now()}-xyz12345`;
      await recipesPage.searchRecipes(nonExistentSearch);

      await expect(recipesPage.emptySearchState).toBeVisible();
    });

    test("should clear search and show all recipes", async ({ page }) => {
      // Search for pasta recipe
      await recipesPage.searchRecipes(pastaRecipeName);
      await expect(recipesPage.searchResultsCount).toBeVisible();
      await expect(page.getByText(pastaRecipeName)).toBeVisible();

      // Clear search
      await recipesPage.clearSearch();

      // Both recipes should be visible after clearing
      await expect(page.getByText(pastaRecipeName)).toBeVisible();
      await expect(page.getByText(curryRecipeName)).toBeVisible();
    });
  });

  test.describe("Recipe Detail Page", () => {
    let recipeId: string;

    test.beforeEach(async ({ page }) => {
      const recipe = await createRecipeViaApi(parentUser, {
        name: "Detail Test Recipe",
        description: "Recipe for detail page testing",
        durationMinutes: 30,
        steps: ["Preheat oven", "Mix ingredients", "Bake for 20 minutes"],
        tags: ["baking", "easy"],
      });
      recipeId = recipe._id;

      await reloadRecipesAndWait(page, recipesPage, parentUser.familyId!);
    });

    test("should navigate to recipe detail page", async ({ page }) => {
      await recipesPage.clickRecipeCard(recipeId);

      await expect(recipesPage.detailPage).toBeVisible();
      await expect(recipesPage.detailTitle).toHaveText("Detail Test Recipe");
    });

    test("should display recipe metadata", async ({ page }) => {
      await recipesPage.gotoRecipeDetail(recipeId, "en-US");
      await waitForPageLoad(page);

      await expect(recipesPage.detailDescription).toContainText(
        "Recipe for detail page testing"
      );
      await expect(recipesPage.detailDuration).toContainText("30 minutes");
      await expect(recipesPage.detailTags).toBeVisible();
    });

    test("should display recipe steps", async ({ page }) => {
      await recipesPage.gotoRecipeDetail(recipeId, "en-US");
      await waitForPageLoad(page);

      await expect(recipesPage.stepsContainer).toBeVisible();
      const stepCount = await recipesPage.getStepCount();
      expect(stepCount).toBe(3);
    });

    test("should navigate back to recipes list", async ({ page }) => {
      await recipesPage.gotoRecipeDetail(recipeId, "en-US");
      await waitForPageLoad(page);

      await recipesPage.goBackToRecipes();

      await expect(recipesPage.recipesGrid).toBeVisible();
    });
  });

  test.describe("Step Progress Tracking", () => {
    let recipeId: string;

    test.beforeEach(async ({ page }) => {
      const recipe = await createRecipeViaApi(parentUser, {
        name: "Steps Test Recipe",
        description: "Recipe for step testing",
        steps: ["Step 1", "Step 2", "Step 3"],
      });
      recipeId = recipe._id;

      await recipesPage.gotoRecipeDetail(recipeId, "en-US");
      await waitForPageLoad(page);
    });

    test("should toggle step completion", async () => {
      await recipesPage.toggleStepCompletion(0);

      // Check that progress updates
      await expect(recipesPage.stepsProgress).toContainText("1 of 3");
    });

    test("should show celebration when all steps completed", async () => {
      await recipesPage.toggleStepCompletion(0);
      await recipesPage.toggleStepCompletion(1);
      await recipesPage.toggleStepCompletion(2);

      await expect(recipesPage.stepsCelebration).toBeVisible();
    });

    test("should reset all steps", async () => {
      await recipesPage.toggleStepCompletion(0);
      await recipesPage.toggleStepCompletion(1);

      await expect(recipesPage.stepsResetButton).toBeVisible();
      await recipesPage.stepsResetButton.click();

      await expect(recipesPage.stepsProgress).toContainText("0 of 3");
    });
  });

  test.describe("Step Management", () => {
    let recipeId: string;

    test.beforeEach(async ({ page }) => {
      const recipe = await createRecipeViaApi(parentUser, {
        name: "Step Management Recipe",
        description: "Recipe for step management testing",
        steps: ["Initial step"],
      });
      recipeId = recipe._id;

      await recipesPage.gotoRecipeDetail(recipeId, "en-US");
      await waitForPageLoad(page);
    });

    test("should add a new step", async ({ page }) => {
      const updateResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/recipes/${recipeId}`) &&
          response.request().method() === "PATCH"
      );

      await recipesPage.addStep("New step added");
      await updateResponse;

      const stepCount = await recipesPage.getStepCount();
      expect(stepCount).toBe(2);
    });

    test("should edit an existing step", async ({ page }) => {
      const updateResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/recipes/${recipeId}`) &&
          response.request().method() === "PATCH"
      );

      await recipesPage.editStep(0, "Edited step text");
      await updateResponse;

      await expect(recipesPage.getStepText(0)).toContainText(
        "Edited step text"
      );
    });

    test("should delete a step", async ({ page }) => {
      // First add another step so we have 2
      await recipesPage.addStep("Second step");
      await page.waitForTimeout(500);

      const updateResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/recipes/${recipeId}`) &&
          response.request().method() === "PATCH"
      );

      await recipesPage.deleteStep(0);
      await updateResponse;

      const stepCount = await recipesPage.getStepCount();
      expect(stepCount).toBe(1);
    });
  });

  test.describe("Recipe Edit and Delete", () => {
    let recipeId: string;

    test.beforeEach(async ({ page }) => {
      const recipe = await createRecipeViaApi(parentUser, {
        name: "Edit Delete Recipe",
        description: "Recipe for edit/delete testing",
        durationMinutes: 20,
        tags: ["test"],
      });
      recipeId = recipe._id;

      await recipesPage.gotoRecipeDetail(recipeId, "en-US");
      await waitForPageLoad(page);
    });

    test("should open edit dialog with pre-filled values", async () => {
      await recipesPage.openEditDialog();

      await expect(recipesPage.editDialog).toBeVisible();
      await expect(recipesPage.editNameInput).toHaveValue("Edit Delete Recipe");
    });

    test("should update recipe metadata", async ({ page }) => {
      await recipesPage.openEditDialog();
      await recipesPage.fillEditForm({
        name: "Updated Recipe Name",
        description: "Updated description",
      });

      const updateResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/recipes/${recipeId}`) &&
          response.request().method() === "PATCH"
      );

      await recipesPage.submitEditForm();
      await updateResponse;

      await expect(recipesPage.editDialog).not.toBeVisible();
      await expect(recipesPage.detailTitle).toHaveText("Updated Recipe Name");
    });

    test("should delete recipe and navigate to list", async ({ page }) => {
      const deleteResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/recipes/${recipeId}`) &&
          response.request().method() === "DELETE"
      );

      await recipesPage.deleteRecipe();
      await deleteResponse;

      // Should navigate back to recipes list
      await expect(page).toHaveURL(/\/app\/recipes$/);
    });

    test("should delete recipe from list page menu", async ({ page }) => {
      await recipesPage.gotoRecipes("en-US");
      await waitForPageLoad(page);

      await recipesPage.openRecipeCardMenu(recipeId);

      const deleteResponse = page.waitForResponse(
        (response) =>
          response.url().includes(`/recipes/${recipeId}`) &&
          response.request().method() === "DELETE"
      );

      await recipesPage.getRecipeCardDeleteButton(recipeId).click();
      await deleteResponse;

      await expect(recipesPage.emptyState).toBeVisible();
    });
  });

  test.describe("Responsive Layout", () => {
    test("should show mobile create button on small screens", async ({
      page,
    }) => {
      await setViewport(page, "mobile");
      await recipesPage.gotoRecipes("en-US");
      await waitForPageLoad(page);

      await expect(recipesPage.createRecipeButtonMobile).toBeVisible();
      await expect(recipesPage.createRecipeButton).not.toBeVisible();
    });

    test("should show desktop create button on large screens", async () => {
      await expect(recipesPage.createRecipeButton).toBeVisible();
      await expect(recipesPage.createRecipeButtonMobile).not.toBeVisible(); // Mobile button hidden on desktop
    });
  });
});
