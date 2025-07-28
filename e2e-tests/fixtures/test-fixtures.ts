import { test as base } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage';
import { testUsers } from './test-users';

// Define custom fixtures
export type TestFixtures = {
  homePage: HomePage;
  authenticatedPage: HomePage;
};

// Extend the base test with our fixtures
export const test = base.extend<TestFixtures>({
  // Create and navigate to HomePage
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await use(homePage);
  },
  
  // Fixture for authenticated user session
  authenticatedPage: async ({ page }, use) => {
    // Set storage state to simulate logged in user
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: 'test-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      }
    ]);
    
    const homePage = new HomePage(page);
    await homePage.goto();
    await use(homePage);
  }
}); 