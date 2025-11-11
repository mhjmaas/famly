import { expect, test } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { waitForPageLoad } from "../setup/test-helpers";
import { authenticateUser } from "../helpers/auth";

test.describe("Authentication - Registration Flow", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.gotoGetStarted();
    await waitForPageLoad(page);
  });

  test("should display deployment choice as first step", async () => {
    // Check deployment choice card is visible
    await expect(authPage.deploymentChoiceCard).toBeVisible();

    // Check both deployment options are present
    await expect(authPage.deploymentSelfHosted).toBeVisible();
    await expect(authPage.deploymentCloud).toBeVisible();

    // Progress indicator should not be visible on first step
    await expect(authPage.getStartedProgress).not.toBeVisible();
  });

  test("should proceed to registration after selecting cloud deployment", async () => {
    // Select cloud deployment
    await authPage.selectDeployment("cloud");

    // Should show registration card
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Progress indicator should be visible
    await expect(authPage.getStartedProgress).toBeVisible();

    // All registration fields should be present
    await expect(authPage.registerName).toBeVisible();
    await expect(authPage.registerEmail).toBeVisible();
    await expect(authPage.registerBirthdate).toBeVisible();
    await expect(authPage.registerPassword).toBeVisible();
    await expect(authPage.registerConfirmPassword).toBeVisible();
    await expect(authPage.registerSubmit).toBeVisible();
  });

  test("should validate password matching", async () => {
    // Select cloud deployment
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Fill in registration form with mismatched passwords
    await authPage.register({
      name: "Test User",
      email: "test@example.com",
      birthdate: "1990-01-01",
      password: "password123",
      confirmPassword: "differentpassword",
    });

    // Should show error
    await expect(authPage.registerError).toBeVisible({ timeout: 2000 });
    await expect(authPage.registerError).toContainText("do not match");
  });

  test("should require all registration fields", async () => {
    // Select cloud deployment
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Try to submit without filling fields
    await authPage.registerSubmit.click();

    // Should still be on registration step (HTML5 validation)
    await expect(authPage.registerCard).toBeVisible();
  });

  test("should validate minimum password length", async () => {
    // Select cloud deployment
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Fill in registration form with short password
    await authPage.registerName.fill("Test User");
    await authPage.registerEmail.fill("test@example.com");
    await authPage.registerBirthdate.fill("1990-01-01");
    await authPage.registerPassword.fill("short");
    await authPage.registerConfirmPassword.fill("short");

    // Try to submit
    await authPage.registerSubmit.click();

    // Should still be on registration step (HTML5 validation for minLength)
    await expect(authPage.registerCard).toBeVisible();
  });

  test("should show error for duplicate email", async ({ page }) => {
    // First, create a user to ensure the email exists
    const existingUser = await authenticateUser(page, {
      emailPrefix: "duplicate",
      name: "First User",
    });

    // Clear authentication so we can access the registration page
    await page.context().clearCookies();

    // Now try to register with the same email
    await authPage.gotoGetStarted();
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Fill in registration form with email that already exists
    await authPage.register({
      name: "Test User",
      email: existingUser.email,
      birthdate: "1990-01-01",
      password: "password123",
      confirmPassword: "password123",
    });

    // Should show error for duplicate email
    await expect(authPage.registerError).toBeVisible({ timeout: 5000 });
  });

  test("should proceed to family creation after successful registration", async () => {
    // Select cloud deployment
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Fill in registration form with unique email
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await authPage.register({
      name: "Test User",
      email: uniqueEmail,
      birthdate: "1990-01-01",
      password: "password123",
      confirmPassword: "password123",
    });

    // Should show family creation card
    await expect(authPage.familyCard).toBeVisible({ timeout: 5000 });

    // Progress should show step 2
    await expect(authPage.getStartedProgress).toBeVisible();

    // Family name field should be present
    await expect(authPage.familyName).toBeVisible();
    await expect(authPage.familySubmit).toBeVisible();
  });

  test("should require family name", async () => {
    // Navigate through to family step
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    const uniqueEmail = `test-${Date.now()}@example.com`;
    await authPage.register({
      name: "Test User",
      email: uniqueEmail,
      birthdate: "1990-01-01",
      password: "password123",
      confirmPassword: "password123",
    });

    await expect(authPage.familyCard).toBeVisible({ timeout: 5000 });

    // Try to submit without family name
    await authPage.familySubmit.click();

    // Should still be on family step (HTML5 validation)
    await expect(authPage.familyCard).toBeVisible();
  });

  test("should complete full registration flow and redirect to app", async ({
    page,
  }) => {
    // Step 1: Select cloud deployment
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Step 2: Register account
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await authPage.register({
      name: "Test User",
      email: uniqueEmail,
      birthdate: "1990-01-01",
      password: "password123",
      confirmPassword: "password123",
    });

    await expect(authPage.familyCard).toBeVisible({ timeout: 5000 });

    // Step 3: Create family
    await authPage.createFamily("Test Family");

    // Should redirect to app page
    await page.waitForURL("**/app", { timeout: 10000 });
    expect(page.url()).toContain("/app");

    // Verify we're on the app page
    await expect(
      page.getByRole("heading", { name: "Welcome back" }),
    ).toBeVisible();
  });

  test("should disable submit buttons while loading", async () => {
    // Select cloud deployment
    await authPage.selectDeployment("cloud");
    await expect(authPage.registerCard).toBeVisible({ timeout: 2000 });

    // Fill in registration form
    await authPage.registerName.fill("Test User");
    await authPage.registerEmail.fill("test@example.com");
    await authPage.registerBirthdate.fill("1990-01-01");
    await authPage.registerPassword.fill("password123");
    await authPage.registerConfirmPassword.fill("password123");

    // Submit form
    await authPage.registerSubmit.click();

    // Button should be disabled immediately
    await expect(authPage.registerSubmit).toBeDisabled();
  });

  test("should redirect authenticated users to app page", async ({ page }) => {
    // Authenticate with real user session
    await authenticateUser(page);

    // Navigate to get-started page
    await authPage.gotoGetStarted();

    // Should be redirected to app page
    await page.waitForURL("**/app", { timeout: 5000 });
    expect(page.url()).toContain("/app");
  });
});
