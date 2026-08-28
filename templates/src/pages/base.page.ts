// path: src/pages/base.page.ts

import { Page, Locator, expect } from '@playwright/test';
import { TestConfig } from '@config/test.config';
import { Logger } from '@utils/logger';

/**
 * Abstract base class for all page objects.
 * Provides shared navigation helpers and common wait strategies.
 * All page objects should extend this class.
 */
export abstract class BasePage {
  protected readonly logger: Logger;

  constructor(protected readonly page: Page) {
    this.logger = new Logger(this.constructor.name);
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────

  /**
   * Navigate to the given URL and wait for DOM content loaded.
   * Page readiness is verified by each page's isLoaded() method.
   * @param url - Absolute or relative URL to navigate to
   */
  async goto(url: string): Promise<void> {
    this.logger.info(`Navigating to: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: TestConfig.timeouts.navigation,
    });
  }

  /** Reload the current page and wait for DOM content loaded. */
  async reload(): Promise<void> {
    this.logger.info('Reloading page');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  /** Navigate back in browser history. */
  async goBack(): Promise<void> {
    await this.page.goBack({ waitUntil: 'domcontentloaded' });
  }

  // ─── Waits ───────────────────────────────────────────────────────────────────

  /**
   * Assert a locator is visible (web-first, auto-retries until timeout).
   * @param locator - Playwright Locator to assert
   * @param timeout - Optional custom timeout in ms
   */
  async waitForVisible(
    locator: Locator,
    timeout = TestConfig.timeouts.elementVisible,
  ): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Assert a locator is hidden or detached (web-first, auto-retries until timeout).
   * @param locator - Playwright Locator to assert
   * @param timeout - Optional custom timeout in ms
   */
  async waitForHidden(
    locator: Locator,
    timeout = TestConfig.timeouts.elementVisible,
  ): Promise<void> {
    await expect(locator).toBeHidden({ timeout });
  }

  /**
   * Assert the current page URL matches a string or regexp (web-first, auto-retries).
   * @param urlOrRegexp - Expected URL string or pattern
   */
  async waitForUrl(urlOrRegexp: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(urlOrRegexp, {
      timeout: TestConfig.timeouts.navigation,
    });
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  /** Return the current page title. */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /** Return the current page URL. */
  getCurrentUrl(): string {
    return this.page.url();
  }

  // ─── Abstract contract ───────────────────────────────────────────────────────

  /**
   * Each page object must expose a method that confirms the page is loaded.
   * Used by fixtures and specs to assert correct navigation after actions.
   */
  abstract isLoaded(): Promise<void>;
}
