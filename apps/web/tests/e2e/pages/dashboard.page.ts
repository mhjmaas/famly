import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Dashboard Pages and Navigation
 */
export class DashboardPage {
  readonly page: Page;

  // Mobile header locators
  readonly mobileHeader: Locator;
  readonly mobileMenuButton: Locator;
  readonly mobileDrawer: Locator;
  readonly mobilePageTitle: Locator;

  // Desktop sidebar locators
  readonly desktopSidebar: Locator;
  readonly desktopLogo: Locator;
  readonly desktopNavigation: Locator;
  readonly desktopUserProfile: Locator;

  // Tablet sidebar locators
  readonly tabletSidebar: Locator;
  readonly tabletLogo: Locator;
  readonly tabletNavigation: Locator;
  readonly tabletUserProfile: Locator;

  // Navigation items (using testIds)
  readonly navDashboard: Locator;
  readonly navFamilySection: Locator;
  readonly navMembers: Locator;
  readonly navTasks: Locator;
  readonly navShoppingLists: Locator;
  readonly navRewards: Locator;
  readonly navCalendar: Locator;
  readonly navLocations: Locator;
  readonly navMemories: Locator;
  readonly navAiSettings: Locator;
  readonly navPersonalSection: Locator;
  readonly navDiary: Locator;
  readonly navChat: Locator;
  readonly navSettings: Locator;

  // Content area
  readonly mainContent: Locator;
  readonly pageContent: Locator;

  // User profile details
  readonly userName: Locator;
  readonly userFamily: Locator;

  constructor(page: Page) {
    this.page = page;

    // Mobile header
    this.mobileHeader = page.getByTestId("mobile-header");
    this.mobileMenuButton = page.getByTestId("mobile-menu-button");
    this.mobileDrawer = page.getByTestId("mobile-drawer");
    this.mobilePageTitle = page.getByTestId("mobile-page-title");

    // Sidebars
    this.desktopSidebar = page.getByTestId("desktop-sidebar");
    this.desktopLogo = page.getByTestId("desktop-logo");
    this.desktopNavigation = page.getByTestId("desktop-navigation");
    this.desktopUserProfile = page.getByTestId("desktop-user-profile");

    this.tabletSidebar = page.getByTestId("tablet-sidebar");
    this.tabletLogo = page.getByTestId("tablet-logo");
    this.tabletNavigation = page.getByTestId("tablet-navigation");
    this.tabletUserProfile = page.getByTestId("tablet-user-profile");

    // Navigation items using testIds
    this.navDashboard = page.getByTestId("nav-dashboard");
    this.navFamilySection = page.getByTestId("nav-section-family");
    this.navMembers = page.getByTestId("nav-members");
    this.navTasks = page.getByTestId("nav-tasks");
    this.navShoppingLists = page.getByTestId("nav-shopping-lists");
    this.navRewards = page.getByTestId("nav-rewards");
    this.navCalendar = page.getByTestId("nav-calendar");
    this.navLocations = page.getByTestId("nav-locations");
    this.navMemories = page.getByTestId("nav-memories");
    this.navAiSettings = page.getByTestId("nav-ai-settings");
    this.navPersonalSection = page.getByTestId("nav-section-personal");
    this.navDiary = page.getByTestId("nav-diary");
    this.navChat = page.getByTestId("nav-chat");
    this.navSettings = page.getByTestId("nav-settings");

    // Content area
    this.mainContent = page.getByTestId("main-content");
    this.pageContent = page.getByTestId("page-content");

    // User profile details
    this.userName = page.getByTestId("user-name");
    this.userFamily = page.getByTestId("user-family");
  }

  /**
   * Navigate to app page
   */
  async gotoApp(locale = "en-US") {
    await this.page.goto(`/${locale}/app`);
  }

  /**
   * Navigate to a specific app page
   */
  async gotoAppPage(page: string, locale = "en-US") {
    await this.page.goto(`/${locale}/app/${page}`);
  }

  /**
   * Set authentication cookie (mock session)
   */
  async setAuthCookie() {
    await this.page.context().addCookies([
      {
        name: "better-auth.session_token",
        value: "mock-session-token",
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  /**
   * Check if desktop sidebar is visible
   */
  async isDesktopSidebarVisible(): Promise<boolean> {
    return this.desktopSidebar.isVisible();
  }

  /**
   * Check if tablet sidebar is visible
   */
  async isTabletSidebarVisible(): Promise<boolean> {
    return this.tabletSidebar.isVisible();
  }

  /**
   * Check if mobile header is visible
   */
  async isMobileHeaderVisible(): Promise<boolean> {
    return this.mobileHeader.isVisible();
  }

  /**
   * Open mobile drawer
   */
  async openMobileDrawer() {
    await this.mobileMenuButton.click();
  }

  /**
   * Close mobile drawer
   */
  async closeMobileDrawer() {
    // Click outside the drawer or press Escape
    await this.page.keyboard.press("Escape");
  }

  /**
   * Click on navigation item
   */
  async clickNavItem(item: Locator) {
    await item.click();
  }

  /**
   * Get current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Check if current page is dashboard
   */
  async isOnDashboard(): Promise<boolean> {
    return this.page.url().includes("/app") && !this.page.url().includes("/app/");
  }

  /**
   * Check if current page is family page
   */
  async isOnFamilyPage(): Promise<boolean> {
    return this.page.url().includes("/app/family");
  }

  /**
   * Get page heading text
   */
  async getPageHeadingText(): Promise<string | null> {
    return this.pageHeading.first().textContent();
  }
}
