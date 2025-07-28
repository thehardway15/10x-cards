# E2E Testing with Playwright

This directory contains end-to-end tests using Playwright.

## Directory Structure

- `e2e-tests/` - Root directory for E2E tests
  - `page-objects/` - Page Object Models for better test maintainability
  - `fixtures/` - Test fixtures and data
  - `*.spec.ts` - Test files

## Running Tests

- `npm run test:e2e` - Run all E2E tests
- `npm run test:e2e:ui` - Run tests with UI for debugging
- `npm run test:e2e:codegen` - Generate tests using Playwright's codegen tool

## Page Object Model (POM)

We use the Page Object Model pattern to make tests more maintainable. This separates the test logic from the page structure.

Example of a Page Object:

```ts
// page-objects/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="submit-button"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(text: string) {
    await expect(this.errorMessage).toContainText(text);
  }
}
```

## Visual Testing

To perform visual comparison testing:

```ts
// Capture screenshot for comparison
await expect(page).toHaveScreenshot('login-page.png');
```

## Traces and Debugging

Traces are automatically captured on test failure. You can view them using:

```bash
npx playwright show-trace trace.zip
```

## Test Data and Fixtures

Store test data in the fixtures directory and use Playwright fixtures for setup/teardown:

```ts
import { test as base } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';

// Define a custom fixture
type MyFixtures = {
  loginPage: LoginPage;
};

// Extend the base test with our fixture
const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
});

// Use the fixture in tests
test('login should work', async ({ loginPage }) => {
  await loginPage.login('user@example.com', 'password');
  // assertions...
});
``` 