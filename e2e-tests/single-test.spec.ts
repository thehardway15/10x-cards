import { test, expect } from "./fixtures/generation-fixtures";
import { GenerationPage } from "./page-objects/GenerationPage";

test("should accept a flashcard candidate", async ({ page }) => {
  const generationPage = new GenerationPage(page);
  await generationPage.navigate();
  await generationPage.enterSourceText("This is a sample text with at least 1000 characters...".repeat(20));
  await generationPage.clickGenerateButton();

  // Act
  await generationPage.acceptCandidate(0);

  // Assert
  await expect(page.getByText("Flashcard saved successfully!")).toBeVisible();
});
