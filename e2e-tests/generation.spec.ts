import { test, expect } from "./fixtures/generation-fixtures";
import { GenerationPage } from "./page-objects/GenerationPage";
import { prepareForScreenshot } from "./fixtures/visual-test-helpers";

test.describe("Flashcard Generation", () => {
  test("should generate flashcards from source text", async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();

    // Act
    await generationPage.enterSourceText("This is a sample text with at least 1000 characters...".repeat(20));
    await generationPage.clickGenerateButton();

    // Assert
    expect(await generationPage.getFlashcardCandidateCount()).toBe(3);

    // Wait for candidates to load and prepare for stable screenshot
    await page.waitForSelector('[data-testid="candidate-list"]', { timeout: 10000 });
    await prepareForScreenshot(page);

    await expect(page).toHaveScreenshot("generation-results.png");
  });

  test("should show validation message for short text", async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();

    // Act
    await generationPage.enterSourceText("Too short text");

    // Assert
    await expect(page.getByText("Text must be at least 1,000 characters")).toBeVisible();
    expect(await page.getByRole("button", { name: "Generate Flashcards" })).toBeDisabled();
  });

  test("should show validation message for long text", async ({ page }) => {
    // Arrange
    const generationPage = new GenerationPage(page);
    await generationPage.navigate();

    // Act
    await generationPage.enterSourceText("A".repeat(11000));

    // Assert
    await expect(page.getByText("Text must not exceed 10,000 characters")).toBeVisible();
    expect(await page.getByRole("button", { name: "Generate Flashcards" })).toBeDisabled();
  });
});
