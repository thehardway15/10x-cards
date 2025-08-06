import type { Page } from "@playwright/test";

export class GenerationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto("/generate");
  }

  async enterSourceText(text: string) {
    await this.page.waitForSelector('[data-testid="source-text-input"]', { timeout: 10000 });
    const textarea = this.page.locator('[data-testid="source-text-input"]');

    // Clear the field first
    await textarea.click();
    await this.page.waitForTimeout(500);
    await textarea.fill("");

    // Use fill() for better performance with long text
    await textarea.fill(text);

    // Wait a bit longer for React Hook Form to process the change
    await this.page.waitForTimeout(3000);
  }

  async clickGenerateButton() {
    const generateButton = this.page.getByTestId("generate-button");

    // Czekaj aż przycisk będzie widoczny
    await generateButton.waitFor({ state: "visible", timeout: 10000 });

    // Czekaj aż przycisk nie będzie wyłączony
    await this.page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="generate-button"]');
        return button && !button.hasAttribute("disabled");
      },
      { timeout: 15000 }
    );

    await generateButton.click();
  }

  async getCharacterCount() {
    const countElement = this.page.locator(".absolute.bottom-2.right-2.text-sm.text-muted-foreground");
    const countText = await countElement.textContent();
    return countText ? parseInt(countText.split("/")[0].trim().replace(",", "")) : 0;
  }

  async getFlashcardCandidateCount() {
    await this.page.waitForSelector('[data-testid^="candidate-item-"]', { timeout: 15000 });
    return await this.page.locator('[data-testid^="candidate-item-"]').count();
  }

  async clickAcceptAllButton() {
    await this.page.getByRole("button", { name: /Accept All/ }).click();
  }

  async acceptCandidate(index: number) {
    const candidate = this.page.locator('[data-testid^="candidate-item-"]').nth(index);
    await candidate.waitFor({ state: "visible", timeout: 5000 });
    const acceptButton = candidate.getByRole("button", { name: /Accept/i });
    await acceptButton.waitFor({ state: "visible", timeout: 5000 });
    await acceptButton.click();
  }

  async editCandidate(index: number) {
    await this.page
      .getByTestId(/^candidate-item/)
      .nth(index)
      .getByRole("button", { name: "Edit" })
      .click();
  }

  async rejectCandidate(index: number) {
    await this.page
      .getByTestId(/^candidate-item/)
      .nth(index)
      .getByRole("button", { name: "Reject" })
      .click();
  }

  async confirmReject() {
    await this.page.getByRole("button", { name: "Reject" }).click();
  }

  async cancelReject() {
    await this.page.getByRole("button", { name: "Cancel" }).click();
  }
}
