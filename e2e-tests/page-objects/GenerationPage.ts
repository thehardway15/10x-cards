import type { Page } from '@playwright/test';

export class GenerationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/generate');
  }

  async enterSourceText(text: string) {
    await this.page.waitForSelector('[data-testid="source-text-input"]', { timeout: 10000 });
    const textarea = this.page.locator('[data-testid="source-text-input"]');
    await textarea.click(); // Upewnij się, że pole jest aktywne
    await textarea.fill(''); // Wyczyść pole
    await textarea.type(text); // Wpisz tekst znak po znaku (symuluje użytkownika)
  }

  async clickGenerateButton() {
    await this.page.getByRole('button', { name: 'Generate Flashcards' }).click();
  }

  async getCharacterCount() {
    const countText = await this.page.locator('.text-muted-foreground').textContent();
    return countText ? parseInt(countText.split('/')[0].trim()) : 0;
  }

  async getFlashcardCandidateCount() {
    await this.page.waitForSelector('[data-testid^="candidate-item-"]', { timeout: 5000 });
    return await this.page.locator('[data-testid^="candidate-item-"]').count();
  }

  async clickAcceptAllButton() {
    await this.page.getByRole('button', { name: /Accept All/ }).click();
  }

  async acceptCandidate(index: number) {
    const candidate = this.page.locator('[data-testid^="candidate-item-"]').nth(index);
    await candidate.waitFor({ state: 'visible', timeout: 5000 });
    const acceptButton = candidate.getByRole('button', { name: /Accept/i });
    await acceptButton.waitFor({ state: 'visible', timeout: 5000 });
    await acceptButton.click();
  }

  async editCandidate(index: number) {
    await this.page.getByTestId(/^candidate-item/).nth(index)
      .getByRole('button', { name: 'Edit' }).click();
  }

  async rejectCandidate(index: number) {
    await this.page.getByTestId(/^candidate-item/).nth(index)
      .getByRole('button', { name: 'Reject' }).click();
  }

  async confirmReject() {
    await this.page.getByRole('button', { name: 'Reject' }).click();
  }

  async cancelReject() {
    await this.page.getByRole('button', { name: 'Cancel' }).click();
  }
}