import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Authentication Pages (Sign In and Get Started)
 */
export class AuthPage {
  readonly page: Page;

  // Sign In page locators
  readonly signInForm: Locator;
  readonly signInEmail: Locator;
  readonly signInPassword: Locator;
  readonly signInSubmit: Locator;
  readonly signInError: Locator;
  readonly signInGetStartedLink: Locator;

  // Get Started flow locators
  readonly getStartedFlow: Locator;
  readonly getStartedProgress: Locator;

  // Deployment choice step
  readonly deploymentChoiceCard: Locator;
  readonly deploymentSelfHosted: Locator;
  readonly deploymentCloud: Locator;

  // Register step
  readonly registerCard: Locator;
  readonly registerName: Locator;
  readonly registerEmail: Locator;
  readonly registerBirthdate: Locator;
  readonly registerPassword: Locator;
  readonly registerConfirmPassword: Locator;
  readonly registerSubmit: Locator;
  readonly registerError: Locator;

  // Family step
  readonly familyCard: Locator;
  readonly familyName: Locator;
  readonly familySubmit: Locator;
  readonly familyError: Locator;

  constructor(page: Page) {
    this.page = page;

    // Sign In
    this.signInForm = page.getByTestId("signin-form");
    this.signInEmail = page.getByTestId("signin-email");
    this.signInPassword = page.getByTestId("signin-password");
    this.signInSubmit = page.getByTestId("signin-submit");
    this.signInError = page.getByTestId("signin-error");
    this.signInGetStartedLink = page.getByTestId("signin-get-started-link");

    // Get Started
    this.getStartedFlow = page.getByTestId("get-started-flow");
    this.getStartedProgress = page.getByTestId("get-started-progress");

    // Deployment choice
    this.deploymentChoiceCard = page.getByTestId("deployment-choice-card");
    this.deploymentSelfHosted = page.getByTestId("deployment-self-hosted");
    this.deploymentCloud = page.getByTestId("deployment-cloud");

    // Register
    this.registerCard = page.getByTestId("register-card");
    this.registerName = page.getByTestId("register-name");
    this.registerEmail = page.getByTestId("register-email");
    this.registerBirthdate = page.getByTestId("register-birthdate");
    this.registerPassword = page.getByTestId("register-password");
    this.registerConfirmPassword = page.getByTestId(
      "register-confirm-password",
    );
    this.registerSubmit = page.getByTestId("register-submit");
    this.registerError = page.getByTestId("register-error");

    // Family
    this.familyCard = page.getByTestId("family-card");
    this.familyName = page.getByTestId("family-name");
    this.familySubmit = page.getByTestId("family-submit");
    this.familyError = page.getByTestId("family-error");
  }

  /**
   * Navigate to the sign-in page
   */
  async gotoSignIn(locale = "en-US") {
    await this.page.goto(`/${locale}/signin`);
  }

  /**
   * Navigate to the get-started page
   */
  async gotoGetStarted(locale = "en-US") {
    await this.page.goto(`/${locale}/get-started`);
  }

  /**
   * Fill and submit the sign-in form
   */
  async signIn(email: string, password: string) {
    await this.signInEmail.fill(email);
    await this.signInPassword.fill(password);
    await this.signInSubmit.click();
  }

  /**
   * Select deployment option
   */
  async selectDeployment(option: "cloud" | "self-hosted") {
    if (option === "cloud") {
      await this.deploymentCloud.click();
    } else {
      await this.deploymentSelfHosted.click();
    }
  }

  /**
   * Fill and submit the registration form
   */
  async register(data: {
    name: string;
    email: string;
    birthdate: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.registerName.fill(data.name);
    await this.registerEmail.fill(data.email);
    await this.registerBirthdate.fill(data.birthdate);
    await this.registerPassword.fill(data.password);
    await this.registerConfirmPassword.fill(data.confirmPassword);
    await this.registerSubmit.click();
  }

  /**
   * Fill and submit the family creation form
   */
  async createFamily(familyName: string) {
    await this.familyName.fill(familyName);
    await this.familySubmit.click();
  }

  /**
   * Check if user is on the app page
   */
  async isOnAppPage(): Promise<boolean> {
    return this.page.url().includes("/app");
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
