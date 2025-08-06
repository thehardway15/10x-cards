import type { Page } from "@playwright/test";

export class EditFlashcardModal {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async isVisible() {
    await this.page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
    return true;
  }

  async getFrontText() {
    return await this.page.getByLabel(/Front Side/).inputValue();
  }

  async getBackText() {
    return await this.page.getByLabel(/Back Side/).inputValue();
  }

  async setFrontText(text: string) {
    await this.page.getByLabel(/Front Side/).fill(text);
  }

  async setBackText(text: string) {
    await this.page.getByLabel(/Back Side/).fill(text);
  }

  async saveChanges() {
    const button = this.page.getByRole("button", { name: "Save Changes" });
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }

  async cancel() {
    await this.page.getByRole("button", { name: "Cancel" }).click();
  }
}
