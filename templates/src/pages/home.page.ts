// path: src/pages/home.page.ts

import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { Urls } from '@config/urls.config';

/**
 * Page Object for the application's landing page.
 *
 * Created during framework setup as the first real page object and as the
 * worked example every later page object is modelled on.
 */
export class HomePage extends BasePage {
  // ─── Locators ────────────────────────────────────────────────────────────────

  {{HOME_LOCATORS}}

  // ─── Actions ─────────────────────────────────────────────────────────────────

  /** Navigate to the application's landing page. */
  async open(): Promise<void> {
    await this.goto(Urls.home);
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  /** Assert the landing page rendered. */
  async isLoaded(): Promise<void> {
    {{HOME_READINESS}}
  }
}
