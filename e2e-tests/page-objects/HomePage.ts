import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly title: Locator;
  readonly welcomeMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('h1');
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
  }

  async goto() {
    await this.page.goto('/');
  }

  async expectTitleVisible() {
    await expect(this.title).toBeVisible();
  }

  async expectWelcomeMessageContains(text: string) {
    await expect(this.welcomeMessage).toContainText(text);
  }

  async takeScreenshot() {
    await this.page.screenshot({ path: 'homepage.png' });
  }
} 