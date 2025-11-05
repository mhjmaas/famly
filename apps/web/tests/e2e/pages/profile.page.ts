import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Profile Page
 */
export class ProfilePage {
  readonly page: Page;

  // Header elements
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;

  // Desktop header preferences (hidden on mobile/tablet)
  readonly desktopLanguageSelector: Locator;
  readonly desktopThemeToggle: Locator;

  // User Profile Card elements
  readonly profileCard: Locator;
  readonly userAvatar: Locator;
  readonly userName: Locator;
  readonly userAge: Locator;
  readonly userRole: Locator;
  readonly karmaAmount: Locator;
  readonly profileMenu: Locator;

  // Preferences Card (visible on mobile/tablet, hidden on desktop)
  readonly preferencesCard: Locator;
  readonly mobileLanguageSelector: Locator;
  readonly mobileThemeToggle: Locator;

  // Activity Timeline elements
  readonly activityTimelineSection: Locator;
  readonly activityTitle: Locator;
  readonly activitySubtitle: Locator;
  readonly activityEvents: Locator;
  readonly noEventsMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.getByTestId("profile-title");
    this.pageSubtitle = page.getByTestId("profile-subtitle");

    // Desktop preferences (in header, visible lg+)
    this.desktopLanguageSelector = page
      .getByTestId("profile-desktop-preferences")
      .getByRole("button")
      .first();
    this.desktopThemeToggle = page
      .getByTestId("profile-desktop-preferences")
      .getByRole("button")
      .last();

    // User Profile Card
    this.profileCard = page.getByTestId("user-profile-card");
    this.userAvatar = page.getByTestId("profile-user-avatar");
    this.userName = page.getByTestId("profile-user-name");
    this.userAge = page.getByTestId("profile-user-age");
    this.userRole = page.getByTestId("profile-user-role");
    this.karmaAmount = page.getByTestId("profile-user-karma");
    this.profileMenu = page.getByTestId("profile-menu-button");

    // Preferences Card (mobile/tablet only, hidden lg+)
    this.preferencesCard = page.getByTestId("preferences-card");
    this.mobileLanguageSelector = page
      .getByTestId("preference-language")
      .getByRole("button")
      .first();
    this.mobileThemeToggle = page
      .getByTestId("preference-theme")
      .getByRole("button")
      .first();

    // Activity Timeline
    this.activityTimelineSection = page.getByTestId("activity-timeline");
    this.activityTitle = page.getByTestId("activity-title");
    this.activitySubtitle = page.getByTestId("activity-subtitle");
    this.activityEvents = page.getByTestId("activity-event");
    this.noEventsMessage = page.getByTestId("activity-no-events");
  }

  /**
   * Navigate to profile page
   */
  async gotoProfile(locale = "en-US") {
    await this.page.goto(`/${locale}/app/profile`);
  }

  /**
   * Get the displayed user name
   */
  async getUserName(): Promise<string | null> {
    return this.userName.textContent();
  }

  /**
   * Get the displayed age
   */
  async getUserAge(): Promise<string | null> {
    return this.userAge.textContent();
  }

  /**
   * Get the displayed karma amount
   */
  async getKarmaAmount(): Promise<string | null> {
    const karmaText = await this.karmaAmount.textContent();
    // Extract number from "X Karma" or "X Points"
    const match = karmaText?.match(/\d+/);
    return match ? match[0] : null;
  }

  /**
   * Check if activity events are visible
   */
  async hasActivityEvents(): Promise<boolean> {
    const count = await this.activityEvents.count();
    return count > 0;
  }

  /**
   * Get the count of activity events
   */
  async getActivityEventCount(): Promise<number> {
    return this.activityEvents.count();
  }

  /**
   * Check if "no events" message is visible
   */
  async hasNoEventsMessage(): Promise<boolean> {
    return this.noEventsMessage.isVisible().catch(() => false);
  }

  /**
   * Open profile menu dropdown
   */
  async openProfileMenu() {
    await this.profileMenu.click();
  }

  /**
   * Toggle theme (desktop version)
   */
  async toggleThemeDesktop() {
    await this.desktopThemeToggle.click();
  }

  /**
   * Toggle theme (mobile version)
   */
  async toggleThemeMobile() {
    await this.mobileThemeToggle.click();
  }

  /**
   * Open language selector (desktop version)
   */
  async openLanguageSelectorDesktop() {
    await this.desktopLanguageSelector.click();
  }

  /**
   * Open language selector (mobile version)
   */
  async openLanguageSelectorMobile() {
    await this.mobileLanguageSelector.click();
  }

  /**
   * Select a language from the dropdown
   */
  async selectLanguage(language: "English" | "Nederlands") {
    await this.page.getByRole("menuitem", { name: language }).click();
  }

  /**
   * Check if desktop preferences are visible
   */
  async isDesktopPreferencesVisible(): Promise<boolean> {
    return this.desktopLanguageSelector.isVisible();
  }

  /**
   * Check if mobile preferences card is visible
   */
  async isMobilePreferencesVisible(): Promise<boolean> {
    return this.preferencesCard.isVisible().catch(() => false);
  }

  /**
   * Get current theme from HTML element
   */
  async getCurrentTheme(): Promise<"light" | "dark" | "unknown"> {
    const theme = await this.page.evaluate(() => {
      const html = document.documentElement;
      if (html.classList.contains("dark")) return "dark";
      if (html.classList.contains("light")) return "light";
      return "unknown";
    });
    return theme;
  }

  /**
   * Wait for theme to change
   */
  async waitForThemeChange(expectedTheme: "light" | "dark") {
    await this.page.waitForFunction(
      (theme) => {
        const html = document.documentElement;
        return html.classList.contains(theme);
      },
      expectedTheme,
      { timeout: 3000 },
    );
  }

  /**
   * Get current URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}
