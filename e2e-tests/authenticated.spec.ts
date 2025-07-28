import { expect } from '@playwright/test';
import { test } from './fixtures/test-fixtures';

test.describe('Authenticated user flows', () => {
  test('should show authenticated content', async ({ authenticatedPage }) => {
    // Test is using the authenticated fixture
    // which sets up cookies/storage to simulate logged in state
    
    // Example assertion for authenticated user
    await expect(authenticatedPage.page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
  
  test('should navigate to profile page', async ({ authenticatedPage }) => {
    // Click user menu
    await authenticatedPage.page.click('[data-testid="user-menu"]');
    
    // Click profile link
    await authenticatedPage.page.click('[data-testid="profile-link"]');
    
    // Check we are on profile page
    await expect(authenticatedPage.page).toHaveURL(/\/account/);
  });
}); 