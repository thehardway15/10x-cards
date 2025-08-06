import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByTestId("login-email").fill(email);
    await this.page.getByTestId("login-password").fill(password);
    await this.page.getByTestId("login-button").click();
  }

  async getErrorMessage() {
    return this.page.getByRole("alert").textContent();
  }

  async isLoggedIn() {
    return this.page.getByTestId("user-menu").isVisible();
  }
}
