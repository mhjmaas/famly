import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for the Landing Page
 * Contains all locators and helper methods for interacting with the landing page
 */
export class LandingPage {
  readonly page: Page;

  // Navigation locators
  readonly navigation: Locator;
  readonly logoLink: Locator;
  readonly featuresLink: Locator;
  readonly privacyLink: Locator;
  readonly pricingLink: Locator;
  readonly docsLink: Locator;
  readonly signInButton: Locator;
  readonly getStartedButton: Locator;

  // Section locators
  readonly heroSection: Locator;
  readonly featuresSection: Locator;
  readonly privacySection: Locator;
  readonly pricingSection: Locator;
  readonly footerSection: Locator;

  // Hero section elements
  readonly heroHeading: Locator;
  readonly heroSubheading: Locator;
  readonly heroCTAButtons: Locator;

  // Theme toggle
  readonly themeToggle: Locator;
  readonly lightThemeButton: Locator;
  readonly darkThemeButton: Locator;
  readonly autoThemeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation
    this.navigation = page.getByTestId('navigation');
    this.logoLink = page.getByTestId('nav-logo');
    this.featuresLink = page.getByTestId('nav-features');
    this.privacyLink = page.getByTestId('nav-privacy');
    this.pricingLink = page.getByTestId('nav-pricing');
    this.docsLink = page.getByTestId('nav-docs');
    this.signInButton = page.getByTestId('nav-signin');
    this.getStartedButton = page.getByTestId('nav-get-started');

    // Sections
    this.heroSection = page.getByTestId('hero-section');
    this.featuresSection = page.getByTestId('features-section');
    this.privacySection = page.getByTestId('privacy-section');
    this.pricingSection = page.getByTestId('pricing-section');
    this.footerSection = page.getByTestId('footer-section');

    // Hero elements
    this.heroHeading = page.getByTestId('hero-heading');
    this.heroSubheading = page.getByTestId('hero-subheading');
    this.heroCTAButtons = page.getByTestId('hero-cta');

    // Theme toggle
    this.themeToggle = page.getByTestId('theme-toggle');
    this.lightThemeButton = page.getByTestId('theme-light');
    this.darkThemeButton = page.getByTestId('theme-dark');
    this.autoThemeButton = page.getByTestId('theme-auto');
  }

  /**
   * Navigate to the landing page
   */
  async goto() {
    await this.page.goto('/en-US');
  }

  /**
   * Navigate to a specific section by clicking the nav link
   */
  async navigateToSection(section: 'features' | 'privacy' | 'pricing') {
    const linkMap = {
      features: this.featuresLink,
      privacy: this.privacyLink,
      pricing: this.pricingLink,
    };

    await linkMap[section].click();
    await this.page.waitForURL(`**/en-US#${section}`);
  }

  /**
   * Check if navigation has scrolled state (blurred background)
   */
  async isNavigationScrolled(): Promise<boolean> {
    const classes = await this.navigation.getAttribute('class');
    return classes?.includes('backdrop-blur') ?? false;
  }

  /**
   * Scroll the page by a specific amount
   */
  async scrollPage(pixels: number) {
    await this.page.evaluate((px) => window.scrollTo(0, px), pixels);
    // Wait for scroll effects to apply
    await this.page.waitForTimeout(300);
  }

  /**
   * Get the current theme
   */
  async getCurrentTheme(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
  }

  /**
   * Set the theme
   */
  async setTheme(theme: 'light' | 'dark' | 'auto') {
    const buttonMap = {
      light: this.lightThemeButton,
      dark: this.darkThemeButton,
      auto: this.autoThemeButton,
    };

    await buttonMap[theme].click();
    await this.page.waitForTimeout(100); // Wait for theme to apply
  }

  /**
   * Check if a section is visible in viewport
   */
  async isSectionVisible(section: 'hero' | 'features' | 'privacy' | 'pricing' | 'footer'): Promise<boolean> {
    const sectionMap = {
      hero: this.heroSection,
      features: this.featuresSection,
      privacy: this.privacySection,
      pricing: this.pricingSection,
      footer: this.footerSection,
    };

    return await sectionMap[section].isVisible();
  }

  /**
   * Scroll to a section
   */
  async scrollToSection(section: 'hero' | 'features' | 'privacy' | 'pricing' | 'footer') {
    const sectionMap = {
      hero: this.heroSection,
      features: this.featuresSection,
      privacy: this.privacySection,
      pricing: this.pricingSection,
      footer: this.footerSection,
    };

    await sectionMap[section].scrollIntoViewIfNeeded();
  }

  /**
   * Tab through navigation elements
   */
  async tabThroughNavigation() {
    await this.page.keyboard.press('Tab');
  }

  /**
   * Get all feature cards
   */
  async getFeatureCards() {
    return this.page.getByTestId('feature-card').all();
  }

  /**
   * Get pricing cards
   */
  async getPricingCards() {
    return {
      selfHosted: this.page.getByTestId('pricing-self-hosted'),
      cloud: this.page.getByTestId('pricing-cloud'),
    };
  }
}
