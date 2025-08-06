import { test, expect } from "./fixtures/generation-fixtures";
import { GenerationPage } from "./page-objects/GenerationPage";
import { prepareForScreenshot } from "./fixtures/visual-test-helpers";

test.describe("Visual Regression Tests", () => {
  test("generation page should match snapshot", async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();

    // Prepare page for stable screenshot
    await prepareForScreenshot(page);

    await expect(page).toHaveScreenshot("generation-page-empty.png");
  });

  test("flashcard candidates should match snapshot", async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText("This is a sample text with at least 1000 characters...".repeat(20));
    await generationPage.clickGenerateButton();

    // Wait for candidates to load and prepare for screenshot
    await page.waitForSelector('[data-testid="candidate-list"]', { timeout: 10000 });
    await prepareForScreenshot(page);

    await expect(page).toHaveScreenshot("flashcard-candidates.png");
  });

  test("edit modal should match snapshot", async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText("This is a sample text with at least 1000 characters...".repeat(20));
    await generationPage.clickGenerateButton();

    // Wait for candidates to load
    await page.waitForSelector('[data-testid="candidate-list"]', { timeout: 10000 });

    await generationPage.editCandidate(0);

    // Wait for modal to open and prepare for screenshot
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await prepareForScreenshot(page);

    await expect(page).toHaveScreenshot("edit-flashcard-modal.png");
  });

  test("confirm dialog should match snapshot", async ({ page }) => {
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();
    await generationPage.enterSourceText("This is a sample text with at least 1000 characters...".repeat(20));
    await generationPage.clickGenerateButton();

    // Wait for candidates to load
    await page.waitForSelector('[data-testid="candidate-list"]', { timeout: 10000 });

    await generationPage.rejectCandidate(0);

    // Wait for confirm dialog to appear and prepare for screenshot
    await page.waitForSelector('[role="alertdialog"]', { timeout: 5000 });
    await prepareForScreenshot(page);

    await expect(page).toHaveScreenshot("confirm-reject-dialog.png");
  });
});
