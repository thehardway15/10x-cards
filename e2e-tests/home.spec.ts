import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';

test.describe('Home page', () => {
  test('should display welcome message', async ({ page }) => {
    // Using Page Object Model for better maintenance
    const homePage = new HomePage(page);
    
    // Navigate to the home page
    await homePage.goto();
    
    // Verify the title is visible
    await homePage.expectTitleVisible();
    
    // Example of screenshot capture for visual comparison
    await page.screenshot({ path: 'homepage-test.png' });
  });
  
  // Example of using custom expect methods from Page Object Model
  test('welcome message contains expected text', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.expectWelcomeMessageContains('Create effective flashcards with the power of AI');
  });
}); 