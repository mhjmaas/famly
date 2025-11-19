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
  readonly pageHeading: Locator;

  // User profile details
  readonly userName: Locator;
  readonly userFamily: Locator;

  // Dashboard overview locators
  readonly karmaCard: Locator;
  readonly karmaAmount: Locator;
  readonly pendingTasksCard: Locator;
  readonly pendingTasksCount: Locator;
  readonly potentialKarmaCard: Locator;
  readonly potentialKarmaAmount: Locator;
  readonly pendingTasksSection: Locator;
  readonly taskCards: Locator;
  readonly emptyTasksState: Locator;
  readonly rewardProgressSection: Locator;
  readonly rewardCards: Locator;
  readonly emptyRewardsState: Locator;
  readonly tasksViewAll: Locator;
  readonly rewardsViewAll: Locator;

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
    this.pageHeading = page.locator("h1");

    // User profile details
    this.userName = page.getByTestId("user-name");
    this.userFamily = page.getByTestId("user-family");

    // Dashboard overview locators
    this.karmaCard = page.getByTestId("dashboard-karma-card");
    this.karmaAmount = page.getByTestId("karma-amount");
    this.pendingTasksCard = page.getByTestId("dashboard-pending-tasks-card");
    this.pendingTasksCount = page.getByTestId("pending-tasks-count");
    this.potentialKarmaCard = page.getByTestId("dashboard-potential-karma-card");
    this.potentialKarmaAmount = page.getByTestId("potential-karma-amount");
    this.pendingTasksSection = page.getByTestId("pending-tasks-section");
    this.taskCards = page.getByTestId("task-card");
    this.emptyTasksState = page.getByTestId("empty-tasks-state");
    this.rewardProgressSection = page.getByTestId("reward-progress-section");
    this.rewardCards = page.getByTestId("reward-progress-card");
    this.emptyRewardsState = page.getByTestId("empty-rewards-state");
    this.tasksViewAll = this.pendingTasksSection.getByRole("link", {
      name: /view all/i,
    });
    this.rewardsViewAll = this.rewardProgressSection.getByRole("link", {
      name: /view all/i,
    });
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
    return (
      this.page.url().includes("/app") && !this.page.url().includes("/app/")
    );
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

  /**
   * Get available karma amount
   */
  async getKarmaAmount(): Promise<number> {
      const text = await this.karmaAmount.textContent();
      const match = text?.match(/[-]?\d+/); // Match optional minus sign followed by digits
      return match ? Number(match[0]) : 0;
  }

  /**
   * Get pending tasks count
   */
  async getPendingTasksCount(): Promise<number> {
    const text = await this.pendingTasksCount.textContent();
    return parseInt(text || "0", 10);
  }

  /**
   * Get potential karma amount
   */
  async getPotentialKarma(): Promise<number> {
    const text = await this.potentialKarmaAmount.textContent();
    return parseInt(text || "0", 10);
  }

  /**
   * Get number of task cards displayed
   */
  async getTaskCardsCount(): Promise<number> {
    return this.taskCards.count();
  }

  /**
   * Get number of reward cards displayed
   */
  async getRewardCardsCount(): Promise<number> {
    return this.rewardCards.count();
  }

  /**
   * Check if empty tasks state is visible
   */
  async isEmptyTasksStateVisible(): Promise<boolean> {
    return this.emptyTasksState.isVisible();
  }

  /**
   * Check if empty rewards state is visible
   */
  async isEmptyRewardsStateVisible(): Promise<boolean> {
    return this.emptyRewardsState.isVisible();
  }

  /**
   * Click "View All" button in tasks section
   */
  async clickTasksViewAll() {
    await this.tasksViewAll.click();
  }

  /**
   * Click "View All" button in rewards section
   */
  async clickRewardsViewAll() {
    await this.rewardsViewAll.click();
  }

  /**
   * Click on a specific task card
   */
  async clickTaskCard(index: number) {
    await this.taskCards.nth(index).click();
  }

  /**
   * Click on a specific reward card
   */
  async clickRewardCard(index: number) {
    await this.rewardCards.nth(index).click();
  }
}
