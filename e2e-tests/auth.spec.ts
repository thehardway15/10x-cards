import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');

    // Check if token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();

    // Check if user is redirected to generate page
    await expect(page).toHaveURL('/generate');
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');

    // Check if error message is displayed
    await expect(page.getByText('Invalid login credentials')).toBeVisible();

    // Check if token is not stored
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('should maintain authentication across page reloads', async ({ page }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await expect(page).toHaveURL('/generate');

    // Reload page
    await page.reload();

    // Check if still authenticated
    await expect(page.getByTestId('user-menu')).toBeVisible();
    await expect(page).not.toHaveURL('/login');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await expect(page).toHaveURL('/generate');

    // Click logout button
    await page.getByRole('button', { name: 'Sign out' }).click();

    // Check if token is removed from localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();

    // Check if redirected to login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/generate');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to generate when accessing login/register while authenticated', async ({ page }) => {
    // Login first
    await loginPage.goto();
    await loginPage.login('test@example.com', 'password123');
    await expect(page).toHaveURL('/generate');

    // Try to access login page
    await page.goto('/login');
    await expect(page).toHaveURL('/generate');

    // Try to access register page
    await page.goto('/register');
    await expect(page).toHaveURL('/generate');
  });
});