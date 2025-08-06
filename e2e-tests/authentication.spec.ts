import { test, expect } from "@playwright/test";
import { LoginPage } from "./page-objects/LoginPage";
import { invalidCredentials } from "./fixtures/auth-fixtures";

test.describe("Authentication System", () => {
  test.describe("Login Flow", () => {
    let loginPage: LoginPage;

    test.beforeEach(async ({ page }) => {
      loginPage = new LoginPage(page);
      await loginPage.goto();
    });

    test("should have login form with correct elements", async ({ page }) => {
      // Verify that login form elements are present
      await expect(page.getByTestId("login-email")).toBeVisible();
      await expect(page.getByTestId("login-password")).toBeVisible();
      await expect(page.getByTestId("login-button")).toBeVisible();

      // Verify form has Sign In button
      const buttonText = await page.getByTestId("login-button").textContent();
      expect(buttonText).toContain("Sign in");
    });

    test("should remain on login page with invalid credentials", async ({ page }) => {
      // Act
      await loginPage.login(invalidCredentials.email, invalidCredentials.password);

      // Assert - Check we're still on a login page
      const url = page.url();
      expect(url).toContain("/login");

      // Verify form elements are still visible, meaning we're on the login page
      await expect(page.getByTestId("login-email")).toBeVisible();
      await expect(page.getByTestId("login-password")).toBeVisible();
    });

    test("should redirect to protected route when accessing it without auth", async ({ page }) => {
      // Act - Try to access a protected route
      await page.goto("/generate");

      // Assert - We should be redirected to some form of login page
      const url = page.url();
      expect(url).toContain("/login");
    });
  });
});
